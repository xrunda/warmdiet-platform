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
   * 创建 AI 会诊报告
   */
  public createReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const payload = createAiConsultationSchema.parse(req.body);

    // 1. OCR 提取图片内容
    const extractedParts: string[] = [];
    for (const file of payload.files) {
      if (file.type === 'image') {
        const extracted = await aiConsultationService.extractImageContent(file.content);
        extractedParts.push(`--- 文件: ${file.name} ---\n${extracted}`);
      } else {
        extractedParts.push(`--- 文件: ${file.name} ---\n${file.content}`);
      }
    }
    const extractedContent = extractedParts.join('\n\n');

    // 2. 多模型诊疗分析
    const modelAnalysis = await aiConsultationService.analyzeWithAllModels(extractedContent);

    // 3. 会诊汇总
    const consultationSummary = await aiConsultationService.conductConsultation(modelAnalysis);

    // 4. 生成 HTML 报告（可选，失败不阻断主流程）
    let htmlReportUrl = '';
    let externalTaskId = '';
    try {
      const htmlResult = await aiConsultationService.generateHtmlReport(consultationSummary);
      htmlReportUrl = htmlResult.resultUrl || '';
      externalTaskId = htmlResult.taskId || '';
    } catch (error) {
      console.error('HTML 报告生成失败:', error);
    }

    // 5. 提取标签和风险等级
    const tags = this.extractTags(consultationSummary);
    const riskLevel = this.detectRiskLevel(consultationSummary);

    // 6. 持久化存储
    const report = this.models.aiConsultationReport.create({
      patientId,
      title: payload.title,
      sourceType: payload.sourceType,
      sourceFiles: JSON.stringify(payload.files.map((f) => ({ name: f.name, type: f.type }))),
      extractedContent,
      modelAnalysis: JSON.stringify(modelAnalysis),
      consultationSummary,
      htmlReportUrl,
      externalTaskId,
      status: htmlReportUrl ? 'completed' : 'processing',
      riskLevel,
      tags: JSON.stringify(tags),
      errorMessage: '',
    } as any);

    res.status(201).json({
      success: true,
      data: {
        ...report,
        sourceFiles: JSON.parse(report.sourceFiles || '[]'),
        modelAnalysis: JSON.parse(report.modelAnalysis || '{}'),
        tags: JSON.parse(report.tags || '[]'),
      },
      message: 'AI 会诊报告生成成功',
    });
  });

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
