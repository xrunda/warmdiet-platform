/**
 * AI 会诊控制器
 * 提供 REST API 接口：创建会诊、查询列表、获取最新报告
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import type { Models } from '../models';
import { aiConsultationService } from '../services/aiConsultationService';

const createAiConsultationSchema = z.object({
  title: z.string().min(1).max(120).default('AI 会诊报告'),
  sourceType: z.enum(['lab', 'checkup', 'imaging', 'mixed']).default('mixed'),
  files: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['image', 'text']),
      content: z.string(),
    })
  ).min(1),
});

export class AIConsultationController {
  constructor(private models: Models) {}

  /**
   * POST /api/ai-consultations/patient/:id
   * 创建 AI 会诊报告（异步模式：先创建 pending 记录立即返回，后台执行 AI 分析）
   */
  public createReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const payload = createAiConsultationSchema.parse(req.body);

    // 1. 先创建 pending 状态的记录并立即响应
    const report = this.models.aiConsultationReport.create({
      patientId,
      title: payload.title,
      sourceType: payload.sourceType,
      sourceFiles: JSON.stringify(payload.files.map((f) => ({ name: f.name, type: f.type, content: f.content }))),
      extractedContent: '',
      modelAnalysis: '{}',
      consultationSummary: '',
      htmlReportUrl: '',
      externalTaskId: '',
      status: 'pending',
      riskLevel: 'low',
      tags: '[]',
      errorMessage: '',
    } as any);

    // 2. 立即返回 pending 状态给前端
    res.status(201).json({
      success: true,
      data: {
        ...report,
        sourceFiles: JSON.parse(report.sourceFiles || '[]'),
        modelAnalysis: {},
        tags: [],
      },
      message: 'AI 会诊任务已创建，后台正在处理中',
    });

    // 3. 后台异步执行 AI 分析（不阻塞响应）
    this.processReportAsync(report.id, patientId, payload).catch((error) => {
      console.error(`[AI会诊] 后台处理失败 (reportId=${report.id}):`, error);
    });
  });

  /**
   * 后台异步处理 AI 会诊报告
   */
  private async processReportAsync(
    reportId: string,
    patientId: string,
    payload: { title: string; sourceType: string; files: { name: string; type: string; content: string }[] }
  ) {
    try {
      console.log(`[AI会诊] 开始处理报告 ${reportId}`);

      // 更新状态为 processing
      this.models.aiConsultationReport.update(reportId, { status: 'processing' } as any);

      // 1. OCR 提取图片内容
      const extractedParts: string[] = [];
      for (const file of payload.files) {
        if (file.type === 'image') {
          try {
            const extracted = await aiConsultationService.extractImageContent(file.content);
            extractedParts.push(`--- 文件: ${file.name} ---\n${extracted}`);
          } catch (e) {
            extractedParts.push(`--- 文件: ${file.name} ---\n[OCR 识别失败]`);
            console.error(`[AI会诊] OCR 失败 (${file.name}):`, e);
          }
        } else {
          extractedParts.push(`--- 文件: ${file.name} ---\n${file.content}`);
        }
      }
      const extractedContent = extractedParts.join('\n\n');

      // 保存 OCR 结果
      this.models.aiConsultationReport.update(reportId, { extractedContent } as any);

      // 2. 多模型诊疗分析
      const modelAnalysis = await aiConsultationService.analyzeWithAllModels(extractedContent);

      // 3. 会诊汇总
      let consultationSummary = '';
      try {
        consultationSummary = await aiConsultationService.conductConsultation(modelAnalysis);
      } catch (error) {
        console.error('[AI会诊] 会诊汇总失败，将使用模型分析结果作为 fallback:', error);
      }

      // Fallback: 如果会诊汇总为空，从 modelAnalysis 中组合生成
      if (!consultationSummary) {
        const parts: string[] = [];
        for (const [modelName, result] of Object.entries(modelAnalysis)) {
          if ((result as any)?.diagnosis) {
            parts.push(`## ${modelName} 分析\n\n${(result as any).diagnosis}`);
          }
        }
        consultationSummary = parts.join('\n\n---\n\n') || extractedContent;
        console.log('[AI会诊] 使用 modelAnalysis 作为 consultationSummary 的 fallback');
      }

      // 4. 生成 HTML 报告（可选，失败不阻断主流程）
      let htmlReportUrl = '';
      let externalTaskId = '';
      try {
        const htmlResult = await aiConsultationService.generateHtmlReport(consultationSummary);
        htmlReportUrl = htmlResult.resultUrl || '';
        externalTaskId = htmlResult.taskId || '';
      } catch (error) {
        console.error('[AI会诊] HTML 报告生成失败:', error);
      }

      // 5. 提取标签和风险等级
      const tags = this.extractTags(consultationSummary);
      const riskLevel = this.detectRiskLevel(consultationSummary);

      // 6. 更新报告为完成状态
      this.models.aiConsultationReport.update(reportId, {
        extractedContent,
        modelAnalysis: JSON.stringify(modelAnalysis),
        consultationSummary,
        htmlReportUrl,
        externalTaskId,
        status: 'completed',
        riskLevel,
        tags: JSON.stringify(tags),
      } as any);

      console.log(`[AI会诊] 报告 ${reportId} 处理完成`);
    } catch (error) {
      // 更新报告为失败状态
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[AI会诊] 报告 ${reportId} 处理失败:`, errorMessage);
      try {
        this.models.aiConsultationReport.update(reportId, {
          status: 'failed',
          errorMessage,
        } as any);
      } catch (e) {
        console.error(`[AI会诊] 更新失败状态时出错:`, e);
      }
    }
  }

  /**
   * GET /api/ai-consultations/patient/:id
   * 获取患者的 AI 会诊报告列表
   */
  public getReports = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const reports = this.models.aiConsultationReport.findByPatientId(patientId);
    res.json({
      success: true,
      data: reports.map((report) => ({
        ...report,
        sourceFiles: JSON.parse(report.sourceFiles || '[]'),
        modelAnalysis: JSON.parse(report.modelAnalysis || '{}'),
        tags: JSON.parse(report.tags || '[]'),
      })),
    });
  });

  /**
   * GET /api/ai-consultations/patient/:id/latest
   * 获取患者最新一份 AI 会诊报告
   */
  public getLatestReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const report = this.models.aiConsultationReport.findLatestByPatientId(patientId);
    if (!report) throw new AppError('暂无 AI 会诊报告', 404);
    res.json({
      success: true,
      data: {
        ...report,
        sourceFiles: JSON.parse(report.sourceFiles || '[]'),
        modelAnalysis: JSON.parse(report.modelAnalysis || '{}'),
        tags: JSON.parse(report.tags || '[]'),
      },
    });
  });

  /**
   * POST /api/ai-consultations/:reportId/retry-html
   * 重新生成 HTML 报告（用于 completed 但缺失 htmlReportUrl 的报告）
   */
  public retryHtmlReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.reportId;
    const report = this.models.aiConsultationReport.findById(reportId);
    if (!report) throw new AppError('报告不存在', 404);

    // 获取可用的报告内容
    let content = report.consultationSummary || '';
    if (!content) {
      // 从 modelAnalysis 组装
      try {
        const analysis = JSON.parse(report.modelAnalysis || '{}');
        const parts: string[] = [];
        for (const [modelName, result] of Object.entries(analysis)) {
          if ((result as any)?.diagnosis) {
            parts.push(`## ${modelName} 分析\n\n${(result as any).diagnosis}`);
          }
        }
        content = parts.join('\n\n---\n\n');
      } catch {}
    }
    if (!content && report.extractedContent) {
      content = report.extractedContent;
    }
    if (!content) {
      throw new AppError('报告无可用内容，无法生成 HTML 报告', 400);
    }

    // 先更新 consultationSummary（如果之前为空）
    if (!report.consultationSummary) {
      this.models.aiConsultationReport.update(reportId, {
        consultationSummary: content,
      } as any);
    }

    // 立即返回 processing 状态
    this.models.aiConsultationReport.update(reportId, {
      status: 'processing',
      errorMessage: '',
    } as any);

    res.json({
      success: true,
      message: '正在重新生成 HTML 报告',
    });

    // 后台异步生成
    (async () => {
      try {
        const htmlResult = await aiConsultationService.generateHtmlReport(content);
        const htmlReportUrl = htmlResult.resultUrl || '';
        const externalTaskId = htmlResult.taskId || '';

        this.models.aiConsultationReport.update(reportId, {
          htmlReportUrl,
          externalTaskId,
          status: 'completed',
        } as any);
        console.log(`[AI会诊] 报告 ${reportId} HTML 重新生成完成: ${htmlReportUrl}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[AI会诊] 报告 ${reportId} HTML 重新生成失败:`, errorMessage);
        this.models.aiConsultationReport.update(reportId, {
          status: 'completed',
          errorMessage: `HTML报告生成失败: ${errorMessage}`,
        } as any);
      }
    })();
  });

  /**
   * PATCH /api/ai-consultations/:reportId
   * 更新 AI 会诊报告（如修改标题）
   */
  public updateReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.reportId;
    const report = this.models.aiConsultationReport.findById(reportId);
    if (!report) throw new AppError('报告不存在', 404);
    const { title } = req.body;
    if (title && typeof title === 'string') {
      this.models.aiConsultationReport.update(reportId, { title: title.trim() } as any);
    }
    const updated = this.models.aiConsultationReport.findById(reportId);
    res.json({ success: true, data: updated });
  });

  /**
   * DELETE /api/ai-consultations/:reportId
   * 删除 AI 会诊报告
   */
  public deleteReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.reportId;
    const report = this.models.aiConsultationReport.findById(reportId);
    if (!report) throw new AppError('报告不存在', 404);
    this.models.aiConsultationReport.delete(reportId);
    res.json({ success: true, message: '报告已删除' });
  });

  /**
   * 从会诊摘要中检测风险等级
   */
  private detectRiskLevel(summary: string): 'low' | 'medium' | 'high' {
    if (/重点关注|高风险|立即|警示|严重|CKD|肾病|肿瘤/.test(summary)) return 'high';
    if (/观察|复查|异常|风险|建议就诊/.test(summary)) return 'medium';
    return 'low';
  }

  /**
   * 从会诊摘要中提取标签
   */
  private extractTags(summary: string): string[] {
    const candidates = [
      'CKD',
      '高胆固醇',
      '贫血',
      '心血管风险',
      '肾脏病',
      '复查',
      '随诊',
      '高血压',
      '糖尿病',
      '脂肪肝',
    ];
    return candidates.filter((tag) => summary.includes(tag));
  }
}

export function createAIConsultationController(models: Models) {
  return new AIConsultationController(models);
}
