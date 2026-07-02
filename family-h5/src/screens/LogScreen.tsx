import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Droplets,
  Heart,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/ui';
import {
  formatDateLabel,
  formatChatTimestamp,
  translateFoodName,
} from '../utils';
import { ChatMessage } from '../types';
import { fetchTimeline } from '../api';

function normalizeDateKey(input?: string) {
  if (!input || typeof input !== 'string') return '';
  const raw = input.trim();
  if (!raw) return '';
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
  const match = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${match[1]}-${month}-${day}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const d = `${parsed.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const LogScreen = () => {
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);
  const [dateIndex, setDateIndex] = useState(0);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'byDate'>('byDate');

  useEffect(() => {
    // 先加载全部时间线获取所有可用日期
    fetchTimeline(undefined, 1000)
      .then((items: any[]) => {
        const allDates = Array.from(new Set((items || []).map((it: any) => normalizeDateKey(it.logDate)).filter(Boolean))).sort();
        setDates(allDates);
        setDateIndex(Math.max(0, allDates.length - 1));
        setTimelineItems(items || []);
        setChats(
          (items || [])
            .filter((it: any) => it.type === 'conversation')
            .map((it: any) => ({
              id: it.id,
              role: it.data?.role,
              content: it.data?.content,
              timestamp: formatChatTimestamp(normalizeDateKey(it.logDate), it.timestamp),
              logDate: normalizeDateKey(it.logDate),
              extra: it.data?.extra || undefined,
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [timelineItems, setTimelineItems] = useState<any[]>([]);

  useEffect(() => {
    if (dates.length === 0) return;
    setChatsLoading(true);
    const dateParam = viewMode === 'byDate' ? dates[dateIndex] : undefined;
    const limitParam = viewMode === 'all' ? 1000 : undefined;
    fetchTimeline(dateParam, limitParam)
      .then((items: any[]) => {
        setTimelineItems(items || []);
        // 兼容：把 conversation 类型的也放到 chats 里
        setChats(
          (items || [])
            .filter((it: any) => it.type === 'conversation')
            .map((it: any) => ({
              id: it.id,
              role: it.data?.role,
              content: it.data?.content,
              timestamp: viewMode === 'all'
                ? formatChatTimestamp(normalizeDateKey(it.logDate), it.timestamp)
                : (it.timestamp || '').slice(0, 5),
              logDate: normalizeDateKey(it.logDate),
              extra: it.data?.extra || undefined,
            }))
        );
      })
      .catch(() => { setTimelineItems([]); setChats([]); })
      .finally(() => setChatsLoading(false));
  }, [dates, dateIndex, viewMode]);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = dates[dateIndex] === today;
  const currentDateLabel = dates[dateIndex] ? formatDateLabel(dates[dateIndex]) : '';
  const currentYear = dates[dateIndex] ? dates[dateIndex].slice(0, 4) : '';

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-brand-bg overflow-hidden">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-bg overflow-hidden">
      <header className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-safe pb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="absolute top-0 right-0 w-40 h-40" viewBox="0 0 100 100" fill="none">
            <path d="M20 50 Q50 20 80 50 T140 50" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="80" cy="30" r="15" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between py-3">
          <h1 className="text-xl font-bold text-white">记录</h1>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setChatsLoading(true);
                const dateParam = viewMode === 'byDate' ? dates[dateIndex] : undefined;
                const limitParam = viewMode === 'all' ? 1000 : undefined;
                fetchTimeline(dateParam, limitParam)
                  .then((items: any[]) => {
                    setTimelineItems(items || []);
                    setChats(
                      (items || [])
                        .filter((it: any) => it.type === 'conversation')
                        .map((it: any) => ({
                          id: it.id,
                          role: it.data?.role,
                          content: it.data?.content,
                          timestamp: viewMode === 'all'
                            ? formatChatTimestamp(normalizeDateKey(it.logDate), it.timestamp)
                            : (it.timestamp || '').slice(0, 5),
                          logDate: normalizeDateKey(it.logDate),
                          extra: it.data?.extra || undefined,
                        }))
                    );
                  })
                  .catch(() => { setTimelineItems([]); setChats([]); })
                  .finally(() => setChatsLoading(false));
              }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"><Calendar className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="relative z-10 bg-white/12 backdrop-blur-sm rounded-2xl p-4 border border-white/15 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-white font-bold text-sm">小爱音箱</p>
                <p className="text-white/60 text-xs">客厅设备 · 在线</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-400/25 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs text-emerald-100 font-medium">实时同步</span>
            </div>
          </div>
        </div>
      </header>

      {dates.length > 0 && viewMode === 'byDate' && (
        <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0 border-b border-gray-100/80">
          <button
            onClick={() => setDateIndex((i) => Math.max(0, i - 1))}
            disabled={dateIndex === 0}
            className={cn('p-2 rounded-full transition', dateIndex === 0 ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-50')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-gray-900">{isToday ? '今天' : currentDateLabel}</span>
            <span className="text-xs text-gray-400 mt-0.5">{currentYear}年{currentDateLabel}</span>
          </div>
          <button
            onClick={() => setDateIndex((i) => Math.min(dates.length - 1, i + 1))}
            disabled={dateIndex === dates.length - 1}
            className={cn('p-2 rounded-full transition', dateIndex === dates.length - 1 ? 'text-gray-200' : 'text-gray-500 hover:bg-gray-50')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 space-y-5 hide-scrollbar">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('byDate')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold transition',
              viewMode === 'byDate' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            )}
          >
            按日期查看
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold transition',
              viewMode === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            )}
          >
            全部记录
          </button>
        </div>

        {dates.length > 0 && viewMode === 'byDate' && (
          <div className="flex justify-center">
            <span className="bg-gray-100 text-gray-400 text-xs px-3 py-1 rounded-full">
              {isToday ? '今天 ' : ''}{currentYear}年{currentDateLabel}
            </span>
          </div>
        )}

        {chatsLoading ? (
          <LoadingSpinner />
        ) : timelineItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">暂无记录</p>
        ) : (
          (() => {
            // 聚合同餐次的饮食记录
            const mealGroups: Record<string, any[]> = {};
            const nonMealItems: any[] = [];
            let firstMealInserted = new Set<string>();
            const processedItems: any[] = [];

            timelineItems.forEach((item: any) => {
              if (item.type === 'meal') {
                const mealType = item.data?.mealType || 'other';
                if (!mealGroups[mealType]) mealGroups[mealType] = [];
                mealGroups[mealType].push(item);
              } else {
                processedItems.push({ ...item, _kind: 'normal' });
              }
            });

            // 为每个餐次生成一个聚合卡片，插入到第一条该餐次出现的位置
            const mealCards: any[] = [];
            (['breakfast', 'lunch', 'dinner'] as const).forEach((mt) => {
              const group = mealGroups[mt];
              if (!group || group.length === 0) return;
              const label = mt === 'breakfast' ? '🌅 早餐' : mt === 'lunch' ? '☀️ 午餐' : '🌙 晚餐';
              const totalCal = group.reduce((s: number, g: any) => s + (g.data?.calories || 0), 0);
              const allFoods = group.flatMap((g: any) => (g.data?.foodNames || '').split('、').filter(Boolean));
              const allNotes = group.map((g: any) => g.data?.notes).filter(Boolean);
              const latestTime = group[group.length - 1]?.timestamp || '';
              const latestLogDate = group[group.length - 1]?.logDate || '';
              mealCards.push({
                id: `meal-agg-${mt}`,
                _kind: 'meal-agg',
                mealType: mt,
                label,
                totalCal,
                allFoods,
                allNotes,
                count: group.length,
                timestamp: latestTime,
                logDate: latestLogDate,
              });
            });

            // 把聚合饮食卡片按时间插入到对话流中（放在最前面）
            const finalItems = [...mealCards, ...processedItems];

            return finalItems.map((item: any) => {
              if (item._kind === 'meal-agg') {
                const timeLabel = viewMode === 'all'
                  ? formatChatTimestamp(item.logDate, item.timestamp)
                  : (item.timestamp || '').slice(0, 5);
                return (
                  <div key={item.id} className="rounded-[20px] border border-amber-100 bg-[linear-gradient(135deg,#fffbf0_0%,#fff7e6_100%)] p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold text-amber-800">{item.label}</span>
                        <span className="text-xs text-amber-500 ml-2">{item.totalCal} kcal</span>
                        {item.count > 1 && <span className="text-xs text-gray-400 ml-1">({item.count}条记录)</span>}
                      </div>
                      <span className="text-xs text-gray-400">{timeLabel}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {item.allFoods.map((n: string) => translateFoodName(n.trim())).join('、') || '暂无食物记录'}
                    </p>
                    {item.allNotes.length > 0 && <p className="text-xs text-gray-400 mt-1">备注：{item.allNotes.join('；')}</p>}
                  </div>
                );
              }

            const timeLabel = viewMode === 'all'
              ? formatChatTimestamp(item.logDate, item.timestamp)
              : (item.timestamp || '').slice(0, 5);

            // --- 体征记录卡片 ---
            if (item.type === 'vital') {
              const isPressure = item.data.metricType === 'blood_pressure';
              const statusColor = item.data.status === 'high' ? 'text-red-600' : item.data.status === 'low' ? 'text-blue-600' : 'text-emerald-600';
              const fallbackFollowUp = [item.data?.notes, item.data?.sourceText]
                .filter((text: any) => typeof text === 'string' && /补录|服药|吃药|未服|场景|餐后|空腹|睡前|随机/.test(text))
                .map((text: string) => text.replace(/\[(追问)?补录\]/g, '').trim())
                .filter(Boolean)
                .join('；');
              const followUpText = (item.data?.followUpInfo || fallbackFollowUp || '').replace(/^补录[:：]\s*/, '');
              return (
                <div key={item.id} className="rounded-[20px] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isPressure ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-500')}>
                      {isPressure ? <Heart className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-800">{item.data.label}{item.data.contextLabel ? ` · ${item.data.contextLabel}` : ''}</span>
                    </div>
                    <span className="text-xs text-gray-400">{timeLabel}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn('text-2xl font-black', statusColor)}>{item.data.value}</span>
                    <span className="text-sm text-gray-400">{item.data.unit}</span>
                  </div>
                  {!isPressure && followUpText ? (
                    <div className="mt-2 inline-flex rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                      补录：{followUpText}
                    </div>
                  ) : null}
                </div>
              );
            }

            // --- 对话记录（默认） ---
            const role = item.data?.role;
            const content = item.data?.content;
            const extra = item.data?.extra;
            return (
              <div key={item.id} className={cn('flex items-start gap-3', role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-9 h-9 rounded-full shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center',
                  role === 'user' ? 'bg-gray-200' : 'bg-indigo-100'
                )}>
                  {role === 'user' ? (
                    <img src="https://picsum.photos/seed/elderly/100/100" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className={cn('flex flex-col max-w-[78%]', role === 'user' ? 'items-end' : 'items-start')}>
                  <div className={cn(
                    'px-4 py-3 rounded-[20px] text-sm leading-relaxed shadow-sm',
                    role === 'user' ? 'bg-indigo-600 text-white rounded-tr-md' : 'bg-white text-gray-800 rounded-tl-md'
                  )}>
                    {content}
                  </div>
                  {extra && (
                    <div className={cn(
                      'mt-2 p-3.5 rounded-2xl border w-full shadow-sm',
                      extra.type === 'alert' ? 'bg-red-50/70 border-red-100' : 'bg-emerald-50/70 border-emerald-100'
                    )}>
                      <p className="text-sm font-bold text-gray-700">{extra.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{extra.text}</p>
                      {extra.items && (
                        <ul className="mt-2 space-y-1">
                          {extra.items.map((it: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0" />{it}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-gray-400 mt-1 px-1">{timeLabel}</span>
                </div>
              </div>
            );
          });
          })()
        )}
        <div className="h-4" />
      </main>

      <div className="bg-white border-t border-gray-100/80 p-4 flex flex-col items-center shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <MessageSquare className="w-3 h-3" />
          <span>正在通过小爱音箱同步对话...</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-1/3 h-full bg-indigo-500/25 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

// --- Settings Screen ---