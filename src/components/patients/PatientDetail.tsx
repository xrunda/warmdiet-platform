/**
 * 患者详情页 - 以患者为中心，整合所有功能模块
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, User, UtensilsCrossed, FileText, Activity, Pill, CalendarDays, MessageSquare, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

type TabType = 'profile' | 'meals' | 'reports' | 'orders' | 'medications' | 'followup' | 'vitals' | 'chat';

interface PatientDetailProps {
  patientId: string;
  onBack?: () => void;
}

type ApiListResponse<T> = { data?: T[] };

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

export function PatientDetail({ patientId, onBack }: PatientDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<VitalMeasurement[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [selectedMealDay, setSelectedMealDay] = useState<DailyMealSummary | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  async function loadPatientData() {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [mealsRes, reportsRes, vitalsRes] = await Promise.all([
        (api.getMeals(patientId) as Promise<ApiListResponse<MealRecord>>).catch(() => ({ data: [] })),
        (api.getReports(patientId) as Promise<ApiListResponse<HealthReport>>).catch(() => ({ data: [] })),
        (api.getVitalMeasurements(patientId, { days: 30 }) as Promise<ApiListResponse<VitalApiItem>>).catch(() => ({ data: [] })),
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
      setPatient({
        id: patientId,
        name: `患者 ${patientId.split('_').pop()}`,
        age: 65,
        gender: 'male',
        phone: '138****1234',
        createdAt: new Date().toISOString(),
      });

      setOrders([
        {
          id: 'o1',
          patientId,
          content: '控制饮食，少盐少油，每日步行30分钟',
          doctorName: '王医生',
          hospitalName: '测试医院',
          visitDate: new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0],
          createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        },
      ]);

      setMedications([
        {
          id: 'm1',
          patientId,
          name: '氨氯地平片',
          dosage: '5mg',
          frequency: '每日一次',
          startDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0],
          status: 'active',
          createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        },
      ]);

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
    { id: 'profile', label: '基本信息', icon: User },
    { id: 'meals', label: '餐食记录', icon: UtensilsCrossed, count: meals.length },
    { id: 'reports', label: '健康报告', icon: FileText, count: reports.length },
    { id: 'orders', label: '医嘱记录', icon: Activity },
    { id: 'medications', label: '用药管理', icon: Pill, count: medications.filter(m => m.status === 'active').length },
    { id: 'vitals', label: '健康指标', icon: Activity, count: vitals.length },
    { id: 'followup', label: '随访计划', icon: CalendarDays },
    { id: 'chat', label: '聊天记录', icon: MessageSquare },
  ];

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
                  </div>
                ))}
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

      case 'vitals':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              健康指标（{vitals.length} 条记录）
            </h3>
            {vitals.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无健康指标记录
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {vitals.map((vital) => (
                  <div key={vital.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {vital.type === 'blood_pressure' ? '血压' : '血糖'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {new Date(vital.measuredAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    {vital.type === 'blood_pressure' ? (
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                        {vital.systolic}/{vital.diastolic} mmHg
                      </div>
                    ) : (
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                        {vital.value} {vital.unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
      {/* 返回按钮 */}
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
          marginBottom: '20px',
        }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        返回患者列表
      </button>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>
                {patient.name}
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                {patient.age}岁 · {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : ''} · {patient.phone}
              </p>
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
        {renderTabContent()}
      </div>
    </div>
  );
}
