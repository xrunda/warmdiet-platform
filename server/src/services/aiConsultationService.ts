/**
 * AI 会诊服务
 * 负责：图片 OCR 提取、多模型诊疗分析、会诊汇总、HTML 报告生成
 */

import { config } from '../config/env';

type ModelName = 'gemini' | 'deepseek' | 'kimi' | 'minimax';

type SingleDiagnosis = {
  diagnosis: string;
};

export class AIConsultationService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly htmlApiBaseUrl = config.aiConsultationApiBaseUrl;
  private readonly apiKeys = [config.openRouterApiKey, config.openRouterBackupApiKey].filter(Boolean);

  private readonly models: Record<ModelName, string> = {
    gemini: 'google/gemini-3.1-pro-preview',
    deepseek: 'deepseek/deepseek-v3.2',
    kimi: 'moonshotai/kimi-k2.5',
    minimax: 'minimax/minimax-m2.5',
  };

  private readonly ocrModels = [
    'qwen/qwen3-vl-32b-instruct',
    'nvidia/nemotron-nano-12b-v2-vl',
    'qwen/qwen3-vl-8b-instruct',
    'z-ai/glm-4.5v',
    'google/gemini-3.1-pro-preview',
  ];

  private readonly diagnosisPrompt = `你是一位资深医学专家，拥有丰富的临床经验。请基于以下患者检查数据，进行全面、专业的诊疗分析。

【患者数据】
{patient_data}

请充分发挥你的专业能力，对这份检查报告进行深入分析：
- 对异常指标进行专业解读
- 分析可能的临床问题
- 给出诊疗建议

根据数据特点自由调整输出重点，不需要按固定格式，可以充分发挥你的专业水平。`;

  private readonly consultationPrompt = `你是一位主任医师，需要对多位AI专家的诊疗意见进行会诊汇总。

【Gemini 诊疗意见】
{gemini}

【DeepSeek 诊疗意见】
{deepseek}

【Kimi 诊疗意见】
{kimi}

【MiniMax 诊疗意见】
{minimax}

请从以上自由格式的诊疗意见中提取关键信息，强制输出以下7个固定板块：

## 1. 共识分析
## 2. 差异分析
## 3. 综合诊断
## 4. 诊疗建议
## 5. 后续就诊方向
## 6. 风险评估
## 7. 随诊建议

每个板块都必须有实质性内容，禁止跳过任何板块。`;

  /**
   * 调用 OpenRouter 模型
   */
  private async callModel(
    model: string,
    messages: { role: string; content: string | any[] }[],
    temperature = 0.5,
    maxTokens = 4000
  ): Promise<string> {
    if (this.apiKeys.length === 0) {
      throw new Error('OPENROUTER_API_KEY 未配置');
    }

    const body = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    const errors: string[] = [];
    for (const apiKey of this.apiKeys) {
      for (let i = 0; i < 3; i++) {
        try {
          const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': config.openRouterAppUrl,
              'X-OpenRouter-Title': config.openRouterAppName,
            },
            body: JSON.stringify(body),
          });

          if (response.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`${response.status} ${text}`);
          }

          const result = await response.json();
          return result?.choices?.[0]?.message?.content || '';
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
    }

    throw new Error(`模型调用失败: ${errors.join(' | ')}`);
  }

  /**
   * OCR 提取图片内容（多模型兜底）
   */
  public async extractImageContent(imageData: string): Promise<string> {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请完整、准确地提取这张图片中的所有可见内容。只做内容识别和记录，不要进行分析、诊断或建议。`,
          },
          {
            type: 'image_url',
            image_url: { url: imageData },
          },
        ],
      },
    ];

    const errors: string[] = [];
    for (const model of this.ocrModels) {
      try {
        const content = await this.callModel(model, messages, 0.3, 2500);
        if (content && content.length > 20) return content;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    throw new Error(`OCR 识别失败: ${errors.join(' | ')}`);
  }

  /**
   * 多模型并行诊疗分析
   */
  public async analyzeWithAllModels(
    patientData: string
  ): Promise<Record<string, SingleDiagnosis>> {
    const results: Partial<Record<ModelName, SingleDiagnosis>> = {};

    for (const modelName of Object.keys(this.models) as ModelName[]) {
      const prompt = this.diagnosisPrompt.replace('{patient_data}', patientData);
      const diagnosis = await this.callModel(
        this.models[modelName],
        [{ role: 'user', content: prompt }],
        0.5,
        5000
      );
      results[modelName] = { diagnosis };
      // 模型间隔 1.5s 避免限流
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return results as Record<string, SingleDiagnosis>;
  }

  /**
   * 多模型会诊汇总
   */
  public async conductConsultation(
    modelAnalysis: Record<string, SingleDiagnosis>
  ): Promise<string> {
    const prompt = this.consultationPrompt
      .replace('{gemini}', modelAnalysis.gemini?.diagnosis || '无')
      .replace('{deepseek}', modelAnalysis.deepseek?.diagnosis || '无')
      .replace('{kimi}', modelAnalysis.kimi?.diagnosis || '无')
      .replace('{minimax}', modelAnalysis.minimax?.diagnosis || '无');

    return this.callModel(
      this.models.gemini,
      [{ role: 'user', content: prompt }],
      0.4,
      8000
    );
  }

  /**
   * 生成 HTML 报告（调用外部 API）
   */
  public async generateHtmlReport(
    content: string
  ): Promise<{ taskId?: string; resultUrl?: string }> {
    const createUrl = `${this.htmlApiBaseUrl}/ai-consultation/create`;
    const file = new Blob([content], { type: 'text/markdown' });
    const formData = new FormData();
    formData.append('file', file, 'consultation_report.md');
    formData.append('title', '患者会诊报告');
    formData.append('templateId', config.aiConsultationTemplateId);
    formData.append('userId', config.aiConsultationUserId);
    formData.append('tenantId', config.aiConsultationTenantId);

    const response = await fetch(createUrl, { method: 'POST', body: formData as any });
    if (!response.ok) {
      throw new Error(`创建 HTML 报告任务失败: ${response.status}`);
    }
    const result = await response.json();
    const taskId = result?.data?.taskId;
    if (!taskId) return {};

    // 轮询状态
    const statusUrl = `${this.htmlApiBaseUrl}/ai-consultation/status/${taskId}`;
    for (let i = 0; i < 200; i++) {
      const statusResponse = await fetch(statusUrl);
      const statusResult = await statusResponse.json();
      const data = statusResult?.data || {};
      if (data.status === 'SUCCEEDED' && data.resultUrl) {
        return { taskId, resultUrl: data.resultUrl };
      }
      if (data.status === 'FAILED') {
        throw new Error(data.errorMessage || 'HTML 报告生成失败');
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return { taskId };
  }
}

export const aiConsultationService = new AIConsultationService();
