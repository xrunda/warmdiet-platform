import { config } from '../config/env';

type ParsedImage = {
  mimeType: string;
  base64Data: string;
};

export type MedicationOcrResult = {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  ocrText?: string;
};

export type MedicalOrderOcrResult = {
  content: string;
  doctorName: string;
  hospitalName: string;
  visitDate: string;
  rawOcrText?: string;
};

class OcrService {
  private readonly openRouterModels = [
    'google/gemini-3.1-flash-lite-preview',
    'qwen/qwen3.5-35b-a3b',
    'qwen/qwen3.5-plus-02-15',
    'sourceful/riverflow-v2-fast',
  ];

  private parseImageData(imageData: string): ParsedImage {
    const matched = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matched) {
      throw new Error('图片数据格式不正确');
    }

    return {
      mimeType: matched[1],
      base64Data: matched[2],
    };
  }

  private extractJson<T>(payload: string): T {
    const fencedMatch = payload.match(/```json\s*([\s\S]*?)```/i);
    const raw = (fencedMatch?.[1] || payload).trim();
    return JSON.parse(raw) as T;
  }

  private async requestOpenRouter<T>(model: string, imageData: string, prompt: string): Promise<T> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.openRouterAppUrl,
        'X-OpenRouter-Title': config.openRouterAppName,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${model}: ${response.status} ${text}`);
    }

    const json = await response.json();
    const message = json?.choices?.[0]?.message?.content;
    const text = Array.isArray(message)
      ? message.map((part: { text?: string }) => part.text || '').join('\n').trim()
      : String(message || '').trim();

    if (!text) {
      throw new Error(`${model}: OCR 未返回识别结果`);
    }

    return this.extractJson<T>(text);
  }

  private async generateStructuredJson<T>(imageData: string, prompt: string): Promise<T> {
    if (!config.openRouterApiKey) {
      throw new Error('OCR 服务未配置');
    }

    this.parseImageData(imageData);

    const errors: string[] = [];
    for (const model of this.openRouterModels) {
      try {
        return await this.requestOpenRouter<T>(model, imageData, prompt);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    throw new Error(`OCR 请求失败: ${errors.join(' | ')}`);
  }

  public async recognizeMedication(imageData: string): Promise<MedicationOcrResult> {
    const result = await this.generateStructuredJson<MedicationOcrResult & { ocrText?: string }>(
      imageData,
      [
        '你是医疗 OCR 助手，请识别药品包装图片，并严格返回 JSON。',
        '字段要求：',
        '- name: 药品名称，无法确认时返回"待确认药品"',
        '- dosage: 规格/剂量，尽量保留包装上的单位',
        '- frequency: 推荐服用频次，包装无法判断时返回"请遵医嘱"',
        '- timing: 推荐服用时间，无法判断时返回"请遵医嘱"',
        '- ocrText: 提取到的关键原文，尽量简洁',
        '不要输出额外说明。',
      ].join('\n')
    );

    return {
      name: result.name || '待确认药品',
      dosage: result.dosage || '请核对包装规格',
      frequency: result.frequency || '请遵医嘱',
      timing: result.timing || '请遵医嘱',
      ocrText: result.ocrText || '',
    };
  }

  public async recognizeMedicalOrder(imageData: string): Promise<MedicalOrderOcrResult> {
    const today = new Date().toISOString().slice(0, 10);
    const result = await this.generateStructuredJson<MedicalOrderOcrResult & { rawOcrText?: string }>(
      imageData,
      [
        '你是医疗 OCR 助手，请识别纸质医嘱/门诊单图片，并严格返回 JSON。',
        '字段要求：',
        '- content: 医嘱正文，尽量提取完整内容，保留重点处置、饮食建议、复查要求',
        '- doctorName: 主治医生姓名，无法识别时返回"待确认医生"',
        '- hospitalName: 医院名称，无法识别时返回"待确认医院"',
        `- visitDate: 就诊日期，格式必须为 YYYY-MM-DD，无法识别时返回"${today}"`,
        '- rawOcrText: 原始识别文本摘要',
        '不要输出额外说明。',
      ].join('\n')
    );

    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(result.visitDate || '') ? result.visitDate : today;

    return {
      content: result.content || '未识别到清晰医嘱内容',
      doctorName: result.doctorName || '待确认医生',
      hospitalName: result.hospitalName || '待确认医院',
      visitDate: normalizedDate,
      rawOcrText: result.rawOcrText || '',
    };
  }
}

export const ocrService = new OcrService();
