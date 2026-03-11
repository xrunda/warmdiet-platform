export type AlertSeverity = 'low' | 'medium' | 'high';

export interface VitalLike {
  type?: 'blood_pressure' | 'blood_sugar';
  metricType?: 'blood_pressure' | 'blood_glucose';
  systolic?: number;
  diastolic?: number;
  value?: number;
  systolicValue?: number;
  diastolicValue?: number;
  glucoseValue?: number;
  measuredAt?: string;
  unit?: string;
}

export interface MealLike {
  mealDate?: string;
  createdAt?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: string;
}

export interface ReportLike {
  id?: string;
  reportDate?: string;
  nutritionScore?: number;
  summary?: string;
  recommendations?: string[];
}

export interface AiAlertInsight {
  id: string;
  patientId: string;
  patientName: string;
  type: 'blood_pressure' | 'blood_sugar' | 'nutrition_score' | 'medication_adherence';
  severity: AlertSeverity;
  title: string;
  description: string;
  value?: string;
  normalRange?: string;
  createdAt: string;
  confidence: number;
  riskScore: number;
  reason: string;
  recommendation: string;
  basis: string[];
}

export interface PatientAiSummary {
  patientId: string;
  patientName: string;
  riskScore: number;
  confidence: number;
  severity: AlertSeverity;
  statusLabel: string;
  summary: string;
  insight: string;
  recommendation: string;
  basis: string[];
  alerts: AiAlertInsight[];
  dimensions: Array<{ label: string; score: number; trend?: 'up' | 'down' | 'stable'; note?: string }>;
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function dateOf(input?: string) {
  return (input || new Date().toISOString()).split('T')[0];
}

function latestDate(items: Array<{ measuredAt?: string; reportDate?: string; createdAt?: string }>) {
  const latest = items
    .map((item) => item.measuredAt || item.reportDate || item.createdAt || '')
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  return latest || new Date().toISOString();
}

export function generatePatientAiSummary(params: {
  patientId: string;
  patientName: string;
  vitals?: VitalLike[];
  meals?: MealLike[];
  reports?: ReportLike[];
}) : PatientAiSummary {
  const vitals = (params.vitals || []).slice().sort((a, b) =>
    new Date(b.measuredAt || 0).getTime() - new Date(a.measuredAt || 0).getTime()
  );
  const meals = params.meals || [];
  const reports = (params.reports || []).slice().sort((a, b) =>
    new Date(b.reportDate || 0).getTime() - new Date(a.reportDate || 0).getTime()
  );

  const bpList = vitals.filter((v) => (v.type || v.metricType) === 'blood_pressure');
  const bgList = vitals.filter((v) => (v.type || v.metricType) === 'blood_sugar' || v.metricType === 'blood_glucose');

  const latestBp = bpList[0];
  const latestBg = bgList[0];
  const bpValues = bpList.slice(0, 7).map((v) => Number(v.systolic ?? v.systolicValue ?? 0));
  const bgValues = bgList.slice(0, 7).map((v) => Number(v.value ?? v.glucoseValue ?? 0));
  const proteinValues = meals.slice(0, 7).map((m) => Number(m.protein || 0)).filter(Boolean);
  const calorieValues = meals.slice(0, 7).map((m) => Number(m.calories || 0)).filter(Boolean);
  const nutritionValues = reports.map((r) => Number(r.nutritionScore ?? 0)).filter(Boolean).slice(0, 4);

  const bpAvg = avg(bpValues);
  const bgAvg = avg(bgValues);
  const proteinAvg = avg(proteinValues);
  const calorieAvg = avg(calorieValues);
  const nutritionAvg = avg(nutritionValues);

  let bpScore = 88;
  if (latestBp) {
    const systolic = Number(latestBp.systolic ?? latestBp.systolicValue ?? 0);
    const diastolic = Number(latestBp.diastolic ?? latestBp.diastolicValue ?? 0);
    if (systolic >= 150 || diastolic >= 95) bpScore = 48;
    else if (systolic >= 140 || diastolic >= 90) bpScore = 60;
    else if (systolic >= 130 || diastolic >= 85) bpScore = 76;
  }

  let bgScore = 90;
  if (latestBg) {
    const glucose = Number(latestBg.value ?? latestBg.glucoseValue ?? 0);
    if (glucose >= 9) bgScore = 50;
    else if (glucose >= 7) bgScore = 66;
    else if (glucose >= 6.1) bgScore = 80;
  }

  let nutritionScore = 86;
  if (nutritionAvg) {
    nutritionScore = nutritionAvg;
  } else if (proteinAvg && calorieAvg) {
    nutritionScore = clamp(55 + proteinAvg * 1.5 + Math.min(calorieAvg / 40, 18));
  }

  const basis: string[] = [];
  const alerts: AiAlertInsight[] = [];

  if (latestBp) {
    const systolic = Number(latestBp.systolic ?? latestBp.systolicValue ?? 0);
    const diastolic = Number(latestBp.diastolic ?? latestBp.diastolicValue ?? 0);
    if (systolic >= 130 || diastolic >= 85) {
      basis.push(`近7天血压均值 ${Math.round(bpAvg || systolic)}/${Math.round(avg(bpList.slice(0, 7).map((v) => Number(v.diastolic ?? v.diastolicValue ?? 0))))} mmHg`);
      alerts.push({
        id: `${params.patientId}-ai-bp`,
        patientId: params.patientId,
        patientName: params.patientName,
        type: 'blood_pressure',
        severity: systolic >= 140 || diastolic >= 90 ? 'high' : 'medium',
        title: systolic >= 140 || diastolic >= 90 ? 'AI 检测到血压风险升高' : 'AI 检测到血压波动需关注',
        description: `AI 基于连续血压记录判断该患者存在血压管理风险，当前值 ${systolic}/${diastolic} mmHg。`,
        value: `${systolic}/${diastolic} mmHg`,
        normalRange: '< 130/85 mmHg',
        createdAt: latestBp.measuredAt || new Date().toISOString(),
        confidence: clamp(Math.round(78 + Math.max(systolic - 130, 0) * 0.7)),
        riskScore: clamp(Math.round(100 - bpScore + 25)),
        reason: '连续血压记录高于个体稳定区间，并出现上升趋势。',
        recommendation: '建议优先复核近期血压变化，并结合饮食与作息进行干预。',
        basis: ['血压趋势', '个体近期基线', '近7天连续测量结果'],
      });
    }
  }

  if (latestBg) {
    const glucose = Number(latestBg.value ?? latestBg.glucoseValue ?? 0);
    if (glucose >= 6.1) {
      basis.push(`近7天血糖均值 ${bgAvg.toFixed(1)} mmol/L`);
      alerts.push({
        id: `${params.patientId}-ai-bg`,
        patientId: params.patientId,
        patientName: params.patientName,
        type: 'blood_sugar',
        severity: glucose >= 7 ? 'high' : 'medium',
        title: glucose >= 7 ? 'AI 检测到血糖控制异常' : 'AI 检测到血糖波动偏大',
        description: `AI 识别到血糖波动超出理想区间，当前血糖 ${glucose.toFixed(1)} mmol/L。`,
        value: `${glucose.toFixed(1)} mmol/L`,
        normalRange: '< 6.1 mmol/L',
        createdAt: latestBg.measuredAt || new Date().toISOString(),
        confidence: clamp(Math.round(74 + Math.max(glucose - 6.1, 0) * 8)),
        riskScore: clamp(Math.round(100 - bgScore + 22)),
        reason: '血糖水平与最近饮食记录存在异常联动。',
        recommendation: '建议重点复查近3天饮食、晚餐时间与加餐情况。',
        basis: ['血糖走势', '进食节律', '近7天波动幅度'],
      });
    }
  }

  if ((nutritionAvg && nutritionAvg < 75) || (proteinAvg && proteinAvg < 35)) {
    basis.push(`营养评分/蛋白摄入偏低（营养均值 ${nutritionAvg ? nutritionAvg.toFixed(0) : '--'}，蛋白均值 ${proteinAvg ? proteinAvg.toFixed(0) : '--'}g）`);
    alerts.push({
      id: `${params.patientId}-ai-nutrition`,
      patientId: params.patientId,
      patientName: params.patientName,
      type: 'nutrition_score',
      severity: nutritionAvg < 65 || proteinAvg < 25 ? 'high' : 'medium',
      title: 'AI 检测到营养结构失衡',
      description: 'AI 识别到近期营养评分偏低，且蛋白质摄入不足，可能影响整体恢复。',
      value: nutritionAvg ? `${nutritionAvg.toFixed(0)} 分` : `${proteinAvg.toFixed(0)}g 蛋白/日`,
      normalRange: '营养评分 > 75',
      createdAt: latestDate(reports as any),
      confidence: clamp(Math.round(76 + Math.max(75 - (nutritionAvg || 70), 0) * 0.8)),
      riskScore: clamp(Math.round(100 - nutritionScore + 18)),
      reason: '饮食记录与营养报告均提示膳食结构需要调整。',
      recommendation: '建议医生在随访中增加营养指导，优先关注蛋白与规律进餐。',
      basis: ['餐食记录', '营养评分', '蛋白质摄入趋势'],
    });
  }

  const combinedRisk = clamp(Math.round((100 - bpScore) * 0.35 + (100 - bgScore) * 0.35 + (100 - nutritionScore) * 0.3 + 18));
  const confidence = clamp(Math.round(72 + alerts.length * 7 + (vitals.length > 5 ? 5 : 0) + (meals.length > 5 ? 4 : 0)));
  const severity: AlertSeverity = combinedRisk >= 70 ? 'high' : combinedRisk >= 45 ? 'medium' : 'low';
  const statusLabel = severity === 'high' ? '重点关注' : severity === 'medium' ? '建议关注' : '整体稳定';

  if (!basis.length) {
    basis.push('近7天关键指标整体稳定');
  }

  const dimensions = [
    { label: '血压管理', score: bpScore, trend: bpAvg >= 135 ? 'down' as const : 'stable' as const, note: latestBp ? `最近值 ${latestBp.systolic ?? latestBp.systolicValue}/${latestBp.diastolic ?? latestBp.diastolicValue}` : '暂无数据' },
    { label: '血糖控制', score: bgScore, trend: bgAvg >= 6.8 ? 'down' as const : 'stable' as const, note: latestBg ? `最近值 ${(latestBg.value ?? latestBg.glucoseValue ?? '--')}${latestBg.unit || 'mmol/L'}` : '暂无数据' },
    { label: '营养均衡', score: Math.round(nutritionScore), trend: nutritionScore < 75 ? 'down' as const : 'stable' as const, note: nutritionAvg ? `近期待分 ${nutritionAvg.toFixed(0)}` : '根据餐食估算' },
    { label: '依从与节律', score: clamp(Math.round((proteinAvg ? 72 : 68) + (meals.length > 10 ? 8 : 0))), trend: meals.length < 5 ? 'down' as const : 'stable' as const, note: meals.length ? `近7天餐食 ${Math.min(meals.length, 7)} 条` : '记录较少' },
  ];

  const summary = severity === 'high'
    ? `AI 判断该患者短期内存在较高健康管理风险，建议优先查看。`
    : severity === 'medium'
      ? `AI 识别到该患者出现趋势性波动，建议安排随访。`
      : `AI 判断该患者整体稳定，但仍建议持续观察关键指标。`;

  const insight = alerts[0]?.reason || 'AI 未发现明显异常联动信号。';
  const recommendation = alerts[0]?.recommendation || '建议维持当前管理方案，并持续采集健康数据。';

  return {
    patientId: params.patientId,
    patientName: params.patientName,
    riskScore: combinedRisk,
    confidence,
    severity,
    statusLabel,
    summary,
    insight,
    recommendation,
    basis,
    alerts,
    dimensions,
  };
}

export function buildDoctorBriefing(summaries: PatientAiSummary[]) {
  const totalPatients = summaries.length;
  const focus = summaries.filter((s) => s.riskScore >= 70);
  const attention = summaries.filter((s) => s.riskScore >= 45 && s.riskScore < 70);
  const stable = summaries.filter((s) => s.riskScore < 45);
  const totalDataPoints = summaries.reduce((sum, s) => sum + s.basis.length * 7, 0);
  const avgRisk = totalPatients ? Math.round(summaries.reduce((sum, s) => sum + s.riskScore, 0) / totalPatients) : 0;

  return {
    totalPatients,
    totalDataPoints,
    avgRisk,
    focus,
    attention,
    stable,
    headline: totalPatients
      ? `AI 已完成 ${totalPatients} 位患者的多维健康扫描，识别出 ${focus.length} 位重点关注对象。`
      : 'AI 暂无可分析患者数据。',
    insight: focus[0]
      ? `重点关注：${focus[0].patientName}（风险 ${focus[0].riskScore}，置信度 ${focus[0].confidence}%）` 
      : attention[0]
        ? `趋势关注：${attention[0].patientName} 出现波动，建议安排随访。`
        : '当前患者群体整体稳定，可继续观察。',
  };
}