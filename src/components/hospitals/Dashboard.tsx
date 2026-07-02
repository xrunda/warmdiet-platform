/**
 * 医院管理后台 - 仪表盘
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  Clock3,
  CreditCard,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';

interface Stats {
  totalDoctors: number;
  totalPatients: number;
  activeAuthorizations: number;
  totalMeals: number;
}

interface HospitalDashboardProps {
  onTabChange?: (tab: string) => void;
}

export function HospitalDashboard({ onTabChange }: HospitalDashboardProps) {
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
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const [subResponse, statsResponse]: any[] = await Promise.allSettled([
        api.getSubscription(user.id),
        api.getHospitalStats(user.id),
      ]);

      const subData = subResponse.status === 'fulfilled' && subResponse.value?.success
        ? subResponse.value.data : {};
      const hospitalStats = statsResponse.status === 'fulfilled' && statsResponse.value?.success
        ? statsResponse.value.data : {};

      setStats({
        totalDoctors: hospitalStats.totalDoctors ?? subData.currentDoctorCount ?? 0,
        totalPatients: hospitalStats.totalPatients ?? subData.totalPatients ?? 0,
        activeAuthorizations: hospitalStats.activeAuthorizations ?? subData.activeAuthorizations ?? 0,
        totalMeals: hospitalStats.totalMeals ?? subData.totalMeals ?? 0,
      });
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxDoctors = user?.maxDoctors || 5;
  const doctorUsage = Math.min((stats.totalDoctors / maxDoctors) * 100 || 0, 100);
  const authorizationRate = Math.min((stats.activeAuthorizations / Math.max(stats.totalPatients || 1, 1)) * 100, 100);
  const mealCoverage = Math.min((stats.totalMeals / Math.max(stats.totalPatients || 1, 1)) * 100, 100);
  const avgPatientsPerDoctor = stats.totalDoctors > 0 ? (stats.totalPatients / stats.totalDoctors).toFixed(1) : '0.0';

  const statCards = [
    {
      title: '医生数量',
      value: stats.totalDoctors,
      description: '当前已接入平台的医生账号',
      accent: 'from-cyan-500/20 to-cyan-500/5',
      iconWrap: 'bg-cyan-500/10 text-cyan-700',
      Icon: Stethoscope,
    },
    {
      title: '患者数量',
      value: stats.totalPatients,
      description: '纳入医院营养管理的患者总数',
      accent: 'from-emerald-500/20 to-emerald-500/5',
      iconWrap: 'bg-emerald-500/10 text-emerald-700',
      Icon: Users,
    },
    {
      title: '活跃授权',
      value: stats.activeAuthorizations,
      description: '当前有效的患者数据授权记录',
      accent: 'from-violet-500/20 to-violet-500/5',
      iconWrap: 'bg-violet-500/10 text-violet-700',
      Icon: ShieldCheck,
    },
    {
      title: '餐食记录',
      value: stats.totalMeals,
      description: '已录入并留痕的餐食记录总量',
      accent: 'from-amber-500/20 to-amber-500/5',
      iconWrap: 'bg-amber-500/10 text-amber-700',
      Icon: UtensilsCrossed,
    },
  ];

  const quickActions = [
    {
      title: '添加医生',
      desc: '快速邀请新医生加入医院工作台',
      tabId: 'doctors',
      Icon: BriefcaseMedical,
      accent: 'bg-cyan-500/10 text-cyan-700',
    },
    {
      title: '餐食记录',
      desc: '查看患者的饮食记录与营养数据',
      tabId: 'meals',
      Icon: UtensilsCrossed,
      accent: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      title: '授权巡检',
      desc: '核对患者授权状态与访问风险',
      tabId: 'authorizations',
      Icon: BadgeCheck,
      accent: 'bg-violet-500/10 text-violet-700',
    },
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
    <div className="min-h-full">
      <div className="border-b border-slate-200/70 bg-white/75 px-8 py-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.22em] text-cyan-700 uppercase">
              <HeartPulse className="h-4 w-4" />
              Clinical Dashboard
            </div>
            <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-slate-900">仪表盘</h1>
            <p className="mt-2 text-sm text-slate-500">
              欢迎回来，{user?.hospitalName || '测试医院'}。以下是当前医院运营与服务状态概览。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              系统状态正常
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
              <Building2 className="h-4 w-4 text-cyan-700" />
              {getPlanName(user?.planType || 'basic')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,#f8fcff_0%,#eef8f7_55%,#f7fafc_100%)] p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-32 w-32 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-cyan-800">
                <Sparkles className="h-3.5 w-3.5" />
                医疗运营总览
              </div>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-slate-900">
                面向医生和医院管理者的日常工作台，优先呈现容量、授权与服务连续性。
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                信息层级经过简化处理，先看整体负载和关键指标，再进入具体业务模块，减少临床场景中的视觉噪音。
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">
                    <Clock3 className="h-4 w-4 text-cyan-700" />
                    今日重点
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">医生容量与授权巡检</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">建议优先核对配额、授权有效性与患者服务衔接。</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    服务节奏
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">{loading ? '加载中...' : `${avgPatientsPerDoctor} 位患者 / 医生`}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">帮助快速判断当前团队服务负载是否均衡。</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">
                    <ShieldCheck className="h-4 w-4 text-violet-700" />
                    数据合规
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">{loading ? '加载中...' : `${authorizationRate.toFixed(0)}% 授权覆盖率`}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">用于快速识别患者服务流程中的授权缺口。</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_28px_50px_rgba(15,23,42,0.16)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">套餐与容量</p>
                  <h3 className="mt-2 text-xl font-semibold">{getPlanName(user?.planType || 'basic')}</h3>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-200">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">套餐价格</p>
                <p className="mt-2 text-3xl font-semibold">
                  {getPlanPrice(user?.planType || 'basic')}
                  <span className="ml-1 text-sm font-normal text-slate-400">/ 月</span>
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">医生配额使用率</span>
                  <span className="font-medium text-white">
                    {loading ? '...' : `${stats.totalDoctors} / ${maxDoctors}`}
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 transition-all duration-700"
                    style={{ width: `${doctorUsage}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  {doctorUsage >= 80
                    ? '当前容量接近上限，建议预留新医生接入空间。'
                    : '当前配额仍有余量，可继续扩展医生团队。'}
                </p>
              </div>

              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-cyan-50">
                升级套餐
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.Icon;

            return (
              <article
                key={stat.title}
                className="animate-dashboard-fade rounded-[26px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <div className={`h-1 w-full rounded-full bg-gradient-to-r ${stat.accent}`} />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="mt-3 text-[38px] font-semibold tracking-tight text-slate-900">
                      {loading ? '...' : stat.value}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{stat.description}</p>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.iconWrap}`}>
                    <Icon className="h-6 w-6" strokeWidth={2.1} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-slate-400 uppercase">常用入口</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">快捷操作</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  为高频工作流程保留更短路径
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {quickActions.map(action => {
                  const Icon = action.Icon;

                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() => onTabChange?.(action.tabId)}
                      className="group rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white hover:shadow-[0_18px_36px_rgba(8,145,178,0.08)]"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.accent}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.1} />
                      </div>
                      <h4 className="mt-4 text-base font-semibold text-slate-900">{action.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{action.desc}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-700">
                        立即进入
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-slate-400 uppercase">运营洞察</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">今日关注重点</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-900">授权覆盖</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {loading ? '...' : `${authorizationRate.toFixed(0)}%`}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    建议对未授权患者尽快补齐知情同意，避免服务中断。
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-900">餐食覆盖</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {loading ? '...' : `${mealCoverage.toFixed(0)}%`}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    用于判断患者营养干预记录是否及时同步和持续更新。
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-900">团队负载</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {loading ? '...' : avgPatientsPerDoctor}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    每位医生对应患者数量，可辅助判断人员分配是否平衡。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                  <BriefcaseMedical className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-slate-400 uppercase">值班提醒</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">工作建议</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  `当前已接入 ${stats.totalDoctors} 位医生，可继续扩容至 ${maxDoctors} 位。`,
                  `患者授权中有 ${stats.activeAuthorizations} 条处于活跃状态，建议持续关注授权到期。`,
                  `餐食记录共 ${stats.totalMeals} 条，可用于复核营养干预执行连续性。`,
                ].map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
                    <p className="text-sm leading-7 text-slate-600">{loading ? '加载中...' : item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-100 bg-[linear-gradient(135deg,#eff8ff_0%,#f4fffb_100%)] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-cyan-700 uppercase">使用提示</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">更符合医生使用习惯的信息顺序</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                首页优先显示医院状态、负载、授权与容量信息，减少冗余装饰；需要执行具体操作时，再从左侧进入医生、授权、餐食与报告模块。
              </p>
            </div>
          </div>
        </section>
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
