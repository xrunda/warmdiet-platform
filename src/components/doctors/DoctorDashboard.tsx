/**
 * 医生工作台
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock3,
  HeartPulse,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
  FileText,
  BellRing,
} from 'lucide-react';
import { api } from '../../services/api';

interface HealthAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: 'blood_pressure' | 'blood_sugar' | 'nutrition_score' | 'medication_adherence';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  value?: string;
  normalRange?: string;
  createdAt: string;
}

interface Stats {
  totalPatients: number;
  todayAlerts: number;
  unreadMessages: number;
  pendingFollowUps: number;
}

interface DoctorDashboardProps {
  onTabChange?: (tab: string) => void;
}

export function DoctorDashboard({ onTabChange }: DoctorDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todayAlerts: 0,
    unreadMessages: 0,
    pendingFollowUps: 0,
  });
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // 加载医生授权的患者列表
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

      // 加载患者数据（餐食、报告等）
      let totalMeals = 0;
      let totalReports = 0;

      for (const pid of patientIds) {
        try {
          const mealsRes: any = await api.getMeals(pid);
          totalMeals += (mealsRes.data || []).length;

          const reportsRes: any = await api.getReports(pid);
          totalReports += (reportsRes.data || []).length;
        } catch { /* skip */ }
      }

      // 模拟健康预警数据（实际应该从API获取）
      const mockAlerts: HealthAlert[] = [
        {
          id: '1',
          patientId: 'p1',
          patientName: patientNameMap.get('p1') || '张三',
          type: 'blood_pressure',
          severity: 'high',
          title: '血压偏高',
          description: '最近测量血压 142/92 mmHg，高于正常范围',
          value: '142/92 mmHg',
          normalRange: '< 130/85 mmHg',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          patientId: 'p2',
          patientName: patientNameMap.get('p2') || '李四',
          type: 'nutrition_score',
          severity: 'medium',
          title: '营养评分偏低',
          description: '本周营养评分 65 分，饮食结构需要调整',
          value: '65分',
          normalRange: '> 70分',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          patientId: 'p3',
          patientName: patientNameMap.get('p3') || '王五',
          type: 'blood_sugar',
          severity: 'medium',
          title: '空腹血糖偏高',
          description: '空腹血糖 7.2 mmol/L，建议复查',
          value: '7.2 mmol/L',
          normalRange: '< 6.1 mmol/L',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      setStats({
        totalPatients: patientIds.size,
        todayAlerts: mockAlerts.length,
        unreadMessages: 3,
        pendingFollowUps: 2,
      });
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('加载工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: HealthAlert['type']) => {
    const icons = {
      blood_pressure: HeartPulse,
      blood_sugar: Activity,
      nutrition_score: UtensilsCrossed,
      medication_adherence: FileText,
    };
    return icons[type];
  };

  const getSeverityConfig = (severity: HealthAlert['severity']) => {
    const configs = {
      low: {
        bg: { backgroundColor: '#eff6ff' },
        border: 'border-blue-200',
        icon: { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8' },
        badge: { backgroundColor: '#dbeafe', color: '#1e40af' },
        label: '一般',
      },
      medium: {
        bg: { backgroundColor: '#fffbeb' },
        border: 'border-amber-200',
        icon: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' },
        badge: { backgroundColor: '#fef3c7', color: '#92400e' },
        label: '关注',
      },
      high: {
        bg: { backgroundColor: '#fef2f2' },
        border: 'border-red-200',
        icon: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#991b1b' },
        badge: { backgroundColor: '#fee2e2', color: '#7f1d1d' },
        label: '紧急',
      },
    };
    return configs[severity];
  };

  const statCards = [
    {
      title: '我的患者',
      value: stats.totalPatients,
      description: '已授权的患者总数',
      accent: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
      iconWrap: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857' },
      Icon: Users,
    },
    {
      title: '今日预警',
      value: stats.todayAlerts,
      description: 'AI 分析的异常情况',
      accent: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
      iconWrap: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#991b1b' },
      Icon: AlertTriangle,
    },
    {
      title: '未读消息',
      value: stats.unreadMessages,
      description: '患者发来的新消息',
      accent: 'linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%)',
      iconWrap: { backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#155e75' },
      Icon: MessageSquare,
    },
    {
      title: '待随访',
      value: stats.pendingFollowUps,
      description: '近期需要随访的患者',
      accent: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)',
      iconWrap: { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#5b21b6' },
      Icon: Clock3,
    },
  ];

  const quickActions = [
    {
      title: '患者记录',
      desc: '查看患者的餐食记录和健康报告',
      tabId: 'patients',
      Icon: FileText,
      accent: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857' },
    },
    {
      title: '随访计划',
      desc: '查看和安排患者随访',
      tabId: 'followup',
      Icon: Clock3,
      accent: { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#5b21b6' },
    },
    {
      title: '我的患者',
      desc: '管理患者授权',
      tabId: 'authorizations',
      Icon: ShieldCheck,
      accent: { backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#155e75' },
    },
  ];

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: 24 }}>
      {/* 头部 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <HeartPulse style={{ width: 18, height: 18, color: '#0891b2' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', color: '#155e75', textTransform: 'uppercase' }}>
            Doctor Workspace
          </span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          工作台
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 14, marginBottom: 0 }}>
          欢迎回来，{user?.name || '医生'}。今日有 {stats.todayAlerts} 条健康预警需要关注。
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.Icon;
          return (
            <article
              key={stat.title}
              style={{
                background: 'white',
                borderRadius: 24,
                padding: 20,
                boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
                border: '1px solid #e2e8f0',
                animation: `dashboardFade 0.45s ease-out both ${idx * 90}ms`,
              }}
            >
              <div style={{ height: 4, width: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${stat.accent})` }} />
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flexStart' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#64748b', margin: 0 }}>{stat.title}</p>
                  <p style={{ marginTop: 12, fontSize: 38, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    {loading ? '...' : stat.value}
                  </p>
                  <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', margin: 0 }}>{stat.description}</p>
                </div>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...stat.iconWrap
                }}>
                  <Icon style={{ width: 24, height: 24, strokeWidth: 2.1 }} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 1.2fr) 380px' }}>
        {/* 左侧：健康预警 */}
        <div>
          <div style={{
            background: 'white',
            borderRadius: 28,
            padding: 24,
            boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <BellRing style={{ width: 18, height: 18, color: '#dc2626' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.24em', color: '#7f1d1d', textTransform: 'uppercase' }}>
                    AI Health Alerts
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  今日健康预警
                </h3>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: '#fee2e2',
                color: '#dc2626'
              }}>
                {alerts.length} 条
              </span>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                  <p style={{ fontSize: 14, color: '#64748b' }}>今日暂无健康预警</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const severity = getSeverityConfig(alert.severity);
                  const AlertIcon = getAlertIcon(alert.type);

                  return (
                    <div
                      key={alert.id}
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        border: `1px solid ${severity.border}`,
                        ...severity.bg,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flexStart',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        ...severity.icon
                      }}>
                        <AlertIcon style={{ width: 20, height: 20 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{alert.patientName}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            ...severity.badge
                          }}>
                            {severity.label}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: 0, marginBottom: 4 }}>
                          {alert.title}
                        </p>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0, marginBottom: 8 }}>
                          {alert.description}
                        </p>
                        {alert.value && alert.normalRange && (
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
                            <span>当前：{alert.value}</span>
                            <span>正常范围：{alert.normalRange}</span>
                          </div>
                        )}
                      </div>
                      <button
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: 'white',
                          color: '#0891b2',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        onClick={() => onTabChange?.('patients')}
                      >
                        查看
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 右侧：快捷操作 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'white',
            borderRadius: 28,
            padding: 24,
            boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles style={{ width: 18, height: 18, color: '#0891b2' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.24em', color: '#155e75', textTransform: 'uppercase' }}>
                Quick Actions
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              快捷操作
            </h3>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quickActions.map((action) => {
                const Icon = action.Icon;
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => onTabChange?.(action.tabId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 16,
                      borderRadius: 20,
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#a5f3fc';
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(8,145,178,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      ...action.accent
                    }}>
                      <Icon style={{ width: 20, height: 20, strokeWidth: 2.1 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0, marginBottom: 2 }}>
                        {action.title}
                      </h4>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{action.desc}</p>
                    </div>
                    <ArrowRight style={{ width: 16, height: 16, color: '#0891b2', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 使用提示 */}
          <div style={{
            padding: 20,
            borderRadius: 24,
            border: '1px solid #bfdbfe',
            background: 'linear-gradient(135deg, #eff8ff 0%, #f4fffb 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <Sparkles style={{ width: 18, height: 18, color: '#0891b2' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.24em', color: '#155e75', textTransform: 'uppercase', margin: 0 }}>
                  Tips
                </p>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  工作提示
                </h4>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#64748b', margin: 0 }}>
              首页优先显示健康预警和待办事项，帮助您快速识别需要关注的患者。进入患者记录后可查看详细的历史数据和医嘱情况。
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dashboardFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-dashboard-fade {
          animation: dashboardFade 0.45s ease-out both;
        }
      `}</style>
    </div>
  );
}
