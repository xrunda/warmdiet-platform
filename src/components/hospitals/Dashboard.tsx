/**
 * 医院管理后台 - 仪表盘 (纯 CSS 版本)
 */

import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Stats {
  totalDoctors: number;
  totalPatients: number;
  activeAuthorizations: number;
  totalMeals: number;
}

export function HospitalDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDoctors: 0,
    totalPatients: 0,
    activeAuthorizations: 0,
    totalMeals: 0,
  });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      const subResponse: any = await api.getSubscription(user.id);
      if (subResponse.success) {
        setStats({
          totalDoctors: subResponse.data?.currentDoctorCount || 0,
          totalPatients: subResponse.data?.totalPatients || 0,
          activeAuthorizations: subResponse.data?.activeAuthorizations || 0,
          totalMeals: subResponse.data?.totalMeals || 0,
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: '医生数量', value: stats.totalDoctors, icon: '👨‍⚕️', color: '#3b82f6' },
    { title: '患者数量', value: stats.totalPatients, icon: '👥', color: '#10b981' },
    { title: '活跃授权', value: stats.activeAuthorizations, icon: '🔐', color: '#8b5cf6' },
    { title: '餐食记录', value: stats.totalMeals, icon: '🍽️', color: '#f97316' },
  ];

  const quickActions = [
    { title: '添加医生', desc: '邀请新医生加入平台', icon: '➕', color: '#10b981' },
    { title: '查看订阅', desc: '管理套餐和计费', icon: '💳', color: '#8b5cf6' },
    { title: '访问日志', desc: '数据访问统计分析', icon: '📊', color: '#06b6d4' },
  ];

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      basic: '基础版',
      professional: '专业版',
      enterprise: '企业版'
    };
    return names[plan] || names.basic;
  };

  const getPlanPrice = (plan: string) => {
    const prices: Record<string, string> = {
      basic: '¥299',
      professional: '¥899',
      enterprise: '¥1999'
    };
    return prices[plan] || prices.basic;
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderBottom: '1px solid #e2e8f0', padding: '20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>仪表盘</h1>
            <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px', marginBottom: 0 }}>
              欢迎回来，{user?.hospitalName || '测试医院'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: '14px', fontWeight: 500 }}>
              {getPlanName(user?.planType || 'basic')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {statCards.map((stat, idx) => (
            <div
              key={stat.title}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flexStart' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, margin: 0 }}>{stat.title}</p>
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
                    fontSize: '24px'
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快捷操作 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> 快捷操作
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {quickActions.map(action => (
              <a
                key={action.title}
                href={`#${action.title}`}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'block',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    marginBottom: '12px'
                  }}
                >
                  {action.icon}
                </div>
                <h3 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px', marginTop: 0 }}>{action.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{action.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* 套餐信息 */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '16px', padding: '24px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>当前套餐</h2>
            <span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '20px', fontSize: '14px' }}>
              {getPlanName(user?.planType || 'basic')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>套餐价格</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px', marginBottom: 0 }}>
                {getPlanPrice(user?.planType || 'basic')}
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#94a3b8' }}>/月</span>
              </p>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: 8, margin: 0 }}>医生配额</p>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: 8 }}>
                  <span style={{ color: '#cbd5e1' }}>已使用</span>
                  <span style={{ fontWeight: 500 }}>{stats.totalDoctors} / {user?.maxDoctors || 5}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: 0 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min((stats.totalDoctors / (user?.maxDoctors || 5)) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            升级套餐
          </button>
        </div>

        {/* 提示 */}
        <div style={{ marginTop: '32px', padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'flexStart', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            💡
          </div>
          <div>
            <p style={{ color: '#1e40af', fontWeight: 500, fontSize: '14px', margin: 0 }}>使用提示</p>
            <p style={{ color: '#3b82f6', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
              您可以使用左侧导航菜单管理医生、查看授权记录、餐食记录和健康报告。
              如需帮助请联系客服或查看帮助中心文档。
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
