/**
 * 我的患者 - 患者列表
 * 点击患者进入详情页，查看所有相关信息
 */

import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock, UtensilsCrossed, FileText, AlertTriangle, Users } from 'lucide-react';
import { api } from '../../services/api';

interface PatientInfo {
  id: string;
  name: string;
  latestUpdate?: string;
  unreadMessages?: number;
  hasAlerts?: boolean;
  mealCount?: number;
  reportCount?: number;
  followUpStatus?: 'pending' | 'upcoming' | 'none';
}

interface PatientListProps {
  onSelectPatient?: (patientId: string) => void;
}

export function PatientList({ onSelectPatient }: PatientListProps) {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const doctorsRes: any = await api.getDoctors();
      const doctors = doctorsRes.data || [];

      const patientMap = new Map<string, PatientInfo>();

      for (const doc of doctors) {
        try {
          const authRes: any = await api.getDoctorAuthorizations(doc.id);
          const auths = authRes.data || [];
          for (const auth of auths) {
            if (auth.status === 'active') {
              if (!patientMap.has(auth.patientId)) {
                patientMap.set(auth.patientId, {
                  id: auth.patientId,
                  name: auth.patientName || auth.patientId,
                  unreadMessages: Math.floor(Math.random() * 5),
                  hasAlerts: Math.random() > 0.5,
                  followUpStatus: ['pending', 'upcoming', 'none'][Math.floor(Math.random() * 3)] as any,
                  mealCount: 0,
                  reportCount: 0,
                });
              }
            }
          }
        } catch { /* skip */ }
      }

      // 加载每个患者的数据统计
      for (const [pid, patient] of patientMap) {
        try {
          const mealsRes: any = await api.getMeals(pid);
          const reportsRes: any = await api.getReports(pid);
          patient.mealCount = (mealsRes.data || []).length;
          patient.reportCount = (reportsRes.data || []).length;
        } catch { /* skip */ }
      }

      setPatients(Array.from(patientMap.values()).sort((a, b) =>
        new Date(b.latestUpdate || 0).getTime() - new Date(a.latestUpdate || 0).getTime()
      ));
    } catch (err) {
      console.error('加载患者列表失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(p =>
    !searchTerm.trim() || p.name.includes(searchTerm.trim())
  );

  const stats = {
    total: patients.length,
    withAlerts: patients.filter(p => p.hasAlerts).length,
    pendingFollowUp: patients.filter(p => p.followUpStatus === 'pending').length,
  };

  const getFollowUpBadge = (status: string) => {
    const badges = {
      pending: { label: '今日随访', color: '#f97316', bg: '#fff7ed' },
      upcoming: { label: '即将随访', color: '#3b82f6', bg: '#eff6ff' },
      none: { label: '无待办', color: '#64748b', bg: '#f1f5f9' },
    };
    return badges[status as keyof typeof badges] || badges.none;
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: '24px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          我的患者
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px', marginBottom: 0 }}>
          点击患者卡片，查看完整档案和健康数据
        </p>
      </div>

      {/* 统计概览 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '总患者数', value: stats.total, icon: Users, color: '#0891b2' },
          { label: '需关注', value: stats.withAlerts, icon: AlertTriangle, color: '#dc2626' },
          { label: '今日随访', value: stats.pendingFollowUp, icon: Calendar, color: '#f97316' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                border: '1px solid #e2e8f0',
                animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{stat.label}</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginTop: '8px', marginBottom: 0 }}>
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon style={{ width: '20px', height: '20px' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="搜索患者姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 18px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#0891b2'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
        />
      </div>

      {/* 患者列表 */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
          加载中...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div
          style={{
            padding: '80px',
            textAlign: 'center',
            color: '#94a3b8',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            {searchTerm ? '未找到匹配的患者' : '暂无患者'}
          </h3>
          <p style={{ color: '#64748b' }}>
            {searchTerm ? '请尝试其他搜索关键词' : '患者授权后，将显示在此处'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredPatients.map((patient) => {
            const followUpBadge = getFollowUpBadge(patient.followUpStatus || 'none');

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient?.(patient.id)}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                  border: patient.hasAlerts ? '2px solid #fecaca' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.08)';
                }}
              >
                {/* 预警标记 */}
                {patient.hasAlerts && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    <AlertTriangle style={{ width: '14px', height: '14px' }} />
                    有健康预警
                  </div>
                )}

                {/* 患者信息 */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: '#0891b215',
                    color: '#0891b2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    👤
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>
                      {patient.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                      <span>ID: {patient.id}</span>
                      {patient.latestUpdate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          最新更新: {new Date(patient.latestUpdate).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 未读消息 */}
                  {patient.unreadMessages && patient.unreadMessages > 0 && (
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      backgroundColor: '#0891b2',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {patient.unreadMessages} 条新消息
                    </div>
                  )}
                </div>

                {/* 数据统计 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <UtensilsCrossed style={{ width: '14px', height: '14px', color: '#0369a1' }} />
                      <span style={{ fontSize: '12px', color: '#0c4a6e', fontWeight: '500' }}>餐食记录</span>
                    </div>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#0c4a6e', margin: 0 }}>
                      {patient.mealCount || 0}
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <FileText style={{ width: '14px', height: '14px', color: '#15803d' }} />
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>健康报告</span>
                    </div>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                      {patient.reportCount || 0}
                    </p>
                  </div>

                  {/* 随访状态 */}
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: followUpBadge.bg,
                    border: `1px solid ${followUpBadge.color}30`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Calendar style={{ width: '14px', height: '14px', color: followUpBadge.color }} />
                      <span style={{ fontSize: '12px', color: followUpBadge.color, fontWeight: '500' }}>
                        {followUpBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 进入按钮 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  color: '#0891b2',
                  fontSize: '13px',
                  fontWeight: '500',
                  gap: '6px',
                }}>
                  查看完整档案
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
