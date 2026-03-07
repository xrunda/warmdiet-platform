/**
 * 随访计划
 */

import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock, FileText, Plus, Search } from 'lucide-react';
import { api } from '../../services/api';

interface FollowUpItem {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  lastFollowUp?: string;
}

interface PatientBasicInfo {
  id: string;
  name: string;
  lastUpdate?: string;
}

export function FollowUpPlan() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientBasicInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

      const patientList: PatientBasicInfo[] = Array.from(patientIds).map(id => ({
        id,
        name: patientNameMap.get(id) || id,
        lastUpdate: new Date().toISOString(),
      }));

      // 加载患者数据获取最后更新时间
      for (const patient of patientList) {
        try {
          const mealsRes: any = await api.getMeals(patient.id);
          const meals = mealsRes.data || [];

          const reportsRes: any = await api.getReports(patient.id);
          const reports = reportsRes.data || [];

          const allDates = [
            ...meals.map((m: any) => new Date(m.createdAt || m.mealDate).getTime()),
            ...reports.map((r: any) => new Date(r.createdAt || r.reportDate).getTime()),
          ];

          if (allDates.length > 0) {
            patient.lastUpdate = new Date(Math.max(...allDates)).toISOString();
          }
        } catch { /* skip */ }
      }

      // 模拟随访计划数据（实际应该从API获取）
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const mockFollowUps: FollowUpItem[] = [
        {
          id: 'f1',
          patientId: patientList[0]?.id || 'p1',
          patientName: patientList[0]?.name || '张三',
          type: '定期血压监测',
          scheduledDate: today.toISOString().split('T')[0],
          status: 'pending',
          notes: '患者上周血压控制良好，继续监测',
        },
        {
          id: 'f2',
          patientId: patientList[1]?.id || 'p2',
          patientName: patientList[1]?.name || '李四',
          type: '术后两周复查',
          scheduledDate: tomorrow.toISOString().split('T')[0],
          status: 'pending',
          notes: '检查伤口愈合情况，调整用药',
        },
        {
          id: 'f3',
          patientId: patientList[2]?.id || 'p3',
          patientName: patientList[2]?.name || '王五',
          type: '月度营养评估',
          scheduledDate: nextWeek.toISOString().split('T')[0],
          status: 'pending',
        },
      ];

      setPatients(patientList.sort((a, b) =>
        new Date(b.lastUpdate || 0).getTime() - new Date(a.lastUpdate || 0).getTime()
      ));
      setFollowUps(mockFollowUps);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  // 按日期分组随访
  const groupedFollowUps = followUps.reduce((acc, item) => {
    const date = item.scheduledDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, FollowUpItem[]>);

  // 排序日期
  const sortedDates = Object.keys(groupedFollowUps).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  const today = new Date().toISOString().split('T')[0];
  const todayFollowUps = followUps.filter(f => f.scheduledDate === today);
  const upcomingFollowUps = followUps.filter(f => f.scheduledDate > today);
  const completedFollowUps = followUps.filter(f => f.status === 'completed');

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    if (dateStr === today) return '今天';
    if (dateStr === tomorrowDate.toISOString().split('T')[0]) return '明天';

    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`;
  };

  const getStatusConfig = (status: FollowUpItem['status']) => {
    const configs = {
      pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        label: '待随访',
      },
      completed: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        label: '已完成',
      },
      cancelled: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-500',
        label: '已取消',
      },
    };
    return configs[status];
  };

  const filteredPatients = patients.filter(p =>
    !searchTerm.trim() || p.name.includes(searchTerm.trim())
  );

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          随访计划
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 14, marginBottom: 0 }}>
          管理和跟踪患者的随访计划
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: '今日随访', value: todayFollowUps.length, icon: '📅', color: '#f97316' },
          { label: '待随访', value: upcomingFollowUps.length, icon: '⏰', color: '#3b82f6' },
          { label: '已完成', value: completedFollowUps.length, icon: '✅', color: '#10b981' },
          { label: '总计划', value: followUps.length, icon: '📋', color: '#64748b' }
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

      {/* 随访列表 */}
      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
      ) : followUps.length === 0 ? (
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ color: '#1e293b', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            暂无随访计划
          </h3>
          <p style={{ color: '#64748b' }}>
            创建随访计划后，患者将显示在这里
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sortedDates.map((date) => (
            <div key={date}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Calendar style={{ width: 18, height: 18, color: '#0891b2' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#155e75' }}>
                  {formatDate(date)}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: '#e0f2fe',
                  color: '#075985'
                }}>
                  {groupedFollowUps[date].length} 位患者
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groupedFollowUps[date].map((followUp) => {
                  const status = getStatusConfig(followUp.status);

                  return (
                    <div
                      key={followUp.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24
                        }}>
                          👤
                        </div>
                        <div>
                          <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0, marginBottom: 4 }}>
                            {followUp.patientName}
                          </h4>
                          <p style={{ fontSize: 14, color: '#64748b', margin: 0, marginBottom: 4 }}>
                            {followUp.type}
                          </p>
                          {followUp.notes && (
                            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                              {followUp.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: status.bg,
                          border: `1px solid ${status.border}`,
                          color: status.text
                        }}>
                          {status.label}
                        </span>
                        <button
                          style={{
                            padding: '8px 16px',
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: '#0891b2',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          onClick={() => {
                            // 跳转到患者记录页面，可以通过 URL 参数或状态管理实现
                            window.location.hash = '#patients';
                          }}
                        >
                          {followUp.status === 'pending' ? '去记录' : '查看记录'}
                          <ArrowRight style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建随访计划按钮 */}
      <button
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#0891b2',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(8,145,178,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
        onClick={() => {
          // TODO: 打开创建随访计划对话框
          alert('创建随访计划功能即将上线');
        }}
      >
        <Plus style={{ width: 24, height: 24 }} />
      </button>
    </div>
  );
}
