import { GlucoseContext, VitalMetricType } from '../types';

type ExtractedVitalMeasurement = {
  metricType: VitalMetricType;
  systolicValue?: number;
  diastolicValue?: number;
  glucoseValue?: number;
  glucoseContext: GlucoseContext;
  unit: string;
};

const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function parseChineseInteger(input: string): number {
  if (!input) return NaN;
  if (/^\d+$/.test(input)) return Number(input);

  let total = 0;
  let current = 0;

  for (const char of input) {
    if (char === '百') {
      total += (current || 1) * 100;
      current = 0;
      continue;
    }
    if (char === '十') {
      total += (current || 1) * 10;
      current = 0;
      continue;
    }
    if (char in CHINESE_DIGITS) {
      current += CHINESE_DIGITS[char];
    }
  }

  return total + current;
}

function normalizeChineseNumericToken(token: string): string {
  if (!token) return token;
  if (/^\d+(\.\d+)?$/.test(token)) return token;

  if (token.includes('点')) {
    const [intPart, decimalPart] = token.split('点');
    const normalizedDecimal = [...decimalPart].map((char) => CHINESE_DIGITS[char] ?? '').join('');
    return `${parseChineseInteger(intPart)}.${normalizedDecimal}`;
  }

  return String(parseChineseInteger(token));
}

function detectGlucoseContext(text: string): GlucoseContext {
  if (/空腹/.test(text)) return 'fasting';
  if (/餐后|饭后/.test(text)) return 'post_meal';
  if (/睡前/.test(text)) return 'before_sleep';
  if (/随机/.test(text)) return 'random';
  return 'unknown';
}

function parseBloodPressure(text: string): ExtractedVitalMeasurement | null {
  const patterns = [
    /(?:血压|高压)?\s*([0-9一二三四五六七八九十百两〇零]{2,6})\s*(?:\/|到|比|,|，)\s*([0-9一二三四五六七八九十百两〇零]{2,6})(?:\s*(?:毫米汞柱|mmhg))?/i,
    /高压\s*([0-9一二三四五六七八九十百两〇零]{2,6}).{0,6}?低压\s*([0-9一二三四五六七八九十百两〇零]{2,6})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const systolicValue = Number(normalizeChineseNumericToken(match[1]));
    const diastolicValue = Number(normalizeChineseNumericToken(match[2]));

    if (systolicValue >= 70 && systolicValue <= 250 && diastolicValue >= 40 && diastolicValue <= 160) {
      return {
        metricType: 'blood_pressure',
        systolicValue,
        diastolicValue,
        glucoseContext: 'unknown',
        unit: 'mmHg',
      };
    }
  }

  return null;
}

function parseBloodGlucose(text: string): ExtractedVitalMeasurement | null {
  const patterns = [
    /((?:空腹|餐后两小时|餐后2小时|餐后|饭后|睡前|随机)?(?:血糖))[^0-9一二三四五六七八九十百两〇零点]{0,4}([0-9一二三四五六七八九十百两〇零点]{1,6}(?:\.\d+)?)/i,
    /((?:空腹|餐后两小时|餐后2小时|餐后|饭后|睡前|随机))[^0-9一二三四五六七八九十百两〇零点]{0,4}(?:血糖)?[^0-9一二三四五六七八九十百两〇零点]{0,4}([0-9一二三四五六七八九十百两〇零点]{1,6}(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const glucoseValue = Number(normalizeChineseNumericToken(match[2]));
    if (glucoseValue >= 2 && glucoseValue <= 40) {
      return {
        metricType: 'blood_glucose',
        glucoseValue,
        glucoseContext: detectGlucoseContext(text),
        unit: 'mmol/L',
      };
    }
  }

  return null;
}

export function extractVitalMeasurementsFromText(text: string): ExtractedVitalMeasurement[] {
  const results: ExtractedVitalMeasurement[] = [];
  const bloodPressure = parseBloodPressure(text);
  const bloodGlucose = parseBloodGlucose(text);

  if (bloodPressure) results.push(bloodPressure);
  if (bloodGlucose) results.push(bloodGlucose);

  return results;
}
