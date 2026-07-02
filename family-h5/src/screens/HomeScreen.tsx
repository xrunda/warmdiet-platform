import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  BellRing,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Mic,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../lib/utils';
import { BottomSheet, CenterDialog, LoadingSpinner } from '../components/ui';
import { WeeklyViewSheet, VitalSignsSheet } from '../components/sheets';
import {
  MEAL_SCHEDULES,
  formatTrendDay,
  formatDateLabel,
  formatChatTimestamp,
  formatMeasuredTime,
  formatMealRecordTime,
  parseMealTimeStamp,
  getVitalTone,
  mapApiMealToMeal,
} from '../utils';
import type { Meal, AlertItem, VitalSummary, VitalSummaryItem } from '../types/app';
import { ChatMessage } from '../types';
import {
  fetchDashboard,
  fetchTimeline,
} from '../api';

export const HomeScreen = ({
  onTabChange,
  elderMode,
  onOpenElderMode,
  onOpenRecordSheet,
  refreshSignal = 0,
}: {
  onTabChange: (tab: string) => void;
  elderMode: boolean;
  onOpenElderMode: () => void;
  onOpenRecordSheet: () => void;
  refreshSignal?: number;
}) => {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [trendData, setTrendData] = useState<{ day: string; score: number }[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [stats, setStats] = useState({ avgScore: 0, maxScore: 0, minScore: 0 });
  const [patientName, setPatientName] = useState('');
  const [vitalsSummary, setVitalsSummary] = useState<VitalSummary | null>(null);
  const [refreshingMeals, setRefreshingMeals] = useState(false);
  const [refreshingVitals, setRefreshingVitals] = useState(false);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [showWeekly, setShowWeekly] = useState(false);
  const [showVitalsSheet, setShowVitalsSheet] = useState(false);

  const latestChats = useMemo(() => {
    return chats;
  }, [chats]);

  const loadDashboard = useCallback(async () => {
    const data: any = await fetchDashboard();
    setPatientName(data.patient?.name || '');
    setHealthScore(data.healthScore || 0);
    setMeals((data.meals || []).map(mapApiMealToMeal));
    setAlerts(data.alerts || []);
    const dashboardConversations = (data.conversations || []).map((item: any) => ({
      ...item,
      timestamp: item.timestamp || formatChatTimestamp(item.logDate, item.rawTimestamp || item.createdAt || ''),
    }));
    setChats(dashboardConversations);
    setTrendData(
      (data.trendData || []).map((d: any) => ({ day: formatTrendDay(d.date), score: d.score }))
    );
    setStats(data.stats || { avgScore: 0, maxScore: 0, minScore: 0 });
    setVitalsSummary(data.vitals || null);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  useEffect(() => {
    if (refreshSignal > 0) {
      loadDashboard().catch((error) => console.error('刷新饮食数据失败', error));
    }
  }, [loadDashboard, refreshSignal]);

  useEffect(() => {
    fetchTimeline(undefined, 20)
      .then((items: any[]) => {
        const conversationItems = (items || [])
          .filter((it: any) => it.type === 'conversation' && it.data?.content)
          .map((it: any) => ({
            id: it.id,
            role: it.data?.role,
            content: it.data?.content,
            timestamp: formatChatTimestamp(it.logDate, it.timestamp),
            logDate: it.logDate,
            extra: it.data?.extra || undefined,
          }));

        if (conversationItems.length > 0) {
          setChats(conversationItems);
        }
      })
      .catch(() => {});
  }, []);

  const handleMealsRefresh = useCallback(async () => {
    if (refreshingMeals) return;
    setRefreshingMeals(true);
    try {
      await loadDashboard();
    } catch (error) {
      console.error('刷新饮食数据失败', error);
    } finally {
      setRefreshingMeals(false);
    }
  }, [loadDashboard, refreshingMeals]);

  const handleVitalsRefresh = useCallback(async () => {
    if (refreshingVitals) return;
    setRefreshingVitals(true);
    try {
      await loadDashboard();
    } catch (error) {
      console.error('刷新附属健康指标失败', error);
    } finally {
      setRefreshingVitals(false);
    }
  }, [loadDashboard, refreshingVitals]);

  const groupedMeals = useMemo(
    () =>
      MEAL_SCHEDULES.map((schedule) => ({
        ...schedule,
        entries: meals
          .filter((meal) => meal.type === schedule.key)
          .sort((a, b) => parseMealTimeStamp(a.time).getTime() - parseMealTimeStamp(b.time).getTime()),
      })),
    [meals]
  );

  const getMealLabel = (type: string) =>
    type === 'breakfast' ? '早餐' : type === 'lunch' ? '午餐' : '晚餐';
  const primaryAlert = alerts[0];
  const remainingAlerts = alerts.slice(1, 3);
  const riskBadgeText =
    alerts.length === 0
      ? '今天状态平稳'
      : primaryAlert?.level === 'high'
      ? '今天先看这个'
      : '今日值得留意';
  const vitalCards = [vitalsSummary?.latestBloodPressure, vitalsSummary?.latestBloodGlucose].filter(Boolean) as VitalSummaryItem[];

  if (loading) {
    return (
      <div className={cn('flex-1 overflow-y-auto bg-brand-bg hide-scrollbar', elderMode ? 'pb-36' : 'pb-24')}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto bg-brand-bg hide-scrollbar', elderMode ? 'pb-36' : 'pb-24')}>
      {/* Header */}
      <header className="relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 px-5 pt-safe pb-7 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="absolute top-4 right-4 w-48 h-48" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden">
              <img src="https://picsum.photos/seed/elderly/100/100" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-white/70 text-xs">早上好</p>
              <p className="text-base font-bold text-white">{patientName || '加载中'}</p>
            </div>
          </div>
          <button
            onClick={onOpenElderMode}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm border transition-all',
              elderMode
                ? 'bg-emerald-400/25 text-emerald-100 border-emerald-300/40'
                : 'bg-white/15 text-white/85 border-white/25'
            )}
          >
            {elderMode ? '老人模式' : '标准模式'}
          </button>
        </div>

        <div className="relative z-10 flex items-end justify-between mt-3 gap-3">
          <div>
            <p className="text-white/60 text-xs mb-1">今日健康指数</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white tracking-tight">{healthScore}</span>
              <span className="text-lg text-white/70">分</span>
            </div>
            <p className="text-white/50 text-xs mt-1">较昨日 +3分 ↑</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenRecordSheet}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1.5 text-[11px] font-bold text-white border border-white/25 backdrop-blur-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              查看记录
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 -mt-3">
        {/* Daily Risk Hook */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#f1d9a8] bg-[linear-gradient(135deg,#fff7e6_0%,#fff2d9_42%,#fde7c5_100%)] px-5 py-5 shadow-[0_18px_40px_rgba(181,114,24,0.14)]">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#f6c25b]/20 blur-2xl" />
          <div className="absolute right-5 top-5 h-16 w-16 rounded-full border border-[#efc777] bg-white/35" />
          <div className="absolute right-10 top-10 h-6 w-6 rounded-full bg-[#f6c25b]/70" />

          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#f1d9a8] bg-white/70 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#a86110]">
                  <BellRing className="h-3.5 w-3.5" />
                  {riskBadgeText}
                </div>
                <h3 className="text-[1.55rem] font-black leading-tight text-[#7a3f00]">
                  {alerts.length > 0 ? '今天这条提醒，建议先看' : '今天适合继续保持好习惯'}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#9a6a2a]">
                  {alerts.length > 0
                    ? '每天打开 App，先花 10 秒看这张卡，就知道今天饮食最该注意什么。'
                    : '今天暂无高风险预警，可以继续按现在的节奏吃饭、记录、查看建议。'}
                </p>
              </div>
              <div className="min-w-[82px] rounded-[22px] border border-white/70 bg-white/65 px-3 py-3 text-center shadow-[0_8px_24px_rgba(181,114,24,0.08)]">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#b57a18]">今日指数</p>
                <p className="mt-1 text-3xl font-black text-[#7a3f00]">{healthScore}</p>
              </div>
            </div>

            {primaryAlert ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-[#f0c26f] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,249,236,0.95)_100%)] p-4 shadow-[0_12px_30px_rgba(181,114,24,0.12)]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                      primaryAlert.level === 'high'
                        ? 'bg-[#fff0eb] text-[#c2512f]'
                        : primaryAlert.level === 'medium'
                        ? 'bg-[#fff6dc] text-[#b57700]'
                        : 'bg-[#eef7ff] text-[#1e6fb8]'
                    )}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {primaryAlert.title}
                  </div>
                  <span className="text-xs font-semibold text-[#b57a18]">
                    今日共 {alerts.length} 条提醒
                  </span>
                </div>

                <p className="text-[1.38rem] font-black leading-snug text-[#8f4b06]">
                  {primaryAlert.content}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#9b6a2e]">
                  {primaryAlert.suggestion}
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <div className="grid grid-cols-1 gap-2 w-full">
                    <button
                      onClick={() => setSelectedAlert(primaryAlert)}
                      className="w-full rounded-2xl bg-[#8f4b06] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(122,63,0,0.22)] transition active:scale-[0.98]"
                    >
                      立即查看原因
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const warningMeal = meals.find((meal) => meal.isWarning) || meals[0];
                          if (warningMeal) setSelectedMeal(warningMeal);
                        }}
                        className="rounded-2xl border border-[#efc777] bg-white/80 px-4 py-3 text-sm font-bold text-[#8f4b06] transition hover:bg-white"
                      >
                        去看今日饮食
                      </button>
                      <button
                        onClick={() => onTabChange('report')}
                        className="rounded-2xl border border-[#efc777] bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#8f4b06] transition hover:bg-white"
                      >
                        查看报告
                      </button>
                    </div>
                  </div>
                </div>

                {remainingAlerts.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {remainingAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => setSelectedAlert(alert)}
                        className="flex items-center justify-between rounded-2xl border border-[#f7dfb4] bg-white/60 px-3 py-3 text-left"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#8f4b06]">{alert.content}</p>
                          <p className="mt-0.5 text-xs text-[#b07a38]">{alert.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#c89a4d]" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <div className="rounded-[24px] border border-[#f0dfb8] bg-white/70 p-4">
                <p className="text-base font-bold text-[#8f4b06]">今天没有新的饮食风险预警。</p>
                <p className="mt-1 text-sm text-[#9b6a2e]">
                  可以去看看今日饮食记录，或者直接查看本周趋势，保持当前节奏。
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowWeekly(true)}
                    className="rounded-2xl bg-[#8f4b06] px-4 py-3 text-sm font-bold text-white"
                  >
                    看本周趋势
                  </button>
                  <button
                    onClick={() => onTabChange('report')}
                    className="rounded-2xl border border-[#efc777] bg-white/75 px-4 py-3 text-sm font-bold text-[#8f4b06]"
                  >
                    查看报告
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-[#d7e7ff] bg-[linear-gradient(135deg,#ffffff_0%,#f6faff_55%,#eef5ff_100%)] p-5 shadow-[0_14px_32px_rgba(67,97,238,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#4f6bb8]">
              <Heart className="h-3.5 w-3.5" />
              附属健康指标
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleVitalsRefresh}
                disabled={refreshingVitals}
                whileTap={{ scale: 0.92 }}
                animate={{ rotate: refreshingVitals ? 360 : 0 }}
                transition={{
                  repeat: refreshingVitals ? Infinity : 0,
                  duration: refreshingVitals ? 0.9 : 0,
                  ease: 'linear',
                }}
                className="rounded-full p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition"
                aria-label="刷新附属健康指标"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
              <button
                onClick={() => setShowVitalsSheet(true)}
                className="shrink-0 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-sm font-bold text-indigo-700 shadow-[0_10px_24px_rgba(79,70,229,0.08)]"
              >
                查看详情
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {vitalCards.length > 0 ? vitalCards.map((item) => {
              const tone = getVitalTone(item.status);
              const isPressure = item.metricType === 'blood_pressure';
              return (
                <button
                  key={item.metricType}
                  onClick={() => setShowVitalsSheet(true)}
                  className={cn('rounded-[22px] border p-4 text-left transition active:scale-[0.99]', tone.card)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', isPressure ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-500')}>
                        {isPressure ? <Heart className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{isPressure ? '最近一次血压' : `最近一次血糖${item.glucoseContextLabel ? ` · ${item.glucoseContextLabel}` : ''}`}</p>
                        <p className="mt-1 text-[1.05rem] font-black text-slate-900">
                          {item.value}
                          <span className="ml-1 text-xs font-semibold text-slate-400">{item.unit}</span>
                        </p>
                        {!isPressure && item.hasFollowUpInfo && item.followUpInfo ? (
                          <p className="mt-1.5 inline-flex max-w-[220px] rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                            补录：{item.followUpInfo.replace(/^补录[:：]\s*/, '')}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-400">{formatMeasuredTime(item.measuredAt)} · 来自小爱语音</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', tone.pill)}>{tone.badge}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                </button>
              );
            }) : (
              <button
                onClick={() => setShowVitalsSheet(true)}
                className="rounded-[22px] border border-dashed border-[#d7e7ff] bg-white/70 px-4 py-5 text-left"
              >
                <p className="text-sm font-bold text-slate-800">暂时还没有血压血糖记录</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">等老人通过小爱说出“血压 128/76”或“空腹血糖 6.2”后，这里会自动显示。</p>
              </button>
            )}
          </div>
        </section>

        {/* Today's Diet */}
        <section className="bg-white rounded-[22px] p-5">
          <div className={cn('mb-4', elderMode ? 'space-y-3' : 'flex justify-between items-center')}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">今日饮食</h3>
              <motion.button
                type="button"
                onClick={handleMealsRefresh}
                disabled={refreshingMeals}
                whileTap={{ scale: 0.92 }}
                animate={{ rotate: refreshingMeals ? 360 : 0 }}
                transition={{
                  repeat: refreshingMeals ? Infinity : 0,
                  duration: refreshingMeals ? 0.9 : 0,
                  ease: 'linear',
                }}
                className="rounded-full p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition"
                aria-label="刷新今日饮食"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
            </div>
            <div className={cn('gap-2', elderMode ? 'grid grid-cols-2' : 'flex')}>
              <button onClick={() => setShowWeekly(true)} className="text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                查看本周 ▶
              </button>
              <button onClick={() => setShowWeekly(true)} className="text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                查看历史 ▶
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {groupedMeals.map(({ key, label, emoji, entries }) => (
              <div key={key} className="rounded-[20px] border border-gray-100/80 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">
                        {entries.length > 0 ? `${entries.length} 条记录` : '暂无记录'}
                      </p>
                    </div>
                  </div>
                  {entries.length > 0 && (
                    <span className="text-xs text-emerald-500 font-bold">{entries[entries.length - 1].calories} kcal</span>
                  )}
                </div>
                {entries.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-400">暂无该餐记录</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {entries.map((meal) => (
                      <button
                        key={`${meal.id}-${meal.time}`}
                        onClick={() => setSelectedMeal(meal)}
                        className="w-full rounded-2xl border border-gray-100 bg-white p-3 text-left hover:border-indigo-100 transition"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>记录时间：{formatMealRecordTime(meal.time)}</span>
                          <span className={cn('font-bold', meal.isWarning ? 'text-red-500' : 'text-indigo-600')}>
                            {meal.calories} kcal
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {meal.items.map((item, index) => (
                            <span key={index} className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                              <span>{item}</span>
                              {meal.isWarning ? (
                                <span className="text-xs text-red-500 font-bold">⚠</span>
                              ) : (
                                <Check className="w-3 h-3 text-emerald-500" />
                              )}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Trend */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">7日健康趋势</h3>
            </div>
            <button onClick={() => onTabChange('report')} className="text-sm text-indigo-600 font-medium">
              查看详细报告 ▶
            </button>
          </div>
          {trendData.length > 0 ? (
            <>
              <div className="h-40 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3.5, fill: '#4f46e5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                {[
                  { label: '平均分', value: String(stats.avgScore?.toFixed?.(1) ?? stats.avgScore), color: 'text-gray-900' },
                  { label: '最高分', value: String(stats.maxScore), color: 'text-emerald-600' },
                  { label: '最低分', value: String(stats.minScore), color: 'text-red-500' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 p-2.5 rounded-xl">
                    <div className="text-xs text-gray-400">{s.label}</div>
                    <div className={cn('text-sm font-bold mt-0.5', s.color)}>{s.value}分</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">暂无趋势数据</p>
          )}
        </section>

      </div>

      {/* Meal Detail Bottom Sheet */}
      <BottomSheet open={!!selectedMeal} onClose={() => setSelectedMeal(null)} title={selectedMeal ? `${getMealLabel(selectedMeal.type)} 详情` : ''}>
        {selectedMeal && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>记录时间：{selectedMeal.time}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> 语音录入</span>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">食物明细</p>
              <div className="flex flex-wrap gap-2">
                {selectedMeal.items.map((item, i) => (
                  <span key={i} className="bg-gray-50 px-3 py-1.5 rounded-xl text-sm text-gray-700 border border-gray-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '热量', value: `${selectedMeal.calories} kcal`, bg: 'bg-indigo-50', text: 'text-indigo-700' },
                { label: '蛋白质', value: `${selectedMeal.protein} g`, bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: '脂肪', value: `${selectedMeal.fat} g`, bg: 'bg-amber-50', text: 'text-amber-700' },
                { label: '碳水', value: `${selectedMeal.carbs} g`, bg: 'bg-sky-50', text: 'text-sky-700' },
              ].map((n) => (
                <div key={n.label} className={cn('rounded-2xl p-4', n.bg)}>
                  <p className={cn('text-xs font-medium', n.text.replace('700', '500'))}>{n.label}</p>
                  <p className={cn('text-lg font-bold mt-1', n.text)}>{n.value}</p>
                </div>
              ))}
            </div>

            <div className={cn('rounded-2xl p-4 border', selectedMeal.isWarning ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100')}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={cn('w-4 h-4', selectedMeal.isWarning ? 'text-red-500' : 'text-indigo-600')} />
                <p className="text-sm font-bold text-gray-900">AI 分析</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedMeal.analysis}</p>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Alert Detail */}
      <CenterDialog open={!!selectedAlert} onClose={() => setSelectedAlert(null)}>
        {selectedAlert && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                'w-5 h-5',
                selectedAlert.level === 'high' ? 'text-red-500' : selectedAlert.level === 'medium' ? 'text-amber-500' : 'text-blue-500'
              )} />
              <h4 className="text-base font-bold text-gray-900">{selectedAlert.title}</h4>
            </div>
            <div className={cn(
              'rounded-2xl p-4 border',
              selectedAlert.level === 'high' ? 'bg-red-50 border-red-100' : selectedAlert.level === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
            )}>
              <p className="text-sm font-medium text-gray-800">{selectedAlert.content}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selectedAlert.suggestion}</p>
            </div>
            <button onClick={() => setSelectedAlert(null)} className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold active:scale-[0.98]">
              我知道了
            </button>
          </div>
        )}
      </CenterDialog>

      {/* Weekly View */}
      <WeeklyViewSheet open={showWeekly} onClose={() => setShowWeekly(false)} trendData={trendData} />
      <VitalSignsSheet open={showVitalsSheet} onClose={() => setShowVitalsSheet(false)} summary={vitalsSummary} />
    </div>
  );
};

// --- Log Screen ---
