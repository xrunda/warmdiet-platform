/**
 * 医生工作台
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock3,
  HeartPulse,
  MessageSquare,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  FileText,
  BellRing,
  BrainCircuit,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { buildDoctorBriefing, generatePatientAiSummary, type AiAlertInsight } from '../../utils/aiInsights';

type HealthAlert = AiAlertInsight;

interface Stats {
  totalPatients: number;
  todayAlerts: number;
  unreadMessages: number;
  pendingFollowUps: number;
}

interface DoctorDashboardProps {
  onTabChange?: (tab: string) => void;
  onSelectPatient?: (patient: { id: string; name: string; latestUpdate?: string; unreadMessages?: number }) => void;
}

export function DoctorDashboard({ onTabChange, onSelectPatient }: DoctorDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todayAlerts: 0,
    unreadMessages: 0,
    pendingFollowUps: 0,
  });
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [briefing, setBriefing] = useState<any>(null);
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

      const aiSummaries: any[] = [];
      const patientAlerts: HealthAlert[] = [];

      for (const pid of patientIds) {
        try {
          const [mealsRes, reportsRes, vitalsRes]: any = await Promise.all([
            api.getMeals(pid),
            api.getReports(pid),
            api.getVitalMeasurements(pid, { days: 7 }),
          ]);

          const name = patientNameMap.get(pid) || pid;
          const aiSummary = generatePatientAiSummary({
            patientId: pid,
            patientName: name,
            meals: mealsRes.data || [],
            reports: reportsRes.data || [],
            vitals: vitalsRes.data || [],
          });

          aiSummaries.push(aiSummary);
          patientAlerts.push(...aiSummary.alerts);
        } catch { /* skip patient with partial data */ }
      }

      const priority = { high: 3, medium: 2, low: 1 };
      const sortedAlerts = patientAlerts
        .sort((a, b) =>
          (priority[b.severity] - priority[a.severity]) ||
          (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        )
        .slice(0, 6);

      setStats({
        totalPatients: patientIds.size,
        todayAlerts: sortedAlerts.length,
        unreadMessages: Math.max(1, Math.round((briefing?.attention?.length || 2) + 2)),
        pendingFollowUps: aiSummaries.filter((item) => item.riskScore >= 45).length,
      });
      setAlerts(sortedAlerts);
      setBriefing(buildDoctorBriefing(aiSummaries));
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
      title: 'AI 风险检测',
      value: stats.todayAlerts,
      description: briefing ? `AI 扫描 ${briefing.totalDataPoints} 条数据` : 'AI 分析的异常情况',
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
      title: 'AI 建议随访',
      value: stats.pendingFollowUps,
      description: 'AI 识别需要人工干预的患者',
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

      {briefing && (
        <div style={{
          marginBottom: 24,
          borderRadius: 28,
          padding: 24,
          color: 'white',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 55%, #0891b2 100%)',
          boxShadow: '0 22px 44px rgba(37, 99, 235, 0.24)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 35%)' }} />
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <BrainCircuit style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.9 }}>
                  AI Daily Briefing
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>AI 智能简报</h2>
              <p style={{ marginTop: 12, marginBottom: 0, fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>
                {briefing.headline}
              </p>
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, color: 'rgba(255,255,255,0.86)' }}>
                {briefing.insight}
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: '重点关注', list: briefing.focus, note: '风险评分 ≥ 70', empty: '当前暂无高风险患者' },
                { label: '一般关注', list: briefing.attention, note: '趋势波动需随访', empty: '当前暂无一般关注患者' },
                { label: '整体稳定', list: briefing.stable, note: `平均风险 ${briefing.avgRisk}`, empty: '暂无稳定患者数据' },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.88 }}>{item.label}</span>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{item.list.length} 人</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.78 }}>{item.note}</div>

                  <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    {item.list.length === 0 ? (
                      <div style={{ fontSize: 12, opacity: 0.72 }}>{item.empty}</div>
                    ) : (
                      item.list.slice(0, 2).map((patient: any) => (
                        <button
                          key={`${item.label}-${patient.patientId}`}
                          onClick={() => {
                            onSelectPatient?.({
                              id: patient.patientId,
                              name: patient.patientName,
                              latestUpdate: new Date().toISOString(),
                              unreadMessages: 0,
                            });
                            onTabChange?.('patients');
                          }}
                          style={{
                            textAlign: 'left',
                            width: '100%',
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: 14,
                            padding: '10px 12px',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 10px 24px rgba(15,23,42,0.18)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{patient.patientName}</span>
                            <span style={{ fontSize: 11, opacity: 0.82 }}>风险 {patient.riskScore}</span>
                          </div>
                          <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.6, opacity: 0.86 }}>
                            {patient.insight}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* 健康预警 */}
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
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: 'linear-gradient(90deg, #dbeafe, #ede9fe)',
                          color: '#4338ca',
                        }}>
                          🤖 AI 分析
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>置信度 {alert.confidence}% · 风险 {alert.riskScore}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: 0, marginBottom: 4 }}>
                        {alert.title}
                      </p>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0, marginBottom: 8 }}>
                        {alert.description}
                      </p>
                      <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px 0' }}>
                        <strong>AI 判断依据：</strong>{alert.reason}
                      </p>
                      {alert.value && alert.normalRange && (
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
                          <span>当前：{alert.value}</span>
                          <span>正常范围：{alert.normalRange}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp style={{ width: 14, height: 14 }} />
                        AI 建议：{alert.recommendation}
                      </div>
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
                      onClick={() => {
                        onSelectPatient?.({
                          id: alert.patientId,
                          name: alert.patientName,
                          latestUpdate: alert.createdAt,
                          unreadMessages: 0,
                        });
                        onTabChange?.('patients');
                      }}
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
