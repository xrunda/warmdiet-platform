/**
 * 授权管理 - 纯 CSS 版本
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function AuthorizationList() {
  const [auths, setAuths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusConfig = (status: string) => {
    const config = {
      pending: { label: '待审批', icon: '⏳', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
      approved: { label: '已授权', icon: '✅', color: '#10b981', bg: '#d1fae5', border: '#34d399' },
      rejected: { label: '已拒绝', icon: '❌', color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
      revoked: { label: '已撤销', icon: '🚫', color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
      expired: { label: '已过期', icon: '⏰', color: '#6b7280', bg: '#f3f4f6', border: '#e2e8f0' },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  useEffect(() => {
    loadAuths();
  }, []);

  async function loadAuths() {
    try {
      const doctorsRes: any = await api.getDoctors();
      const doctors = doctorsRes.data || [];

      const allAuths: any[] = [];
      for (const doc of doctors) {
        try {
          const authRes: any = await api.getDoctorAuthorizations(doc.id);
          const docAuths = authRes.data || [];
          for (const auth of docAuths) {
            let scopeLabels: string[] = [];
            try {
              const types = typeof auth.authorizationType === 'string'
                ? JSON.parse(auth.authorizationType)
                : auth.authorizationType;
              if (Array.isArray(types)) {
                scopeLabels = types.map((t: string) => {
                  if (t === 'meal_records') return '饮食记录';
                  if (t === 'health_reports') return '健康报告';
                  if (t === 'chat_logs') return '对话记录';
                  return t;
                });
              }
            } catch {
              scopeLabels = [String(auth.authorizationType || '未知')];
            }

            const mappedStatus = auth.status === 'active' ? 'approved' : auth.status;
            allAuths.push({
              id: auth.id,
              patient: auth.patientId,
              doctor: doc.name,
              status: mappedStatus,
              scope: scopeLabels,
              date: (auth.authorizedAt || auth.createdAt || '').split('T')[0],
            });
          }
        } catch { /* skip doctor with no authorizations */ }
      }

      setAuths(allAuths);
    } catch (err) {
      console.error('Failed to load authorizations:', err);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: auths.length,
    pending: auths.filter(a => a.status === 'pending').length,
    approved: auths.filter(a => a.status === 'approved').length,
    rejected: auths.filter(a => a.status === 'rejected' || a.status === 'revoked').length,
  };

  const filteredAuths = auths.filter(auth => {
    const matchesStatus = statusFilter === 'all' || auth.status === statusFilter;
    const matchesSearch = searchTerm === '' || auth.patient.toLowerCase().includes(searchTerm.toLowerCase()) || auth.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>授权管理</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px', marginBottom: 0 }}>
          管理患者对医生数据的访问授权
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: '总授权数', value: stats.total, icon: '📋', color: '#64748b', bgLight: '#f1f5f9' },
          { label: '待审批', value: stats.pending, icon: '⏳', color: '#f59e0b', bgLight: '#fef3c7' },
          { label: '已授权', value: stats.approved, icon: '✅', color: '#10b981', bgLight: '#d1fae5' },
          { label: '已拒绝/撤销', value: stats.rejected, icon: '❌', color: '#ef4444', bgLight: '#fee2e2' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flexStart' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, margin: 0 }}>{stat.label}</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e293b', marginTop: '8px', marginBottom: 0 }}>
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
                }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选和搜索 */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <input
            type="text"
            placeholder="搜索患者或医生姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#64748b',
              outline: 'none'
            }}
          >
            <option value="all">全部状态</option>
            <option value="pending">待审批</option>
            <option value="approved">已授权</option>
            <option value="rejected">已拒绝</option>
            <option value="revoked">已撤销</option>
            <option value="expired">已过期</option>
          </select>

          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              style={{
                padding: '12px 16px',
                color: '#64748b',
                background: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 授权列表 */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}
      >
        {loading && (
          <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
        )}

        {!loading && filteredAuths.length === 0 && (
          <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              暂无授权记录
            </h3>
            <p style={{ color: '#64748b' }}>
              患者将通过此页面授权医生访问其健康数据
            </p>
          </div>
        )}

        {!loading && filteredAuths.length > 0 && (
          <div>
            {filteredAuths.map((auth, idx) => {
              const statusConfig = getStatusConfig(auth.status);
              return (
                <div
                  key={auth.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <div style={{ padding: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}
                    >
                      <div>
                        <p
                          style={{
                            color: '#1e293b',
                            fontWeight: 600,
                            fontSize: '16px',
                            margin: 0
                          }}
                        >
                          {auth.patient}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>→</p>
                        <p
                          style={{
                            color: '#1e293b',
                            fontWeight: 600,
                            fontSize: '16px',
                            margin: 0
                          }}
                        >
                          {auth.doctor}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: statusConfig.bg,
                          color: statusConfig.color,
                          fontWeight: 600,
                          border: `1px solid ${statusConfig.border}`
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 8 }}>
                        授权范围：{auth.scope.join('、')}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                        授权日期：{auth.date}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
