/**
 * 导航组件 - 简化版
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
}

interface NavigationProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ items, activeTab, onTabChange }: NavigationProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, { label: string; color: string }> = {
      basic: { label: '基础版', color: '#f3f4f6' },
      professional: { label: '专业版', color: '#ede9fe' },
      enterprise: { label: '企业版', color: '#fef3c7' },
    };
    return plans[plan] || plans.basic;
  };

  const planInfo = getPlanBadge(user?.planType || 'basic');

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 侧边栏 */}
      <aside
        style={{
          width: '288px',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Logo 区域 */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
            }}>
              <span style={{ fontSize: '18px' }}>🏥</span>
            </div>
            <div>
              <h1 style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>三餐管家</h1>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>医院管理后台</p>
            </div>
          </div>
        </div>

        {/* 医院信息 */}
        <div style={{ padding: '16px 16px', marginTop: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#334155',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#cbd5e1' }}>🏩</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.hospitalName || '测试医院'}
              </p>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                backgroundColor: planInfo.color,
                color: '#374151'
              }}>
                {planInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  border: 'none',
                  background: activeTab === item.id
                    ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                    : 'transparent',
                  color: activeTab === item.id ? 'white' : '#cbd5e1',
                  cursor: 'pointer',
                  boxShadow: activeTab === item.id ? '0 4px 6px rgba(16, 185, 129, 0.25)' : 'none'
                }}
                className="hover:!bg-slate-800 hover:!text-white"
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.label}</span>
                {activeTab === item.id && (
                  <span style={{ marginLeft: 'auto', width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* 底部区域 */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <button
            onClick={() => { logout(); setSidebarOpen(false); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(30, 41, 59, 0.5)',
              border: 'none',
              borderRadius: '12px',
              color: '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
          >
            <span>🚪</span>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>退出登录</span>
          </button>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '12px' }}>
            © 2024 三餐管家 WarmDiet
          </p>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, overflow: 'auto', height: '100%' }}>
        {(() => {
          const ActiveComponent = items.find(item => item.id === activeTab)?.component;
          return ActiveComponent ? <ActiveComponent /> : null;
        })()}
      </main>
    </div>
  );
}
