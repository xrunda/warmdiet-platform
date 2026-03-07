/**
 * 患者健康记录 - 合并餐食记录和健康报告
 * 按患者分组，按更新日期排序，时间线查看历史数据
 */

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

type MealRecord = {
  id: string;
  patientId: string;
  date: string;
  mealType: string;
  foods: Array<{ name: string; amount: string; calories: number }>;
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
  startDate: string;
  endDate: string;
  period: string;
  summary: string;
  recommendations: string[];
  riskFactors: string[];
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

type PatientData = {
  id: string;
  name: string;
  meals: MealRecord[];
  reports: HealthReport[];
  medicalOrders: MedicalOrder[];
  medications: Medication[];
  latestUpdate: string;
  unreadMessages?: number;
};

type TimelineItem = {
  id: string;
  type: 'meal' | 'report';
  date: string;
  timestamp: string;
  data: MealRecord | HealthReport;
};

type PatientDetailProps = {
  patient: PatientData;
  onClose: () => void;
};

// 医嘱查看模态框
function MedicalOrdersModal({ patient, onClose }: { patient: PatientData; onClose: () => void }) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(15,23,42,0.25)',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              医嘱记录
            </h3>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 13,
                color: '#64748b'
              }}
            >
              {patient.name} · 共 {patient.medicalOrders.length} 条
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              color: '#64748b',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {patient.medicalOrders.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: '#94a3b8'
              }}
            >
              暂无医嘱记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {patient.medicalOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 12
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#64748b'
                        }}
                      >
                        {order.doctorName}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          marginTop: 2,
                          fontSize: 12,
                          color: '#94a3b8'
                        }}
                      >
                        {order.hospitalName} · {order.visitDate}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: '#1e293b',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6
                      }}
                    >
                      {order.content}
                    </p>
                  </div>

                  {order.originalImage && (
                    <div
                      style={{
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <img
                        src={order.originalImage}
                        alt="医嘱照片"
                        style={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 用药查看模态框
function MedicationsModal({ patient, onClose }: { patient: PatientData; onClose: () => void }) {
  const getStatusConfig = (status: Medication['status']) => {
    const configs = {
      active: { bg: '#dcfce7', color: '#166534', label: '服用中' },
      stopped: { bg: '#fee2e2', color: '#991b1b', label: '已停药' },
      completed: { bg: '#f1f5f9', color: '#64748b', label: '已完成' }
    };
    return configs[status];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(15,23,42,0.25)',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              当前用药
            </h3>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 13,
                color: '#64748b'
              }}
            >
              {patient.name} · 共 {patient.medications.length} 种
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              color: '#64748b',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {patient.medications.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: '#94a3b8'
              }}
            >
              暂无用药记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {patient.medications.map((med) => {
                const status = getStatusConfig(med.status);
                return (
                  <div
                    key={med.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 12,
                      padding: 16,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#1e293b',
                          marginBottom: 4
                        }}
                      >
                        {med.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: '#64748b'
                        }}
                      >
                        {med.dosage} · {med.frequency}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          marginTop: 4,
                          fontSize: 12,
                          color: '#94a3b8'
                        }}
                      >
                        {formatDate(med.startDate)} ~ {med.endDate ? formatDate(med.endDate) : '长期'}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: status.bg,
                        color: status.color
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 患者详情模态框
function PatientDetail({ patient, onClose }: PatientDetailProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'meal' | 'report'>('all');
  const [showMedicalOrders, setShowMedicalOrders] = useState(false);
  const [showMedications, setShowMedications] = useState(false);

  // 合并所有记录到时间线
  const timeline: TimelineItem[] = useMemo(() => {
    const mealItems: TimelineItem[] = patient.meals.map(meal => ({
      id: meal.id,
      type: 'meal' as const,
      date: meal.date,
      timestamp: meal.createdAt,
      data: meal,
    }));

    const reportItems: TimelineItem[] = patient.reports.map(report => ({
      id: report.id,
      type: 'report' as const,
      date: report.reportDate,
      timestamp: report.createdAt,
      data: report,
    }));

    const all = [...mealItems, ...reportItems].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return all;
  }, [patient.meals, patient.reports]);

  const filteredTimeline = useMemo(() => {
    if (selectedType === 'all') return timeline;
    return timeline.filter(item => item.type === selectedType);
  }, [timeline, selectedType]);

  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍪',
    };
    return icons[type] || '🍽️';
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return labels[type] || '餐食';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateStr.split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return '今天';
    if (dateOnly === yesterdayOnly) return '昨天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 700,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(15,23,42,0.25)',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 头部 */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                {patient.name}
              </h3>
              <p
                style={{
                  margin: 0,
                  marginTop: 4,
                  fontSize: 13,
                  color: '#64748b'
                }}
              >
                共 {patient.meals.length} 条餐食 · {patient.reports.length} 份报告
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: 18,
                color: '#64748b',
                padding: 4
              }}
            >
              ✕
            </button>
          </div>

          {/* 医嘱/用药入口 */}
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              gap: 12
            }}
          >
            <button
              type="button"
              onClick={() => setShowMedicalOrders(true)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#0891b2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <span style={{ fontSize: 16 }}>📋</span>
              医嘱 ({patient.medicalOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setShowMedications(true)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#0891b2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <span style={{ fontSize: 16 }}>💊</span>
              用药 ({patient.medications.length})
            </button>
          </div>

          {/* 筛选按钮 */}
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              gap: 8
            }}
          >
            {[
              { label: '全部', value: 'all' },
              { label: '餐食', value: 'meal' },
              { label: '报告', value: 'report' }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedType(opt.value as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: selectedType === opt.value ? '#0891b2' : '#f1f5f9',
                  color: selectedType === opt.value ? '#ffffff' : '#64748b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 时间线内容 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px 24px'
            }}
          >
            {filteredTimeline.length === 0 ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}
              >
                暂无记录
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* 时间线 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    backgroundColor: '#e2e8f0'
                  }}
                />

                {filteredTimeline.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'relative',
                      marginBottom: idx < filteredTimeline.length - 1 ? 24 : 0,
                      paddingLeft: 36
                    }}
                  >
                    {/* 时间线节点 */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 4,
                        top: 8,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: item.type === 'meal' ? '#fef3c7' : '#dbeafe',
                        border: '2px solid',
                        borderColor: item.type === 'meal' ? '#f59e0b' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10
                      }}
                    >
                      {item.type === 'meal' ? '🍽️' : '📋'}
                    </div>

                    {/* 日期标签 */}
                    {idx === 0 || formatDate(item.date) !== formatDate(filteredTimeline[idx - 1]?.date) ? (
                      <div
                        style={{
                          marginBottom: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#64748b'
                        }}
                      >
                        {formatDate(item.date)}
                      </div>
                    ) : null}

                    {/* 内容卡片 */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 12,
                        padding: 16,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
                      }}
                    >
                      {item.type === 'meal' ? (
                        <MealCardContent meal={item.data as MealRecord} />
                      ) : (
                        <ReportCardContent report={item.data as HealthReport} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 医嘱模态框 */}
      {showMedicalOrders && (
        <MedicalOrdersModal
          patient={patient}
          onClose={() => setShowMedicalOrders(false)}
        />
      )}

      {/* 用药模态框 */}
      {showMedications && (
        <MedicationsModal
          patient={patient}
          onClose={() => setShowMedications(false)}
        />
      )}
    </>
  );
}

// 餐食卡片内容
function MealCardContent({ meal }: { meal: MealRecord }) {
  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍪',
    };
    return icons[type] || '🍽️';
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return labels[type] || '餐食';
  };

  const getCalorieLevel = (calories: number) => {
    if (calories < 300) return { label: '低热量', color: '#10b981', bg: '#d1fae5' };
    if (calories < 500) return { label: '中等热量', color: '#3b82f6', bg: '#bfdbfe' };
    return { label: '高热量', color: '#f97316', bg: '#fee2e2' };
  };

  const calorieLevel = getCalorieLevel(meal.calories);

  const date = new Date(meal.createdAt);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{getMealTypeIcon(meal.mealType)}</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {getMealTypeLabel(meal.mealType)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{time}</p>
          </div>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            backgroundColor: calorieLevel.bg,
            color: calorieLevel.color,
            fontWeight: 600
          }}
        >
          {calorieLevel.label}
        </span>
      </div>

      <div
        style={{
          padding: 12,
          backgroundColor: '#f8fafc',
          borderRadius: 8,
          marginBottom: 8
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#64748b' }}>
          热量：{meal.calories} kcal
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
          蛋白质：{meal.protein}g · 碳水：{meal.carbs}g · 脂肪：{meal.fat}g
        </p>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
        食物：{meal.foods.map(f => f.name).join('、')}
      </p>
      {meal.notes && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8' }}>
          📝 {meal.notes}
        </p>
      )}
    </div>
  );
}

// 报告卡片内容
function ReportCardContent({ report }: { report: HealthReport }) {
  const getHealthStatus = () => {
    if (report.riskFactors.length === 0) {
      return { label: '健康', color: '#10b981', bg: '#d1fae5' };
    }
    if (report.riskFactors.length <= 1) {
      return { label: '亚健康', color: '#f59e0b', bg: '#fef3c7' };
    }
    return { label: '需关注', color: '#f97316', bg: '#fee2e2' };
  };

  const healthStatus = getHealthStatus();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
            健康报告
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
            {report.period} · {formatDate(report.reportDate)}
          </p>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            backgroundColor: healthStatus.bg,
            color: healthStatus.color,
            fontWeight: 600
          }}
        >
          {healthStatus.label}
        </span>
      </div>

      {report.nutritionScore != null && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#f8fafc',
            borderRadius: 8,
            marginBottom: 8
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#64748b' }}>
            营养评分：{report.nutritionScore}
          </p>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginBottom: 8 }}>
        {report.summary}
      </p>

      {report.recommendations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
            建议：
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#64748b' }}>
            {report.recommendations.slice(0, 2).map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {report.riskFactors.length > 0 && (
        <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fef2f2', borderRadius: 6 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#b91c1c' }}>
            ⚠️ 风险因素：{report.riskFactors.join('、')}
          </p>
        </div>
      )}
    </div>
  );
}

export function PatientRecords() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const doctorsRes: any = await api.getDoctors();
      const doctors = doctorsRes.data || [];

      const patientIds = new Set<string>();
      const patientNameMap = new Map<string, string>();

      for (const doc of doctors) {
        try {
          const authRes: any = await api.getDoctorAuthorizations(doc.id);
          const auths = authRes.data || [];
          for (const auth of auths) {
            if (auth.status === 'active') {
              patientIds.add(auth.patientId);
              patientNameMap.set(auth.patientId, auth.patientName || auth.patientId);
            }
          }
        } catch { /* skip */ }
      }

      const patientDataMap = new Map<string, PatientData>();

      for (const pid of patientIds) {
        const data: PatientData = {
          id: pid,
          name: patientNameMap.get(pid) || pid,
          meals: [],
          reports: [],
          medicalOrders: [],
          medications: [],
          latestUpdate: '',
          unreadMessages: Math.floor(Math.random() * 5), // 模拟未读消息数
        };
        patientDataMap.set(pid, data);
      }

      // 加载餐食记录
      for (const pid of patientIds) {
        try {
          const mealsRes: any = await api.getMeals(pid);
          const meals = mealsRes.data || [];
          for (const meal of meals) {
            const foods = Array.isArray(meal.foods)
              ? meal.foods
              : JSON.parse(meal.foods || '[]');
            const mealRecord: MealRecord = {
              id: meal.id,
              patientId: pid,
              date: (meal.mealDate || meal.createdAt || '').split('T')[0],
              mealType: meal.mealType,
              foods: foods.map((f: any) => ({
                name: f.name,
                amount: `${f.amount}${f.unit || ''}`,
                calories: f.calories || 0,
              })),
              calories: meal.calories || foods.reduce((s: number, f: any) => s + (f.calories || 0), 0),
              protein: foods.reduce((s: number, f: any) => s + (f.protein || 0), 0),
              carbs: foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0),
              fat: foods.reduce((s: number, f: any) => s + (f.fat || 0), 0),
              notes: meal.notes,
              createdAt: meal.createdAt || meal.mealDate || new Date().toISOString(),
            };
            const patient = patientDataMap.get(pid);
            if (patient) {
              patient.meals.push(mealRecord);
            }
          }
        } catch { /* skip */ }
      }

      // 加载健康报告
      for (const pid of patientIds) {
        try {
          const reportsRes: any = await api.getReports(pid);
          const patientReports = reportsRes.data || [];
          for (const report of patientReports) {
            let recommendations: string[] = [];
            try {
              recommendations = typeof report.recommendations === 'string'
                ? JSON.parse(report.recommendations)
                : report.recommendations || [];
            } catch {
              recommendations = report.recommendations ? [String(report.recommendations)] : [];
            }

            let trends: any = {};
            try {
              trends = typeof report.trends === 'string'
                ? JSON.parse(report.trends)
                : report.trends || {};
            } catch { /* ignore */ }

            const riskFactors: string[] = [];
            if (report.nutritionScore != null && report.nutritionScore < 70) {
              riskFactors.push('营养评分偏低');
            }

            const reportDate = (report.reportDate || report.createdAt || '').split('T')[0];
            const startDate = report.startDate ? report.startDate.split('T')[0] : '';
            const endDate = report.endDate ? report.endDate.split('T')[0] : '';
            const daysDiff = startDate && endDate
              ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
              : 7;

            const reportData: HealthReport = {
              id: report.id,
              patientId: pid,
              reportDate,
              startDate,
              endDate,
              period: daysDiff <= 7 ? '本周' : '本月',
              summary: recommendations[0] || `营养评分: ${report.nutritionScore ?? '暂无'}`,
              recommendations: recommendations.length > 0
                ? recommendations
                : ['暂无具体建议，请继续保持良好的生活习惯。'],
              riskFactors,
              nutritionScore: report.nutritionScore,
              trends,
              createdAt: report.createdAt || report.reportDate || new Date().toISOString(),
            };

            const patient = patientDataMap.get(pid);
            if (patient) {
              patient.reports.push(reportData);
            }
          }
        } catch { /* skip */ }
      }

      // 模拟医嘱和用药数据
      for (const pid of patientIds) {
        const patient = patientDataMap.get(pid);
        if (!patient) continue;

        // 模拟医嘱
        if (Math.random() > 0.3) {
          patient.medicalOrders.push({
            id: `mo-${pid}`,
            patientId: pid,
            content: '1. 继续低盐低脂饮食\n2. 每日监测血压\n3. 定期复查血脂\n4. 坚持适量运动',
            doctorName: '李医生',
            hospitalName: '市第一医院',
            visitDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          });
        }

        // 模拟用药
        if (Math.random() > 0.3) {
          patient.medications.push({
            id: `med-${pid}-1`,
            patientId: pid,
            name: '氨氯地平片',
            dosage: '5mg/次',
            frequency: '每日1次',
            startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
            status: 'active',
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          });
        }
      }

      // 计算每个患者的最新更新时间并排序
      const patientArray = Array.from(patientDataMap.values()).map(p => {
        const allUpdates = [
          ...p.meals.map(m => new Date(m.createdAt).getTime()),
          ...p.reports.map(r => new Date(r.createdAt).getTime()),
          ...p.medicalOrders.map(m => new Date(m.createdAt).getTime()),
        ];
        p.latestUpdate = allUpdates.length > 0 ? new Date(Math.max(...allUpdates)).toISOString() : new Date(0).toISOString();
        return p;
      }).sort((a, b) => new Date(b.latestUpdate).getTime() - new Date(a.latestUpdate).getTime());

      setPatients(patientArray);
    } catch (err) {
      console.error('Failed to load patient records:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = useMemo(
    () => patients.filter(p => !searchTerm.trim() || p.name.includes(searchTerm.trim())),
    [searchTerm, patients]
  );

  const stats = useMemo(
    () => ({
      totalPatients: patients.length,
      totalMeals: patients.reduce((sum, p) => sum + p.meals.length, 0),
      totalReports: patients.reduce((sum, p) => sum + p.reports.length, 0),
      updatedToday: patients.filter(p => {
        const today = new Date().toISOString().split('T')[0];
        return p.latestUpdate.startsWith(today);
      }).length,
      totalUnread: patients.reduce((sum, p) => sum + (p.unreadMessages || 0), 0),
    }),
    [patients]
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateStr.split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return '今天更新';
    if (dateOnly === yesterdayOnly) return '昨天更新';
    return `${date.getMonth() + 1}月${date.getDate()}日更新`;
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          患者健康记录
        </h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 14, marginBottom: 0 }}>
          查看授权患者的餐食记录和健康报告
        </p>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        {[
          { label: '授权患者', value: stats.totalPatients, icon: '👥', color: '#64748b' },
          { label: '今日更新', value: stats.updatedToday, icon: '📅', color: '#3b82f6' },
          { label: '餐食记录', value: stats.totalMeals, icon: '🍽️', color: '#f59e0b' },
          { label: '健康报告', value: stats.totalReports, icon: '📋', color: '#10b981' }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{stat.label}</p>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#1e293b',
                  marginTop: 8,
                  marginBottom: 0
                }}
              >
                {loading ? '...' : stat.value}
              </p>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#ffffff'
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 搜索栏 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          border: '1px solid #e2e8f0'
        }}
      >
        <input
          type="text"
          placeholder="搜索患者姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            outline: 'none'
          }}
        />
      </div>

      {/* 患者列表 */}
      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
      ) : filteredPatients.length === 0 ? (
        <div
          style={{
            padding: '64px',
            textAlign: 'center',
            color: '#94a3b8',
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ color: '#1e293b', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            暂无患者记录
          </h3>
          <p style={{ color: '#64748b' }}>
            授权患者的健康记录将显示在这里
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 20
          }}
        >
          {filteredPatients.map((patient) => {
            const hasMeals = patient.meals.length > 0;
            const hasReports = patient.reports.length > 0;
            const latestMeal = hasMeals ? patient.meals[0] : null;
            const latestReport = hasReports ? patient.reports[0] : null;

            return (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)';
                }}
              >
                {/* 消息气泡 */}
                {patient.unreadMessages && patient.unreadMessages > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      zIndex: 10
                    }}
                  >
                    {patient.unreadMessages}
                  </div>
                )}

                {/* 头部 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: 12
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#1e293b'
                      }}
                    >
                      {patient.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        marginTop: 4,
                        fontSize: 12,
                        color: '#94a3b8'
                      }}
                    >
                      {formatDate(patient.latestUpdate)}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}
                  >
                    👤
                  </div>
                </div>

                {/* 记录摘要 */}
                <div
                  style={{
                    display: 'flex',
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: hasMeals ? '#fffbeb' : '#f1f5f9',
                      border: hasMeals ? '1px solid #fed7aa' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>🍽️</span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: hasMeals ? '#92400e' : '#64748b'
                        }}
                      >
                        餐食
                      </p>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                        color: hasMeals ? '#92400e' : '#94a3b8'
                      }}
                    >
                      {patient.meals.length}
                    </p>
                    {latestMeal && (
                      <p
                        style={{
                          margin: 0,
                          marginTop: 4,
                          fontSize: 11,
                          color: '#a16207'
                        }}
                      >
                        {latestMeal.calories} kcal
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: hasReports ? '#ecfdf5' : '#f1f5f9',
                      border: hasReports ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>📋</span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: hasReports ? '#065f46' : '#64748b'
                        }}
                      >
                        报告
                      </p>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                        color: hasReports ? '#065f46' : '#94a3b8'
                      }}
                    >
                      {patient.reports.length}
                    </p>
                    {latestReport?.nutritionScore != null && (
                      <p
                        style={{
                          margin: 0,
                          marginTop: 4,
                          fontSize: 11,
                          color: '#047857'
                        }}
                      >
                        评分 {latestReport.nutritionScore}
                      </p>
                    )}
                  </div>
                </div>

                {/* 操作提示 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontSize: 12
                  }}
                >
                  点击查看完整记录
                  <span style={{ fontSize: 10 }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 患者详情模态框 */}
      {selectedPatient && (
        <PatientDetail
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
