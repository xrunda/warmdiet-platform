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

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  async function loadPatientData() {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [mealsRes, reportsRes] = await Promise.all([
        api.getMeals(patientId).catch(() => ({ data: [] })),
        api.getReports(patientId).catch(() => ({ data: [] })),
      ]);

      setMeals(mealsRes.data || []);
      setReports(reportsRes.data || []);

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

      setVitals([
        {
          id: 'v1',
          type: 'blood_pressure',
          systolic: 142,
          diastolic: 92,
          measuredAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        },
        {
          id: 'v2',
          type: 'blood_sugar',
          value: 7.2,
          unit: 'mmol/L',
          measuredAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        },
      ]);

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

  const tabs = [
    { id: 'profile', label: '基本信息', icon: User },
    { id: 'meals', label: '餐食记录', icon: UtensilsCrossed, count: meals.length },
    { id: 'reports', label: '健康报告', icon: FileText, count: reports.length },
    { id: 'orders', label: '医嘱记录', icon: Activity },
    { id: 'medications', label: '用药管理', icon: Pill, count: medications.filter(m => m.status === 'active').length },
    { id: 'vitals', label: '健康指标', icon: Activity, count: vitals.length },
    { id: 'followup', label: '随访计划', icon: CalendarDays },
    { id: 'chat', label: '聊天记录', icon: MessageSquare },
  ] as const;

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
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                餐食记录（{meals.length} 条）
              </h3>
            </div>
            {meals.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无餐食记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {meals.map((meal) => (
                  <div key={meal.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {meal.mealDate} · {meal.mealType}
                      </span>
                      <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 'bold' }}>
                        {meal.calories} kcal
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                      蛋白质 {meal.protein}g · 碳水 {meal.carbs}g · 脂肪 {meal.fat}g
                    </div>
                    {meal.notes && (
                      <div style={{ marginTop: '8px', color: '#94a3b8', fontSize: '12px' }}>
                        备注：{meal.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
              健康报告（{reports.length} 条）
            </h3>
            {reports.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                暂无健康报告
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {reports.map((report) => (
                  <div key={report.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {report.reportDate}
                      </span>
                    </div>
                    {report.nutritionScore != null && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: report.nutritionScore >= 70 ? '#10b981' : '#f97316', fontSize: '24px', fontWeight: 'bold' }}>
                          {report.nutritionScore}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '14px', marginLeft: '8px' }}>
                          分营养评分
                        </span>
                      </div>
                    )}
                    <div style={{ color: '#1e293b', fontSize: '14px', lineHeight: '1.6' }}>
                      {report.summary}
                    </div>
                    {report.recommendations && report.recommendations.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0, marginBottom: '8px' }}>
                          建议：
                        </p>
                        {report.recommendations.map((rec, idx) => (
                          <p key={idx} style={{ color: '#475569', fontSize: '13px', margin: '0 0 4px 16px' }}>
                            {idx + 1}. {rec}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
