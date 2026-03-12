/**
 * 患者详情页 - 以患者为中心，整合所有功能模块
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, UtensilsCrossed, FileText, Activity, Pill, CalendarDays, MessageSquare, AlertTriangle, RefreshCw, BrainCircuit, TrendingUp, Sparkles, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';
import { generatePatientAiSummary } from '../../utils/aiInsights';

type TabType = 'vitals' | 'meals' | 'reports' | 'aiConsult' | 'orders' | 'medications' | 'healthProfile' | 'followup' | 'chat';

type AIConsultationReport = {
  id: string;
  title: string;
  hospitalName: string;
  reportUrl: string;
  createdAt: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  summary: string;
  sourceMaterials: string[];
};


interface PatientDetailProps {
  patientId: string;
  initialPatient?: {
    id: string;
    name: string;
    latestUpdate?: string;
    unreadMessages?: number;
  };
  onBack?: () => void;
}

type ApiListResponse<T> = { data?: T[] };
type ApiSingleResponse<T> = { data?: T };

type MealRecord = {
  id: string;
  patientId: string;
  mealType: string;
  mealDate: string;
  foods: any[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  createdAt: string;
};

type DailyMealSummary = {
  date: string;
  meals: MealRecord[];
  totalCalories: number;
};

function toMealTimestamp(meal: MealRecord) {
  const dt = `${meal.mealDate || ''} ${((meal as any).mealTime || '00:00')}`.trim();
  const t = new Date(dt).getTime();
  if (!Number.isNaN(t)) return t;
  return new Date(meal.createdAt || 0).getTime();
}

function normalizeMealFoods(meal: MealRecord): any[] {
  const raw = (meal as any).foods;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

function formatMinute(input?: string) {
  if (!input) return '--:--';
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(input)) return input.slice(0, 5);
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}

function formatDateTime(input?: string) {
  if (!input) return '--';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '--';
  const Y = d.getFullYear();
  const M = `${d.getMonth() + 1}`.padStart(2, '0');
  const D = `${d.getDate()}`.padStart(2, '0');
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  const s = `${d.getSeconds()}`.padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

type HealthReport = {
  id: string;
  patientId: string;
  reportDate: string;
  summary: string;
  recommendations: string[];
  nutritionScore?: number;
  trends: any;
  createdAt: string;
};

type MedicalOrder = {
  id: string;
  patientId: string;
  content: string;
  doctorName: string;
  hospitalName: string;
  visitDate: string;
  originalImage?: string;
  createdAt: string;
};

type Medication = {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'stopped' | 'completed';
  notes?: string;
  createdAt: string;
};

type VitalMeasurement = {
  id: string;
  type: 'blood_pressure' | 'blood_sugar';
  systolic?: number;
  diastolic?: number;
  value?: number;
  unit?: string;
  measuredAt: string;
};

type VitalApiItem = {
  metricType: 'blood_pressure' | 'blood_glucose';
  systolicValue?: number;
  diastolicValue?: number;
  glucoseValue?: number;
  unit?: string;
  measuredAt?: string;
};

type ChatMessage = {
  id: string;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: string;
  read?: boolean;
};

type PatientProfile = {
  id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  createdAt: string;
};

type DailyVitalSummary = {
  date: string;
  entries: VitalMeasurement[];
  bp?: VitalMeasurement;
  bg?: VitalMeasurement;
  riskFactors: string[];
  healthScore: number;
  badge: { label: string; color: string; bg: string };
  summary: string;
};

/** 简易 Markdown 渲染：将文本按段落、标题、列表等拆分为 React 元素 */
function renderFormattedText(text: string) {
  if (!text) return null;
  // 按连续换行拆段落，单换行保留
  const lines = text.split(/\n/);
  const elements: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key++} style={{ margin: '8px 0', paddingLeft: 20, listStyle: 'disc' }}>
        {listBuffer.map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, marginBottom: 2 }}>
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const renderInline = (line: string) => {
    // Bold: **text** or __text__
    const parts: (string | JSX.Element)[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIdx = 0;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIdx) parts.push(line.slice(lastIdx, match.index));
      parts.push(<strong key={`b${match.index}`} style={{ color: '#1e293b' }}>{match[1]}</strong>);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < line.length) parts.push(line.slice(lastIdx));
    return parts.length > 0 ? <>{parts}</> : line;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Empty line → flush + spacer
    if (!line) {
      flushList();
      elements.push(<div key={key++} style={{ height: 8 }} />);
      continue;
    }

    // Heading: ### or ## or #
    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const level = (line.match(/^(#+)/)?.[1]?.length) || 1;
      const headingText = line.replace(/^#{1,3}\s*/, '');
      const fontSize = level === 1 ? 18 : level === 2 ? 16 : 15;
      elements.push(
        <div key={key++} style={{
          fontSize,
          fontWeight: 700,
          color: '#0f172a',
          margin: '16px 0 6px',
          paddingBottom: level <= 2 ? 6 : 0,
          borderBottom: level <= 2 ? '1px solid #e2e8f0' : 'none',
        }}>
          {renderInline(headingText)}
        </div>
      );
      continue;
    }

    // Unordered list: - or * or •
    if (/^[-*•]\s/.test(line)) {
      listBuffer.push(line.replace(/^[-*•]\s*/, ''));
      continue;
    }

    // Numbered list: 1. 2. etc
    if (/^\d+[.、)]\s/.test(line)) {
      listBuffer.push(line);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} style={{ margin: '4px 0', fontSize: 14, color: '#334155', lineHeight: 1.8 }}>
        {renderInline(line)}
      </p>
    );
  }
  flushList();
  return <>{elements}</>;
}

function getDayRiskFactors(bp?: VitalMeasurement, bg?: VitalMeasurement): string[] {
  const risks: string[] = [];
  if (
    bp &&
    ((typeof bp.systolic === 'number' && bp.systolic >= 140) ||
      (typeof bp.diastolic === 'number' && bp.diastolic >= 90))
  ) {
    risks.push('血压偏高');
  }
  if (bg && typeof bg.value === 'number' && bg.value >= 7) {
    risks.push('血糖偏高');
  }
  if (!bp && !bg) {
    risks.push('指标未采集');
  }
  return risks;
}

function getDayHealthBadge(riskFactors: string[]) {
  if (riskFactors.length === 0) {
    return { label: '健康', color: '#047857', bg: '#dcfce7' };
  }
  if (riskFactors.length === 1) {
    return { label: '需关注', color: '#b45309', bg: '#fef3c7' };
  }
  return { label: '警示', color: '#b91c1c', bg: '#fee2e2' };
}

function getDayHealthScore(bp?: VitalMeasurement, bg?: VitalMeasurement): number {
  const scores: number[] = [];
  if (
    bp &&
    typeof bp.systolic === 'number' &&
    typeof bp.diastolic === 'number'
  ) {
    if (bp.systolic < 130 && bp.diastolic < 85) {
      scores.push(90);
    } else if (bp.systolic < 140 && bp.diastolic < 90) {
      scores.push(80);
    } else {
      scores.push(70);
    }
  }
  if (bg && typeof bg.value === 'number') {
    if (bg.value < 6.1) {
      scores.push(95);
    } else if (bg.value < 7) {
      scores.push(85);
    } else {
      scores.push(75);
    }
  }
  if (scores.length === 0) return 70;
  return Math.round(scores.reduce((sum, curr) => sum + curr, 0) / scores.length);
}

export function PatientDetail({ patientId, initialPatient, onBack }: PatientDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('vitals');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [healthConditions, setHealthConditions] = useState<any[]>([]);
  const [vitals, setVitals] = useState<VitalMeasurement[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [selectedMealDay, setSelectedMealDay] = useState<DailyMealSummary | null>(null);
  const [selectedOrderImage, setSelectedOrderImage] = useState<MedicalOrder | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiConsultReports, setAiConsultReports] = useState<AIConsultationReport[]>([]);
  const [expandedAiReports, setExpandedAiReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialPatient) {
      setPatient((prev) => ({
        id: initialPatient.id,
        name: initialPatient.name,
        age: prev?.age,
        gender: prev?.gender,
        phone: prev?.phone,
        email: prev?.email,
        createdAt: prev?.createdAt || new Date().toISOString(),
      }));
    }
    loadPatientData();
  }, [patientId, initialPatient]);

  async function loadPatientData() {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [mealsRes, reportsRes, vitalsRes, patientRes] = await Promise.all([
        (api.getMeals(patientId) as Promise<ApiListResponse<MealRecord>>).catch(() => ({ data: [] })),
        (api.getReports(patientId) as Promise<ApiListResponse<HealthReport>>).catch(() => ({ data: [] })),
        (api.getVitalMeasurements(patientId, { days: 30 }) as Promise<ApiListResponse<VitalApiItem>>).catch(() => ({ data: [] })),
        (api.getPatient(patientId) as Promise<ApiSingleResponse<PatientProfile>>).catch(() => ({ data: undefined } as ApiSingleResponse<PatientProfile>)),
      ]);

      const normalizedMeals = (mealsRes.data || []).map((meal: any) => ({
        ...meal,
        foods: normalizeMealFoods(meal as MealRecord),
      }));
      normalizedMeals.sort((a: MealRecord, b: MealRecord) => toMealTimestamp(b) - toMealTimestamp(a));
      setMeals(normalizedMeals);
      const normalizedReports = (reportsRes.data || []).map((r: any) => {
        const recs = Array.isArray(r.recommendations)
          ? r.recommendations
          : (() => {
              try {
                return JSON.parse(r.recommendations || '[]');
              } catch {
                return [];
              }
            })();
        return {
          ...r,
          recommendations: recs,
          summary: r.summary || recs[0] || `AI 日报（${(r.reportDate || '').slice(0, 10)}）`,
        };
      });
      setReports(normalizedReports);

      const normalizedVitals: VitalMeasurement[] = (vitalsRes.data || []).map((v: VitalApiItem, idx: number) => {
        if (v.metricType === 'blood_pressure') {
          return {
            id: `v_bp_${idx}_${v.measuredAt || ''}`,
            type: 'blood_pressure',
            systolic: v.systolicValue,
            diastolic: v.diastolicValue,
            unit: v.unit || 'mmHg',
            measuredAt: v.measuredAt || new Date().toISOString(),
          };
        }

        return {
          id: `v_bg_${idx}_${v.measuredAt || ''}`,
          type: 'blood_sugar',
          value: v.glucoseValue,
          unit: v.unit || 'mmol/L',
          measuredAt: v.measuredAt || new Date().toISOString(),
        };
      });

      normalizedVitals.sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
      setVitals(normalizedVitals);

      // 模拟其他数据（实际应该从 API 获取）
      const fetchedPatient = (patientRes?.data as PatientProfile | undefined) || null;
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const doctorId = storedUser?.userId || storedUser?.id;
      let authorizationName: string | undefined;
      if (doctorId) {
        try {
          const authRes: any = await api.getDoctorAuthorizations(doctorId);
          const auths = authRes.data || [];
          const matched = auths.find((auth: any) => auth.patientId === patientId);
          authorizationName = matched?.patientName;
        } catch {
          // ignore
        }
      }
      setPatient((prev) => ({
        id: patientId,
        name: fetchedPatient?.name || initialPatient?.name || authorizationName || `患者 ${patientId.split('_').pop()}`,
        age: fetchedPatient?.age ?? prev?.age,
        gender: fetchedPatient?.gender ?? prev?.gender,
        phone: fetchedPatient?.phone ?? prev?.phone,
        email: fetchedPatient?.email ?? prev?.email,
        createdAt: fetchedPatient?.createdAt ?? prev?.createdAt ?? new Date().toISOString(),
      }));

      const ordersRes = (await api.getMedicalOrders(patientId).catch(() => ({ data: [] }))) as ApiListResponse<any>;
      const medsRes = (await api.getMedications(patientId).catch(() => ({ data: [] }))) as ApiListResponse<any>;
      const healthRes = (await api.getHealthConditions(patientId).catch(() => ({ data: [] }))) as ApiListResponse<any>;
      const orderList = (ordersRes.data || []).map((item: any) => ({
        id: item.id,
        patientId: item.patientId,
        content: item.content,
        doctorName: item.doctorName || '医生',
        hospitalName: item.hospitalName || item.hospital || '医院',
        visitDate: item.visitDate || item.orderDate || '',
        originalImage: item.originalImage,
        createdAt: item.createdAt,
      }));

      const medicationList = (medsRes.data || []).map((item: any) => ({
        id: item.id,
        patientId: item.patientId,
        name: item.name,
        dosage: item.dosage,
        frequency: item.frequency,
        startDate: item.startDate || item.createdAt?.split('T')[0] || '',
        endDate: item.endDate || undefined,
        status: item.isActive !== undefined ? (item.isActive ? 'active' : 'completed') : 'active',
        notes: item.notes,
        createdAt: item.createdAt,
      }));

      setOrders(orderList);
      setMedications(medicationList);
      setHealthConditions(healthRes.data || []);

      // 加载 AI 会诊报告
      try {
        const aiConsultRes: any = await api.getAIConsultations(patientId);
        const aiReports = (aiConsultRes.data || []).map((r: any) => ({
          id: r.id,
          title: r.title || 'AI 会诊报告',
          hospitalName: r.hospitalName || '',
          reportUrl: r.htmlReportUrl || r.reportUrl || '',
          createdAt: r.createdAt || r.created_at || '',
          riskLevel: r.riskLevel || r.risk_level || 'low',
          tags: Array.isArray(r.tags) ? r.tags : (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
          summary: r.consultationSummary || r.summary || '',
          sourceMaterials: Array.isArray(r.sourceFiles) ? r.sourceFiles : (() => { try { return JSON.parse(r.sourceFiles || '[]'); } catch { return []; } })(),
        }));
        setAiConsultReports(aiReports);
      } catch {
        setAiConsultReports([]);
      }

      // 健康指标改为真实 API 数据，不再使用本地模拟数据

      setAlerts([
        '血压偏高，建议复查',
        '血糖控制不稳定',
      ]);

    } catch (err) {
      console.error('加载患者数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const tabs: Array<{ id: TabType; label: string; icon: any; count?: number }> = [
    { id: 'vitals', label: '健康指标', icon: Activity, count: vitals.length },
    { id: 'meals', label: '餐食记录', icon: UtensilsCrossed, count: meals.length },
    { id: 'reports', label: '健康报告', icon: FileText, count: reports.length },
    { id: 'aiConsult', label: 'AI会诊', icon: Sparkles, count: aiConsultReports.length },
    { id: 'orders', label: '医嘱记录', icon: Activity },
    { id: 'medications', label: '用药管理', icon: Pill, count: medications.filter(m => m.status === 'active').length },
    { id: 'healthProfile', label: '健康档案', icon: Activity },
    { id: 'followup', label: '随访计划', icon: CalendarDays },
    { id: 'chat', label: '聊天记录', icon: MessageSquare },
  ];

  const dailyVitalSummaries = useMemo(() => {
    const map = new Map<string, VitalMeasurement[]>();
    vitals.forEach((entry) => {
      const date = (entry.measuredAt || new Date().toISOString()).split('T')[0];
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(entry);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => {
        const bp = entries.find((item) => item.type === 'blood_pressure');
        const bg = entries.find((item) => item.type === 'blood_sugar');
        const riskFactors = getDayRiskFactors(bp, bg);
        const badge = getDayHealthBadge(riskFactors);
        const healthScore = getDayHealthScore(bp, bg);
        const summaryParts: string[] = [];
        if (bp) {
          summaryParts.push(`血压 ${bp.systolic ?? '--'}/${bp.diastolic ?? '--'} ${bp.unit || 'mmHg'}`);
        }
        if (bg) {
          summaryParts.push(`血糖 ${(bg.value ?? '--')} ${bg.unit || 'mmol/L'}`);
        }
        return {
          date,
          entries,
          bp,
          bg,
          riskFactors,
          healthScore,
          badge,
          summary: summaryParts.join('，') || '暂无指标数据',
        };
      });
  }, [vitals]);

  const vitalsStats = useMemo(() => ({
    totalDays: dailyVitalSummaries.length,
    healthy: dailyVitalSummaries.filter((d) => d.riskFactors.length === 0).length,
    needsAttention: dailyVitalSummaries.filter((d) => d.riskFactors.length === 1).length,
    warnings: dailyVitalSummaries.filter((d) => d.riskFactors.length > 1).length,
  }), [dailyVitalSummaries]);

  const aiSummary = useMemo(() => generatePatientAiSummary({
    patientId,
    patientName: patient?.name || initialPatient?.name || '患者',
    vitals,
    meals,
    reports,
  }), [patientId, patient?.name, initialPatient?.name, vitals, meals, reports]);

  const aiTimeline = useMemo(() => {
    const items: Array<{ id: string; time: string; title: string; detail: string; level: 'high' | 'medium' | 'low' }> = [];
    aiSummary.alerts.forEach((alert) => {
      items.push({
        id: `${alert.id}-timeline`,
        time: alert.createdAt,
        title: alert.title,
        detail: `${alert.reason} · 建议：${alert.recommendation}`,
        level: alert.severity,
      });
    });
    dailyVitalSummaries.slice(0, 3).forEach((day, index) => {
      if (day.riskFactors.length > 0) {
        items.push({
          id: `${day.date}-${index}`,
          time: `${day.date}T08:00:00`,
          title: `AI 识别到 ${day.date} 的趋势波动`,
          detail: `${day.riskFactors.join('、')}；健康评分 ${day.healthScore}/100。`,
          level: day.riskFactors.length > 1 ? 'high' : 'medium',
        });
      }
    });
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [aiSummary, dailyVitalSummaries]);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
          加载中...
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              基本信息
            </h3>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {[
                  { label: '姓名', value: patient?.name },
                  { label: '年龄', value: patient?.age ? `${patient.age} 岁` : '-' },
                  { label: '性别', value: patient?.gender === 'male' ? '男' : patient?.gender === 'female' ? '女' : '-' },
                  { label: '联系电话', value: patient?.phone || '-' },
                  { label: '注册时间', value: patient?.createdAt ? new Date(patient.createdAt).toLocaleDateString('zh-CN') : '-' },
                ].map((field, idx) => (
                  <div key={field.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>{field.label}</span>
                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'meals':
        const mealsByDayMap = new Map<string, DailyMealSummary>();
        for (const m of meals) {
          const date = (m.mealDate || m.createdAt || '').split('T')[0];
          if (!mealsByDayMap.has(date)) mealsByDayMap.set(date, { date, meals: [], totalCalories: 0 });
          const d = mealsByDayMap.get(date)!;
          d.meals.push(m);
          d.totalCalories += Number(m.calories || 0);
        }
        const dailyMeals = Array.from(mealsByDayMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                餐食记录（{dailyMeals.length} 天 / {meals.length} 条）
              </h3>
            </div>
            {dailyMeals.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无餐食记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dailyMeals.map((day) => (
                  <div key={day.date} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {day.date}
                      </span>
                      <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 'bold' }}>
                        {day.totalCalories} kcal
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                      当日 {day.meals.length} 条记录 · 食物：{Array.from(new Set(day.meals.flatMap((m) => (m.foods || []).map((f: any) => f?.name).filter(Boolean)))).join('、') || '暂无'}
                    </div>
                    <button
                      onClick={() => setSelectedMealDay(day)}
                      style={{ marginTop: 10, border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 10px', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer' }}
                    >
                      查看当日三餐详情
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                        ({(() => {
                          const latest = [...day.meals].sort((a, b) => toMealTimestamp(b) - toMealTimestamp(a))[0];
                          return `最后更新 ${formatMinute((latest as any)?.mealTime || latest?.createdAt)}`;
                        })()})
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedMealDay && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedMealDay(null);
                }}
                style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              >
                <div style={{ width: '100%', maxWidth: 860, maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>{selectedMealDay.date} · 三餐明细</h4>
                    <button onClick={() => setSelectedMealDay(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>

                  {['breakfast', 'lunch', 'dinner', 'snack'].map((mt) => {
                    const labelMap: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
                    const list = selectedMealDay.meals.filter((m) => m.mealType === mt);
                    return (
                      <div key={mt} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                        <p style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>{labelMap[mt]}（{list.length}）</p>
                        {list.length === 0 ? (
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>无记录</p>
                        ) : (
                          list.map((m) => (
                            <div key={m.id} style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                              <p style={{ margin: 0, fontSize: 12, color: '#334155' }}>记录时间：{formatMinute((m as any).mealTime || m.createdAt)}</p>
                              <p style={{ margin: '4px 0', fontSize: 13, color: '#334155' }}>食物：{(m.foods || []).map((f: any) => f?.name).filter(Boolean).join('、') || '暂无'}</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>热量 {m.calories} kcal · 蛋白质 {m.protein}g · 碳水 {m.carbs}g · 脂肪 {m.fat}g</p>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                    当日健康指标：
                    {(() => {
                      const dayVitals = vitals.filter((v) => (v.measuredAt || '').slice(0, 10) === selectedMealDay.date);
                      const bp = dayVitals.find((v) => v.type === 'blood_pressure');
                      const bg = dayVitals.find((v) => v.type === 'blood_sugar');
                      return ` 血压 ${bp ? `${bp.systolic}/${bp.diastolic} (${formatMinute(bp.measuredAt)})` : '暂无'}；血糖 ${bg ? `${bg.value} ${bg.unit || 'mmol/L'} (${formatMinute(bg.measuredAt)})` : '暂无'}`;
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                健康报告（AI 诊疗辅助，{reports.length} 份）
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 8px' }}
                />
                <button
                  disabled={generatingReport}
                  onClick={async () => {
                    try {
                      setGeneratingReport(true);
                      await api.createReport(patientId, { startDate: reportDate, endDate: reportDate });
                      await loadPatientData();
                    } catch (e) {
                      console.error('生成健康报告失败', e);
                    } finally {
                      setGeneratingReport(false);
                    }
                  }}
                  style={{ border: '1px solid #0ea5e9', borderRadius: 8, padding: '6px 10px', background: '#0ea5e9', color: '#fff', cursor: 'pointer' }}
                >
                  {generatingReport ? '生成中...' : '手动生成当日报告'}
                </button>
              </div>
            </div>

            {reports.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无健康报告，请医生手动点击“生成当日报告”
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {reports.map((report) => (
                  <div key={report.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 700 }}>{(report.reportDate || '').slice(0, 10)}</span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>报告生成时间：{formatMinute(report.reportDate)}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
                      {report.summary || 'AI 报告已生成，可查看详情'}
                    </div>

                    <button
                      onClick={() => setSelectedReport(report as any)}
                      style={{ marginTop: 10, border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 10px', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer' }}
                    >
                      查看报告详情
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                        ({(() => {
                          return `最后更新 ${formatMinute(report.reportDate)}`;
                        })()})
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedReport && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedReport(null);
                }}
                style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              >
                <div style={{ width: '100%', maxWidth: 820, maxHeight: '86vh', overflow: 'auto', background: '#fff', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>
                      {(selectedReport.reportDate || '').slice(0, 10)} · AI 健康报告
                    </h4>
                    <button onClick={() => setSelectedReport(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>

                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                    最后更新：{formatMinute(selectedReport.reportDate)}
                  </div>

                  <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                    {selectedReport.summary || '暂无报告摘要'}
                  </div>

                  {Array.isArray(selectedReport.recommendations) && selectedReport.recommendations.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#1e293b' }}>报告要点</p>
                      {selectedReport.recommendations.map((r, i) => (
                        <p key={`${r}-${i}`} style={{ margin: '4px 0', fontSize: 13, color: '#475569' }}>{i + 1}. {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'aiConsult': {
        const toggleExpand = (id: string) => {
          setExpandedAiReports(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          });
        };
        // summary 预览：取前 80 字
        const getPreview = (text: string) => {
          if (!text) return '暂无摘要';
          const plain = text.replace(/[#*\-•]/g, '').replace(/\n+/g, ' ').trim();
          return plain.length > 80 ? plain.slice(0, 80) + '…' : plain;
        };

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                AI 会诊报告（{aiConsultReports.length} 份）
              </h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>来自患者端上传触发</span>
            </div>

            {aiConsultReports.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                <Sparkles style={{ width: 32, height: 32, color: '#c7d2fe', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>暂无 AI 会诊报告</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>患者在家属端上传检查单后，系统会自动生成会诊报告并展示在此处。</p>
              </div>
            ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {aiConsultReports.map((report) => {
                const isExpanded = expandedAiReports.has(report.id);
                return (
                <div
                  key={report.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: isExpanded ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                    boxShadow: isExpanded ? '0 4px 16px rgba(67,56,202,0.08)' : '0 1px 3px rgba(15,23,42,0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* 卡片头部 - 始终可见 */}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Sparkles style={{ width: 16, height: 16, color: '#8b5cf6', flexShrink: 0 }} />
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{report.title}</span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                          {report.hospitalName} · {formatDateTime(report.createdAt)}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          background: report.riskLevel === 'high' ? '#fee2e2' : report.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                          color: report.riskLevel === 'high' ? '#b91c1c' : report.riskLevel === 'medium' ? '#b45309' : '#166534',
                        }}
                      >
                        {report.riskLevel === 'high' ? '重点关注' : report.riskLevel === 'medium' ? '需观察' : '平稳'}
                      </span>
                    </div>

                    {/* 标签 */}
                    {report.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {report.tags.map((tag) => (
                          <span key={tag} style={{ fontSize: 11, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 999, padding: '3px 8px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 折叠时显示预览 */}
                    {!isExpanded && (
                      <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.6, color: '#94a3b8' }}>
                        {getPreview(report.summary)}
                      </p>
                    )}

                    {/* 展开/折叠按钮 + 操作栏 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => toggleExpand(report.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 14px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          background: isExpanded ? '#f5f3ff' : '#f8fafc',
                          color: isExpanded ? '#6d28d9' : '#475569',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                        {isExpanded ? '收起文字版' : '展开文字版'}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>素材 {report.sourceMaterials.length} 份</span>
                        {report.reportUrl && (
                          <a
                            href={report.reportUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 12px',
                              borderRadius: 10,
                              background: '#0f172a',
                              color: '#fff',
                              textDecoration: 'none',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            查看完整报告
                            <ExternalLink style={{ width: 12, height: 12 }} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 展开后的格式化文字版 */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: '1px solid #e2e8f0',
                        background: 'linear-gradient(180deg, #fafafe 0%, #ffffff 100%)',
                        padding: '20px 24px 24px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <FileText style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#4338ca', letterSpacing: '0.04em' }}>AI 会诊分析全文</span>
                      </div>
                      <div
                        style={{
                          padding: '16px 20px',
                          borderRadius: 14,
                          background: '#ffffff',
                          border: '1px solid #f1f5f9',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                          maxHeight: 520,
                          overflowY: 'auto',
                        }}
                      >
                        {renderFormattedText(report.summary)}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            )}
          </div>
        );
      }

      case 'orders':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              医嘱记录（{orders.length} 条）
            </h3>
            {orders.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无医嘱记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((order) => (
                  <div key={order.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>{order.doctorName}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '8px' }}>
                          {order.hospitalName} · {order.visitDate}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#1e293b',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {order.content}
                    </div>
                    {order.originalImage && (
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedOrderImage(order)}
                          style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            padding: '8px 12px',
                            background: '#fff',
                            color: '#334155',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          查看医嘱原件
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedOrderImage && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedOrderImage(null);
                }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 120,
                  background: 'rgba(15,23,42,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                }}
              >
                <div style={{ width: '100%', maxWidth: 920, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 18, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#1e293b' }}>医嘱原件</h4>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>{selectedOrderImage.hospitalName || '医院'} · {selectedOrderImage.visitDate || '就诊日期未填写'}</p>
                    </div>
                    <button onClick={() => setSelectedOrderImage(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>

                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <img
                      src={selectedOrderImage.originalImage}
                      alt="医嘱原件"
                      style={{ width: '100%', display: 'block', objectFit: 'contain', background: '#f8fafc' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'medications':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              用药管理（{medications.length} 条）
            </h3>
            {medications.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无用药记录
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {medications.map((med) => (
                  <div key={med.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${med.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`,
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: '600' }}>
                        {med.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                      <span>{med.dosage}</span>
                      <span>{med.frequency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>
                        开始：{med.startDate}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: med.status === 'active' ? '#dcfce7' : '#f1f5f9',
                        color: med.status === 'active' ? '#166534' : '#64748b',
                      }}>
                        {med.status === 'active' ? '服用中' : '已停用'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'healthProfile':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
              健康档案
            </h3>
            {healthConditions.length === 0 ? (
              <div style={{ padding: '24px', borderRadius: 12, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                暂无健康档案信息
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {healthConditions.map((cond) => (
                  <div key={cond.id} style={{
                    borderRadius: 12,
                    padding: '16px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{cond.conditionName || cond.condition_name}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{cond.conditionType === 'disease' ? '疾病' : cond.conditionType === 'surgery' ? '手术' : '过敏'} · {cond.diagnosedDate ? cond.diagnosedDate.split('T')[0] : '未知'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap' }}>{cond.notes || cond.note || '未填写备注'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'vitals':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
              健康指标 · 按日展示
            </h3>
            <p style={{ color: '#64748b', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
              参考健康报告的视觉规范，按天展示关键生命体征与健康评分。
            </p>

            {dailyVitalSummaries.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无健康指标记录
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {[{
                    label: '覆盖天数',
                    value: vitalsStats.totalDays,
                    icon: '🗓️',
                    color: '#1e293b',
                  }, {
                    label: '指标健康',
                    value: vitalsStats.healthy,
                    icon: '✅',
                    color: '#047857',
                  }, {
                    label: '需关注',
                    value: vitalsStats.needsAttention,
                    icon: '⚠️',
                    color: '#92400e',
                  }, {
                    label: '警示',
                    value: vitalsStats.warnings,
                    icon: '🚨',
                    color: '#b91c1c',
                  }].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        borderRadius: 16,
                        backgroundColor: '#ffffff',
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#eef2ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{stat.label}</p>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: stat.color }}>{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {dailyVitalSummaries.map((day) => (
                    <div
                      key={day.date}
                      style={{
                        borderRadius: 16,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>{day.date}</p>
                          <h4 style={{ margin: '4px 0 0 0', fontSize: 18, color: '#1e293b' }}>{day.summary}</h4>
                        </div>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 999,
                            backgroundColor: day.badge.bg,
                            color: day.badge.color,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {day.badge.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {[{
                          label: '血压',
                          value: day.bp ? `${day.bp.systolic ?? '--'}/${day.bp.diastolic ?? '--'} ${day.bp.unit || 'mmHg'}` : '未采集',
                          updatedAt: day.bp ? formatDateTime(day.bp.measuredAt) : undefined,
                        }, {
                          label: '血糖',
                          value: day.bg ? `${day.bg.value ?? '--'} ${day.bg.unit || 'mmol/L'}` : '未采集',
                          updatedAt: day.bg ? formatDateTime(day.bg.measuredAt) : undefined,
                        }, {
                          label: '评分',
                          value: `${day.healthScore} / 100`,
                          updatedAt: undefined as string | undefined,
                        }].map((metric) => (
                          <div
                            key={metric.label}
                            style={{
                              flex: '1 1 140px',
                              minWidth: 140,
                              borderRadius: 12,
                              backgroundColor: '#f8fafc',
                              padding: '12px 14px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{metric.label}</p>
                            <p style={{ margin: '6px 0 0 0', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{metric.value}</p>
                            {metric.updatedAt && (
                              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#94a3b8' }}>更新：{metric.updatedAt}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
                        <span>采集条数：{day.entries.length}</span>
                        <span>{day.riskFactors.join('、')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'followup':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              随访计划
            </h3>
            <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                随访计划功能即将上线
              </p>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              聊天记录
            </h3>
            <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                聊天记录功能即将上线
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc' }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          返回患者列表
        </button>
        
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* 健康预警横幅 */}
      {alerts.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0 }} />
          <div>
            <span style={{ color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
              健康预警：
            </span>
            <span style={{ color: '#7f1d1d', fontSize: '14px', marginLeft: '4px' }}>
              {alerts.join('、')}
            </span>
          </div>
        </div>
      )}

      <div style={{
        marginBottom: '20px',
        borderRadius: '20px',
        padding: '22px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 45%, #ecfeff 100%)',
        border: '1px solid #dbeafe',
        boxShadow: '0 12px 28px rgba(59,130,246,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BrainCircuit style={{ width: 18, height: 18, color: '#4338ca' }} />
              <span style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>
                AI Health Assessment
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>AI 风险评估</h3>
            <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>{aiSummary.summary}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ padding: '6px 12px', borderRadius: 999, background: '#e0e7ff', color: '#4338ca', fontSize: 12, fontWeight: 700 }}>
                风险评分 {aiSummary.riskScore}/100
              </span>
              <span style={{ padding: '6px 12px', borderRadius: 999, background: '#cffafe', color: '#0f766e', fontSize: 12, fontWeight: 700 }}>
                置信度 {aiSummary.confidence}%
              </span>
              <span style={{ padding: '6px 12px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontSize: 12, fontWeight: 700 }}>
                {aiSummary.statusLabel}
              </span>
            </div>
          </div>

          <div style={{ flex: '1 1 260px', minWidth: 240 }}>
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>AI 发现的关键洞察</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{aiSummary.insight}</div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#0f766e', lineHeight: 1.7 }}>
                <strong>建议：</strong>{aiSummary.recommendation}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18 }}>
          {aiSummary.dimensions.map((dimension) => (
            <div key={dimension.label} style={{ background: 'rgba(255,255,255,0.82)', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.9)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{dimension.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{dimension.score}</span>
              </div>
              <div style={{ marginTop: 10, height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${dimension.score}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #38bdf8, #8b5cf6)' }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>{dimension.note}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {aiSummary.basis.map((item, idx) => (
            <span key={`${item}-${idx}`} style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, color: '#334155', background: 'rgba(255,255,255,0.86)', border: '1px solid #e2e8f0' }}>
              ✨ {item}
            </span>
          ))}
        </div>
      </div>

      {/* 患者基本信息卡片 */}
      {patient && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#0891b215',
              color: '#0891b2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}>
              👤
            </div>
            <div style={{ flex: '1 1 220px', minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  {patient.name}
                </h2>
                <button
                  onClick={() => loadPatientData()}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: loading ? '#f1f5f9' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '999px',
                    color: loading ? '#94a3b8' : '#0891b2',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#0891b2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <RefreshCw 
                    style={{ 
                      width: '14px', 
                      height: '14px',
                      animation: loading ? 'spin 1s linear infinite' : 'none'
                    }} 
                  />
                  {loading ? '刷新中...' : '刷新'}
                </button>
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                {patient.age}岁 · {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '未知'} · {patient.phone || '未填写'}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0' }}>
                ID：{patient.id}
              </p>
            </div>
            <div style={{ flex: '1 1 200px', minWidth: 200, fontSize: 13, color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 12px' }}>
              <div>
                <span style={{ display: 'block', color: '#94a3b8' }}>邮箱</span>
                <span>{patient.email || '未填写'}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#94a3b8' }}>注册时间</span>
                <span>{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('zh-CN') : '未知'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 功能 Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        gap: '4px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0891b2' : 'transparent',
                color: isActive ? 'white' : '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        {activeTab === 'vitals' && aiTimeline.length > 0 && (
          <div style={{ marginBottom: 24, padding: 18, borderRadius: 16, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles style={{ width: 18, height: 18, color: '#9333ea' }} />
              <h3 style={{ margin: 0, fontSize: 18, color: '#581c87' }}>AI 异常检测时间线</h3>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {aiTimeline.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, borderRadius: 12, background: 'white', border: '1px solid #f3e8ff' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: item.level === 'high' ? '#fee2e2' : item.level === 'medium' ? '#fef3c7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp style={{ width: 16, height: 16, color: item.level === 'high' ? '#b91c1c' : item.level === 'medium' ? '#b45309' : '#1d4ed8' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDateTime(item.time)}</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {renderTabContent()}
      </div>
    </div>
  );
}
