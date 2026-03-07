/**
 * 导航组件
 */

import React from 'react';
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronRight,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
}

interface NavigationProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children?: React.ReactNode;
}

export function Navigation({ items, activeTab, onTabChange, children }: NavigationProps) {
  const { user, logout } = useAuth();

  const getPlanBadge = (plan: string): { label: string; className: string } => {
    const plans: Record<string, { label: string; className: string }> = {
      basic: {
        label: '基础版',
        className: 'border border-slate-200/80 bg-slate-50 text-slate-700',
      },
      professional: {
        label: '专业版',
        className: 'border border-cyan-200/80 bg-cyan-50 text-cyan-800',
      },
      enterprise: {
        label: '企业版',
        className: 'border border-emerald-200/80 bg-emerald-50 text-emerald-800',
      },
    };
    return plans[plan] || plans.basic;
  };

  const planInfo = getPlanBadge(user?.planType || 'basic');
  const today = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());
  const ActiveComponent = items.find(item => item.id === activeTab)?.component;

  return (
    <div className="grid min-h-screen grid-cols-[296px_minmax(0,1fr)] bg-[#edf3f6] text-slate-900">
      <aside className="relative overflow-hidden border-r border-slate-200/70 bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.24),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-300/25 to-transparent" />

        <div className="relative flex h-full flex-col px-5 py-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_48px_rgba(2,6,23,0.32)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 shadow-[0_12px_30px_rgba(45,212,191,0.35)]">
                <Building2 className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-[0.12em] text-white">三餐管家</p>
                <p className="mt-1 text-xs tracking-[0.24em] text-slate-400 uppercase">Hospital Console</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/55 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">
                  {user?.hospitalName || '测试医院'}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold leading-5 ${planInfo.className}`}>
                  {planInfo.label}
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold leading-5 text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  运行正常
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>{today}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 px-2">
            <p className="mb-3 text-[11px] font-medium tracking-[0.28em] text-slate-500 uppercase">
              功能导航
            </p>
            <nav className="space-y-2">
              {items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-cyan-300/30 bg-gradient-to-r from-cyan-400/20 to-emerald-300/10 text-white shadow-[0_16px_32px_rgba(8,145,178,0.22)]'
                        : 'border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                        isActive
                          ? 'border-white/15 bg-white/10 text-cyan-100'
                          : 'border-white/10 bg-white/5 text-slate-400 group-hover:text-cyan-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.1} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className={`mt-0.5 text-xs ${isActive ? 'text-cyan-100/80' : 'text-slate-500 group-hover:text-slate-400'}`}>
                        {item.id === 'dashboard' ? '查看关键运营状态' : '进入模块管理'}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'translate-x-0 text-cyan-100' : '-translate-x-1 text-slate-600 group-hover:translate-x-0 group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto space-y-4 px-2 pt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                  <Activity className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">值班建议</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    建议优先关注医生配额、患者授权与餐食记录同步情况。
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-rose-300/20 hover:bg-rose-400/10 hover:text-white"
            >
              <LogOut className="h-[18px] w-[18px]" />
              退出登录
            </button>

            <p className="pb-1 text-center text-xs text-slate-500">
              WarmDiet Clinical Workspace
            </p>
          </div>
        </div>
      </aside>

      <main className="relative min-w-0 overflow-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.10),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fb_0%,_#eef4f8_100%)]" />
        <div className="relative min-h-screen">
          {children ?? (ActiveComponent ? <ActiveComponent onTabChange={onTabChange} /> : null)}
        </div>
      </main>
    </div>
  );
}
