import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Calendar,
  FileText,
  History,
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
import { LoadingSpinner } from '../components/ui';
import { formatTrendDay } from '../utils';
import type { TomorrowMealOption } from '../types/app';
import {
  fetchLatestHealthReport,
  fetchTomorrowMealGuide,
} from '../api';

export const ReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [tomorrowGuide, setTomorrowGuide] = useState<TomorrowMealOption[]>([]);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideActionKey, setGuideActionKey] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestHealthReport()
      .then((r: any) => setReport(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const score = report?.nutritionScore ?? report?.nutrition_score ?? 0;
  const reportTrends: { day: string; score: number }[] = (report?.trends || []).map((t: any) => ({
    day: formatTrendDay(t.date),
    score: t.nutritionScore ?? t.nutrition_score ?? t.score ?? 0,
  }));
  const recommendations: string[] = report?.recommendations || [];

  const nutritionData = [
    { label: '碳水', value: 105, target: '100-130', status: '正常', color: 'bg-emerald-500', progress: 80, advice: '符合胆囊术后饮食要求' },
    { label: '蛋白质', value: 31, target: '50-60', status: '偏低', color: 'bg-amber-500', progress: 55, advice: '建议：增加优质蛋白（鸡蛋/鱼/豆腐）' },
    { label: '脂肪', value: 29, target: '20-25', status: '偏高', color: 'bg-red-500', progress: 90, advice: '建议：减少高脂肉类' },
    { label: '膳食纤维', value: 5, target: '20-25', status: '缺乏', color: 'bg-red-400', progress: 20, advice: '建议：增加蔬菜摄入' },
  ];

  useEffect(() => {
    let cancelled = false;
    setGuideLoading(true);
    fetchTomorrowMealGuide({ mode: 'set', nonce: Date.now() })
      .then((result: any) => {
        if (!cancelled) {
          setTomorrowGuide(result.plan || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTomorrowGuide([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGuideLoading(false);
          setGuideActionKey(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefreshGuideSet = async () => {
    setGuideActionKey('set');
    setGuideLoading(true);
    try {
      const result: any = await fetchTomorrowMealGuide({ mode: 'set', nonce: Date.now() });
      setTomorrowGuide(result.plan || []);
    } catch (e) {
      console.error('Failed to refresh meal guide set:', e);
    } finally {
      setGuideLoading(false);
      setGuideActionKey(null);
    }
  };

  const handleRefreshSingleMeal = async (mealType: '早餐' | '午餐' | '晚餐') => {
    setGuideActionKey(mealType);
    try {
      const result: any = await fetchTomorrowMealGuide({ mode: 'single', mealType, nonce: Date.now() });
      setTomorrowGuide((prev) =>
        prev.map((item) => (item.type === mealType ? result : item))
      );
    } catch (e) {
      console.error(`Failed to refresh ${mealType} guide:`, e);
    } finally {
      setGuideActionKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-brand-bg pb-24 hide-scrollbar">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg pb-24 hide-scrollbar">
      <header className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-safe pb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <svg className="absolute top-0 right-0 w-48 h-48" viewBox="0 0 200 200" fill="none">
            <circle cx="150" cy="50" r="100" stroke="white" strokeWidth="2" />
            <circle cx="150" cy="50" r="65" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between py-3">
          <h1 className="text-xl font-bold text-white">健康报告</h1>
          <div className="flex gap-1">
            <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"><Calendar className="w-5 h-5" /></button>
            <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"><History className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 mt-4">
          {(['daily', 'weekly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={cn(
                'flex-1 py-3 rounded-2xl text-sm font-bold transition-all',
                reportType === t ? 'bg-white text-slate-800 shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/15'
              )}
            >
              {t === 'daily' ? '每日报告' : '本周汇总'}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4 -mt-2">
        {/* Overall Score */}
        <section className="bg-white rounded-[22px] p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50 blur-2xl" />
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#4f46e5" strokeWidth="5" strokeDasharray={176} strokeDashoffset={176 - (176 * score) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">{score}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">总体评分：{score}分</h3>
              <p className="text-sm text-gray-400 mt-0.5">三餐规律，营养结构可优化</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: '规律性', score: '20/20', ok: true },
              { label: '营养平衡', score: '25/40', ok: false },
              { label: '适合度', score: '30/40', ok: false },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                <div className={cn('text-sm font-bold', item.ok ? 'text-emerald-600' : 'text-amber-600')}>{item.score}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
            今日评价：三餐规律，整体清淡，但蛋白质和蔬菜摄入不足。建议优化营养结构。
          </p>
        </section>

        {/* Nutrition Analysis */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">营养分析</h3>
            </div>
          </div>
          <div className="space-y-5">
            {nutritionData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">{item.label}</span>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    item.status === '正常' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  )}>
                    {item.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>摄入：{item.value}g</span>
                    <span>推荐：{item.target}g</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={cn('h-full rounded-full', item.color)}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{item.advice}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Advice / Recommendations */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">AI 综合建议</h3>
          </div>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { idx: 1, title: '增加蛋白质摄入', current: 31, target: '50-60', pct: 52, color: 'indigo', advice: ['早餐：增加1个鸡蛋或1杯豆浆', '午餐：增加50g鱼肉或100g豆腐'] },
                { idx: 2, title: '增加蔬菜摄入', current: 5, target: '20-25', pct: 20, color: 'emerald', advice: ['每天2-3种绿叶菜（如菠菜、小白菜）', '可以做成蔬菜汤，方便摄入'] },
              ].map((item) => (
                <div key={item.idx} className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold', item.color === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600')}>
                      {item.idx}
                    </div>
                    {item.title}
                  </h4>
                  <div className={cn('p-4 rounded-2xl space-y-2', item.color === 'indigo' ? 'bg-indigo-50/50' : 'bg-emerald-50/50')}>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>当前：{item.current}g / 目标：{item.target}g</span>
                      <span className={cn('font-bold', item.color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600')}>
                        完成度 {item.pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', item.color === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-500')} style={{ width: `${item.pct}%` }} />
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                      <p className={cn('font-bold mb-1', item.color === 'indigo' ? 'text-indigo-700' : 'text-emerald-700')}>具体建议：</p>
                      {item.advice.map((a, i) => <p key={i}>• {a}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tomorrow's Guide */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">明日用餐指引</h3>
            </div>
            <button
              onClick={handleRefreshGuideSet}
              disabled={guideLoading}
              className="text-sm text-indigo-600 font-medium"
            >
              {guideActionKey === 'set' ? '生成中...' : '换一套'}
            </button>
          </div>
          {guideLoading && tomorrowGuide.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">正在生成明日用餐建议...</p>
          ) : tomorrowGuide.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂时还没有可用建议</p>
          ) : (
            <div className="space-y-3">
              {tomorrowGuide.map((item, i) => (
                <div key={`${item.type}-${i}`} className="bg-gray-50 p-4 rounded-2xl border border-gray-100/80 hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-gray-900">{item.type} ({item.time})</span>
                  <button
                    onClick={() => handleRefreshSingleMeal(item.type)}
                    disabled={guideActionKey === item.type || guideLoading}
                    className="text-xs text-indigo-600 font-medium"
                  >
                    {guideActionKey === item.type ? '生成中...' : '换一个'}
                  </button>
                </div>
                <p className="text-sm text-indigo-700 font-bold">{item.menu}</p>
                <p className="text-xs text-gray-400 mt-1">理由：{item.reason}</p>
              </div>
              ))}
            </div>
          )}
        </section>

        {/* Weekly Trend */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">本周趋势对比</h3>
            </div>
          </div>
          {reportTrends.length > 0 ? (
            <>
              <div className="h-40 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3.5, fill: '#4f46e5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 px-1">
                <span>今日：{score}分</span>
                <span className="text-emerald-600 font-bold">较昨日 +5分 ↑</span>
                <span>本周均：{reportTrends.length > 0 ? (reportTrends.reduce((s, t) => s + t.score, 0) / reportTrends.length).toFixed(1) : 0}分</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">暂无趋势数据</p>
          )}
        </section>
      </div>
    </div>
  );
};
