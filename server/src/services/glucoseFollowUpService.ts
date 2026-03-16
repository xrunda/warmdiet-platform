import { GlucoseContext } from '../types';

export type GlucoseFollowUpIntent =
  | 'collect_context'
  | 'meal_details'
  | 'hypoglycemia_risk'
  | 'medication_and_stress';

export type GlucoseFollowUpQuestion = {
  key: string;
  question: string;
  inputType: 'single_choice' | 'multi_choice';
  options: string[];
  required: boolean;
  allowSkip: boolean;
};

export type GlucoseFollowUpAdvice = {
  level: 'info' | 'attention' | 'urgent';
  summary: string;
};

export type GlucoseFollowUpResult = {
  shouldAskFollowUp: boolean;
  intent: GlucoseFollowUpIntent;
  urgency: 'low' | 'medium' | 'high';
  summary: string;
  questions: GlucoseFollowUpQuestion[];
  advice?: GlucoseFollowUpAdvice;
};

export type GlucoseFollowUpInput = {
  glucoseValue: number;
  glucoseContext?: GlucoseContext;
  measuredAt?: string;
  recentHighCount?: number;
  recentLowCount?: number;
};

function getMealPostMinutesBucket(measuredAt?: string): string | null {
  if (!measuredAt) return null;
  return null;
}

function buildContextQuestions(): GlucoseFollowUpQuestion[] {
  return [
    {
      key: 'glucoseContext',
      question: '这次血糖是空腹、餐前、餐后还是睡前测的？',
      inputType: 'single_choice',
      options: ['空腹', '餐前', '餐后', '睡前', '不确定'],
      required: true,
      allowSkip: false,
    },
    {
      key: 'postMealDuration',
      question: '如果是餐后血糖，大约是饭后多久测的？',
      inputType: 'single_choice',
      options: ['1小时内', '约2小时', '超过2小时', '不确定'],
      required: false,
      allowSkip: true,
    },
  ];
}

function buildMealQuestions(): GlucoseFollowUpQuestion[] {
  return [
    {
      key: 'mealAmount',
      question: '这餐主食量和平时比怎么样？',
      inputType: 'single_choice',
      options: ['正常', '偏多', '偏少', '不确定'],
      required: false,
      allowSkip: true,
    },
    {
      key: 'highSugarFoods',
      question: '这餐有没有甜食、饮料或水果？',
      inputType: 'multi_choice',
      options: ['甜食', '含糖饮料', '水果', '都没有'],
      required: false,
      allowSkip: true,
    },
  ];
}

function buildHypoglycemiaQuestions(): GlucoseFollowUpQuestion[] {
  return [
    {
      key: 'lowSymptoms',
      question: '现在有没有心慌、手抖、出汗、头晕这些低血糖不适？',
      inputType: 'multi_choice',
      options: ['心慌', '手抖', '出汗', '头晕', '都没有'],
      required: true,
      allowSkip: false,
    },
    {
      key: 'lowSugarHandled',
      question: '这次低血糖后，您已经补充糖分或进食了吗？',
      inputType: 'single_choice',
      options: ['已经补充', '还没有', '不确定'],
      required: true,
      allowSkip: false,
    },
  ];
}

function buildMedicationQuestions(): GlucoseFollowUpQuestion[] {
  return [
    {
      key: 'medicationStatus',
      question: '今天降糖药或胰岛素有按时使用吗？',
      inputType: 'single_choice',
      options: ['按时用了', '漏用了', '时间推迟了', '不确定'],
      required: false,
      allowSkip: true,
    },
    {
      key: 'stressFactors',
      question: '最近有没有熬夜、发热不适或压力明显增大？',
      inputType: 'multi_choice',
      options: ['熬夜', '发热/感染', '压力大', '都没有'],
      required: false,
      allowSkip: true,
    },
  ];
}

export function buildGlucoseFollowUp(input: GlucoseFollowUpInput): GlucoseFollowUpResult {
  const context = input.glucoseContext || 'unknown';
  const value = Number(input.glucoseValue || 0);
  const highCount = input.recentHighCount || 0;
  const lowCount = input.recentLowCount || 0;

  if (context === 'unknown') {
    return {
      shouldAskFollowUp: true,
      intent: 'collect_context',
      urgency: 'low',
      summary: '先补充测量场景，系统才能更准确判断这次血糖。',
      questions: buildContextQuestions(),
      advice: {
        level: 'info',
        summary: '优先确认是空腹、餐前还是餐后血糖；若为餐后，再补充距离进餐时间。',
      },
    };
  }

  if (value < 3.9) {
    return {
      shouldAskFollowUp: true,
      intent: 'hypoglycemia_risk',
      urgency: value < 3 ? 'high' : 'medium',
      summary: '这次血糖偏低，先确认是否有不适并是否已经补糖。',
      questions: buildHypoglycemiaQuestions(),
      advice: {
        level: value < 3 ? 'urgent' : 'attention',
        summary: value < 3 ? '血糖明显偏低，请尽快补充糖分，若症状明显建议立即联系医生或家属。' : '血糖偏低，建议先补充糖分并尽快复测。',
      },
    };
  }

  if (context === 'post_meal' && value >= 10) {
    return {
      shouldAskFollowUp: true,
      intent: 'meal_details',
      urgency: value >= 13 ? 'high' : 'medium',
      summary: '餐后血糖偏高，优先看看这餐吃了什么，避免一次问太多。',
      questions: buildMealQuestions(),
      advice: {
        level: value >= 13 ? 'attention' : 'info',
        summary: '建议先回顾主食和甜食摄入，再结合饭后活动情况判断。',
      },
    };
  }

  if ((context === 'fasting' && value >= 7) || highCount >= 3 || lowCount >= 2) {
    return {
      shouldAskFollowUp: true,
      intent: 'medication_and_stress',
      urgency: value >= 11.1 || highCount >= 5 ? 'high' : 'medium',
      summary: '这次血糖提示需要排查近期用药和身体状态。',
      questions: buildMedicationQuestions(),
      advice: {
        level: value >= 11.1 ? 'attention' : 'info',
        summary: '若最近连续异常，建议结合用药、感染、睡眠和压力因素一起判断。',
      },
    };
  }

  return {
    shouldAskFollowUp: false,
    intent: 'collect_context',
    urgency: 'low',
    summary: '本次血糖已可完成基础记录，暂不追加追问。',
    questions: [],
    advice: {
      level: 'info',
      summary: '当前以低打扰记录为主，如后续连续异常再追加追问。',
    },
  };
}