import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Edit2, 
  AlertTriangle, 
  CheckCircle2, 
  Utensils, 
  Droplets,
  Home as HomeIcon,
  BarChart2,
  FileText,
  Settings,
  MessageSquare,
  Sparkles,
  User,
  History,
  Stethoscope,
  Pill,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Check,
  X,
  Eye,
  BellRing,
  Accessibility
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { Meal, ChatMessage, ElderlyProfile } from './types';
import { AuthorizationManagement } from './AuthorizationManagement';
import { SystemSettingsCollapsible } from './SystemSettingsCollapsible';

type AlertItem = {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  suggestion: string;
};

// --- Mock Data ---
const MOCK_MEALS: Meal[] = [
  {
    id: '1',
    type: 'breakfast',
    time: '08:00',
    items: ['🥣 粥', '🥚 蒸蛋'],
    calories: 320,
    protein: 10,
    fat: 5,
    carbs: 50,
    analysis: '清淡，适合术后',
    isWarning: false
  },
  {
    id: '2',
    type: 'lunch',
    time: '12:00',
    items: ['🍜 面条 (1碗)'],
    calories: 450,
    protein: 15,
    fat: 10,
    carbs: 70,
    analysis: '记录正常',
    isWarning: false
  },
  {
    id: '3',
    type: 'dinner',
    time: '19:00',
    items: ['🍚 米饭', '🥩 红烧肉'],
    calories: 850,
    protein: 20,
    fat: 55,
    carbs: 60,
    isWarning: true,
    analysis: '红烧肉油脂含量偏高，不利于术后恢复。'
  }
];

const MOCK_ALERTS = [
  {
    id: 'a1',
    level: 'high',
    title: '高风险预警',
    content: '晚餐红烧肉偏油',
    suggestion: '建议：明日清淡饮食'
  },
  {
    id: 'a2',
    level: 'medium',
    title: '中等风险预警',
    content: '今日缺乏蔬菜',
    suggestion: '建议：增加绿叶菜'
  },
  {
    id: 'a3',
    level: 'low',
    title: '温馨提示',
    content: '蛋白质偏少',
    suggestion: '建议：补充鸡蛋/鱼'
  }
];

const MOCK_CHATS: ChatMessage[] = [
  {
    id: 'c1',
    role: 'user',
    content: '小爱，我早上喝了一碗小米粥，还吃了一个煮鸡蛋。',
    timestamp: '08:15'
  },
  {
    id: 'c2',
    role: 'assistant',
    content: '收到，奶奶。早餐：小米粥一碗、煮鸡蛋一个，已记录。这顿早餐搭配很清淡，蛋白质也很充足，非常棒！',
    timestamp: '08:15'
  },
  {
    id: 'c3',
    role: 'user',
    content: '中午儿子送来了红烧肉，我吃了不少，真香啊。还有半碗米饭。',
    timestamp: '12:30'
  },
  {
    id: 'c4',
    role: 'assistant',
    content: '午餐：红烧肉（较多）、米饭半碗，已记录。',
    timestamp: '12:30',
    extra: {
      type: 'alert',
      title: '饮食提醒',
      text: '奶奶，红烧肉虽然好吃，但是油脂含量较高，加上您术后还在恢复期，建议晚餐要吃得清淡一些哦，多吃点绿叶蔬菜。'
    }
  },
  {
    id: 'c5',
    role: 'user',
    content: '小爱，那我晚上吃点什么好呢？',
    timestamp: '16:45'
  },
  {
    id: 'c6',
    role: 'assistant',
    content: '考虑到中午摄入油脂较多，晚餐建议如下：',
    timestamp: '16:45',
    extra: {
      type: 'recommendation',
      title: '推荐食谱',
      text: '去油腻',
      items: ['清炒时蔬（如菠菜或油菜）', '清蒸鱼片（易消化蛋白质）', '杂粮粥一小碗']
    }
  }
];

const TREND_DATA = [
  { day: '周一', score: 80 },
  { day: '周二', score: 75 },
  { day: '周三', score: 82 },
  { day: '周四', score: 78 },
  { day: '周五', score: 70 },
  { day: '周六', score: 85 },
  { day: '周日', score: 75 },
];

// --- Components ---

const BottomNav = ({
  activeTab,
  onTabChange,
  elderMode,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  elderMode: boolean;
}) => {
  const tabs = [
    { id: 'home', label: '首页', icon: HomeIcon },
    { id: 'report', label: '报告', icon: BarChart2 },
    { id: 'log', label: '记录', icon: FileText },
    { id: 'settings', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 z-50">
      <div className={cn("flex justify-around items-center", elderMode ? "h-20" : "h-16")}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center w-1/4 transition-colors gap-1",
              activeTab === tab.id ? "text-indigo-600" : "text-gray-400"
            )}
          >
            <tab.icon className={cn(elderMode ? "w-7 h-7" : "w-6 h-6", activeTab === tab.id && "fill-current")} />
            <span className={cn("font-medium", elderMode ? "text-base" : "text-sm")}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// --- Screens ---

const HomeScreen = ({
  onTabChange,
  elderMode,
  onOpenElderMode,
}: {
  onTabChange: (tab: string) => void;
  elderMode: boolean;
  onOpenElderMode: () => void;
}) => {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [showRiskFloat, setShowRiskFloat] = useState(true);

  return (
    <div className={cn("flex-1 overflow-y-auto bg-brand-bg hide-scrollbar", elderMode ? "pb-36" : "pb-24")}>
      {/* 顶部 - 现代大气设计 */}
      <header className="bg-gradient-to-br from-indigo-500 to-purple-600 px-4 pt-safe pb-6 rounded-b-3xl shadow-lg shadow-indigo-200">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden">
              <img 
                src="https://picsum.photos/seed/elderly/100/100" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-white/80 text-sm">早上好</p>
              <p className="text-lg font-bold text-white">李奶奶</p>
            </div>
          </div>
          <button
            onClick={onOpenElderMode}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-all backdrop-blur-sm",
              elderMode 
                ? "bg-emerald-400/30 text-emerald-100 border border-emerald-300/50" 
                : "bg-white/20 text-white/90 border border-white/30"
            )}
          >
            {elderMode ? "老人模式" : "标准模式"}
          </button>
        </div>
        
        {/* 健康分数 */}
        <div className="flex items-end justify-between mt-4">
          <div>
            <p className="text-white/70 text-sm mb-1">今日健康指数</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">75</span>
              <span className="text-xl text-white/80">分</span>
            </div>
            <p className="text-white/60 text-xs mt-1">较昨日 +3分 ↑</p>
          </div>
          {/* 节气小标签 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
            <p className="text-xs text-white/70">今日节气</p>
            <p className="text-sm font-bold text-white">立冬 · 宜温补</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Today's Diet Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className={cn("mb-4", elderMode ? "space-y-3" : "flex justify-between items-center")}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-text-main">今日饮食</h3>
            </div>
            <div className={cn("gap-3", elderMode ? "grid grid-cols-2" : "flex")}>
              <button className={cn("text-indigo-600 font-medium rounded-lg", elderMode ? "bg-indigo-50 py-2 text-sm" : "text-sm")}>查看本周 ▶</button>
              <button className={cn("text-indigo-600 font-medium rounded-lg", elderMode ? "bg-indigo-50 py-2 text-sm" : "text-sm")}>查看历史 ▶</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {MOCK_MEALS.map((meal) => (
              <div key={meal.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-text-main">
                      {meal.type === 'breakfast' ? '早餐' : meal.type === 'lunch' ? '午餐' : '晚餐'} ({meal.time})
                    </span>
                    <MessageSquare className="w-3 h-3 text-indigo-400" />
                  </div>
                  <button
                    onClick={() => setSelectedMeal(meal)}
                    className="text-sm text-indigo-600"
                  >
                    查看详情
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meal.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <span className="text-sm">{item}</span>
                      {meal.isWarning && item.includes('红烧肉') ? (
                        <span className="text-sm text-brand-red flex items-center">⚠️ 高脂</span>
                      ) : (
                        <Check className="w-3 h-3 text-brand-green" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-text-hint gap-2">
                  <span className="whitespace-nowrap">录入方式：小爱语音</span>
                  <span className={cn(
                    "font-bold whitespace-nowrap",
                    meal.isWarning ? "text-brand-red" : "text-brand-green"
                  )}>评分：{meal.isWarning ? '60分' : meal.type === 'breakfast' ? '90分' : '85分'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Diet Warning Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-brand-red" />
            <h3 className="text-lg font-bold text-text-main">⚠️ 饮食预警</h3>
          </div>
          <div className="space-y-3">
            {MOCK_ALERTS.map((alert) => (
              <div key={alert.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {alert.level === 'high' ? <AlertTriangle className="w-3 h-3 text-brand-red" /> : 
                   alert.level === 'medium' ? <AlertTriangle className="w-3 h-3 text-brand-yellow" /> : 
                   <Sparkles className="w-3 h-3 text-brand-blue" />}
                  <span className={cn(
                    "text-sm font-bold",
                    alert.level === 'high' ? "text-brand-red" : 
                    alert.level === 'medium' ? "text-brand-yellow" : "text-brand-blue"
                  )}>{alert.title}</span>
                </div>
                <div className={cn(
                  "p-3 rounded-xl border",
                  alert.level === 'high' ? "bg-red-50 border-red-100" : 
                  alert.level === 'medium' ? "bg-yellow-50 border-yellow-100" : "bg-blue-50 border-blue-100"
                )}>
                  <p className="text-sm font-bold text-text-main">{alert.content}</p>
                  <p className="text-sm text-text-sub mt-1">{alert.suggestion}</p>
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      onClick={() => setShowRiskFloat(false)}
                      className="text-sm text-text-hint"
                    >
                      忽略
                    </button>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-sm text-indigo-600 font-bold"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Trend Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-text-main">7日健康趋势</h3>
            </div>
            <button className="text-sm text-indigo-600 font-medium">查看详细报告 ▶</button>
          </div>
          <div className="h-40 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#9ca3af' }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-sm text-text-hint">平均分</div>
              <div className="text-sm font-bold text-text-main">77.9分</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-sm text-text-hint">最高分</div>
              <div className="text-sm font-bold text-brand-green">90分</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-sm text-text-hint">最低分</div>
              <div className="text-sm font-bold text-brand-red">70分</div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-text-hint font-bold mb-1">简要分析：</p>
            <div className="flex items-center gap-1 text-sm text-text-sub">
              <Check className="w-3 h-3 text-brand-green" />
              <span>本周整体饮食规律</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-text-sub">
              <Check className="w-3 h-3 text-brand-green" />
              <span>三餐时间稳定</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-text-sub">
              <AlertTriangle className="w-3 h-3 text-brand-yellow" />
              <span>周五、周日肉类偏油</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-text-sub">
              <AlertTriangle className="w-3 h-3 text-brand-yellow" />
              <span>蔬菜摄入不足</span>
            </div>
          </div>
        </section>

        {/* Latest Conversation Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-text-main">💬 最新对话</h3>
            </div>
            <button className="text-sm text-indigo-600 font-medium">查看全部对话 ▶</button>
          </div>
          <div className="space-y-4">
            {MOCK_CHATS.slice(0, 4).map((chat, i) => (
              <div key={chat.id} className={cn(
                "pb-3 border-b border-gray-50 last:border-0 last:pb-0",
                i % 2 === 0 ? "mt-0" : "mt-2"
              )}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-text-hint">{chat.timestamp}</span>
                  <span className="text-sm font-bold text-indigo-400">{chat.role === 'user' ? '老人' : '小爱'}</span>
                </div>
                <p className={cn(
                  "text-sm leading-relaxed",
                  chat.role === 'user' ? "text-text-main" : "text-text-sub italic"
                )}>{chat.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Risk Floating Window */}
      <AnimatePresence>
        {showRiskFloat && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn("fixed left-4 right-4 z-40", elderMode ? "bottom-32" : "bottom-24")}
          >
            <div className="rounded-2xl border border-amber-200 bg-amber-50/95 backdrop-blur p-3 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <BellRing className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">今日风险提醒</p>
                    <p className="text-sm text-amber-800 mt-1">晚餐脂肪偏高，建议今晚增加蔬菜和温水摄入。</p>
                  </div>
                </div>
                <button onClick={() => setShowRiskFloat(false)} className="text-amber-500 p-1 rounded-full hover:bg-amber-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meal Detail Modal */}
      <AnimatePresence>
        {selectedMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 flex items-end"
            onClick={() => setSelectedMeal(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full bg-white rounded-t-3xl p-5 space-y-4 max-h-[72vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-text-main">
                    {selectedMeal.type === 'breakfast' ? '早餐' : selectedMeal.type === 'lunch' ? '午餐' : '晚餐'} 详情
                  </h4>
                  <p className="text-sm text-text-sub mt-1">记录时间：{selectedMeal.time} · 语音录入</p>
                </div>
                <button onClick={() => setSelectedMeal(null)} className="p-1 rounded-full text-text-hint hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-sm text-indigo-600">热量</p>
                  <p className="text-base font-bold text-indigo-700">{selectedMeal.calories} kcal</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-sm text-emerald-600">蛋白质</p>
                  <p className="text-base font-bold text-emerald-700">{selectedMeal.protein} g</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-sm text-amber-600">脂肪</p>
                  <p className="text-base font-bold text-amber-700">{selectedMeal.fat} g</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-3">
                  <p className="text-sm text-sky-600">碳水</p>
                  <p className="text-base font-bold text-sky-700">{selectedMeal.carbs} g</p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-sm font-bold text-text-main mb-2">AI 分析</p>
                <p className="text-sm text-text-sub leading-relaxed">{selectedMeal.analysis}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center px-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "w-4 h-4",
                    selectedAlert.level === 'high'
                      ? "text-brand-red"
                      : selectedAlert.level === 'medium'
                      ? "text-brand-yellow"
                      : "text-brand-blue"
                  )} />
                  <h4 className="text-base font-bold text-text-main">{selectedAlert.title}</h4>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="text-text-hint hover:text-text-sub">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-text-main">{selectedAlert.content}</p>
              <p className="text-sm text-text-sub mt-2 leading-relaxed">{selectedAlert.suggestion}</p>
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-full mt-4 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold"
              >
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LogScreen = () => {
  const [selectedDate, setSelectedDate] = useState('2023年10月24日');

  return (
    <div className="flex-1 flex flex-col bg-brand-bg overflow-hidden">
      {/* Header - 现代清新绿色设计 */}
      <header className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-safe pb-6 rounded-b-3xl shadow-lg shadow-emerald-200 relative overflow-hidden">
        {/* 装饰性SVG图案 */}
        <svg className="absolute top-0 right-0 w-40 h-40 text-white/5" viewBox="0 0 100 100" fill="none">
          <path d="M20 50 Q50 20 80 50 T140 50" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M20 60 Q50 30 80 60 T140 60" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M20 70 Q50 40 80 70 T140 70" stroke="currentColor" strokeWidth="1" fill="none"/>
          <circle cx="80" cy="30" r="15" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <svg className="absolute bottom-0 left-0 w-36 h-36 text-white/5" viewBox="0 0 100 100" fill="none">
          <polygon points="50,10 90,90 10,90" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <polygon points="50,25 80,85 20,85" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
        
        {/* 顶部导航 */}
        <div className="flex items-center justify-between py-3 relative z-10">
          <h1 className="text-xl font-bold text-white">对话记录</h1>
          <div className="flex gap-1">
            <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 设备状态卡片 */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mt-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold">小爱音箱</p>
                <p className="text-white/70 text-sm">客厅设备 · 在线</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-400/30 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></div>
              <span className="text-xs text-emerald-100 font-medium">实时同步中</span>
            </div>
          </div>
        </div>
      </header>

      {/* Date Navigation */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <button className="p-2 text-text-hint hover:text-text-sub hover:bg-gray-50 rounded-full transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-text-main">今天</span>
          <span className="text-sm text-text-sub">{selectedDate}</span>
        </div>
        <button className="p-2 text-text-hint hover:text-text-sub hover:bg-gray-50 rounded-full transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
        <div className="flex justify-center">
          <span className="bg-gray-200/50 text-text-hint text-sm px-3 py-1 rounded-full">
            今天 {selectedDate}
          </span>
        </div>

        <div className="space-y-6">
          {MOCK_CHATS.map((chat) => (
            <div 
              key={chat.id} 
              className={cn(
                "flex items-start gap-3",
                chat.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-9 h-9 rounded-full flex-shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center",
                chat.role === 'user' ? "bg-gray-200" : "bg-indigo-100"
              )}>
                {chat.role === 'user' ? (
                  <img 
                    src="https://picsum.photos/seed/elderly/100/100" 
                    alt="User" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                )}
              </div>

              {/* Bubble Content */}
              <div className={cn(
                "flex flex-col max-w-[80%]",
                chat.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  chat.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-text-main rounded-tl-none"
                )}>
                  {chat.content}
                </div>

                {/* Extra Cards (Alerts/Recommendations) */}
                {chat.extra && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mt-2 p-3 rounded-xl border w-full shadow-sm",
                      chat.extra.type === 'alert' ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {chat.extra.type === 'alert' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-brand-red" />
                      ) : (
                        <Utensils className="w-3.5 h-3.5 text-brand-green" />
                      )}
                      <span className={cn(
                        "text-sm font-bold",
                        chat.extra.type === 'alert' ? "text-brand-red" : "text-brand-green"
                      )}>
                        {chat.extra.title}
                      </span>
                    </div>
                    <p className="text-sm text-text-sub leading-relaxed">
                      {chat.extra.text}
                    </p>
                    {chat.extra.items && (
                      <ul className="mt-2 space-y-1">
                        {chat.extra.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm text-text-sub">
                            <div className="w-1 h-1 bg-brand-green rounded-full"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}

                <span className="text-sm text-text-hint mt-1 px-1">
                  {chat.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </main>

      {/* Voice Input Indicator (Visual Only) */}
      <div className="bg-white border-t border-gray-100 p-4 flex flex-col items-center shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-hint mb-2">
          <MessageSquare className="w-3 h-3" />
          <span>正在通过小爱音箱同步对话...</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-1/3 h-full bg-indigo-600/30"
          />
        </div>
      </div>
    </div>
  );
};

const SettingsScreen = ({
  elderMode,
  onElderModeChange,
}: {
  elderMode: boolean;
  onElderModeChange: (value: boolean) => void;
}) => {
  const [isSpeakerBound, setIsSpeakerBound] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg pb-24 hide-scrollbar">
      {/* Header - 现代紫色渐变设计 */}
      <header className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-safe pb-6 rounded-b-3xl relative overflow-hidden">
        {/* 装饰性SVG图案 */}
        <svg className="absolute top-0 right-0 w-44 h-44 text-white/5" viewBox="0 0 100 100" fill="none">
          <circle cx="80" cy="20" r="30" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="80" cy="20" r="20" stroke="currentColor" strokeWidth="1"/>
          <circle cx="80" cy="20" r="10" stroke="currentColor" strokeWidth="0.5"/>
          <path d="M10 80 Q30 60 50 80 T90 80" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M10 90 Q30 70 50 90 T90 90" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
        <svg className="absolute bottom-0 left-0 w-32 h-32 text-white/5" viewBox="0 0 100 100" fill="none">
          <rect x="20" y="20" width="60" height="60" rx="10" stroke="currentColor" strokeWidth="1.5" transform="rotate(15 50 50)"/>
          <rect x="30" y="30" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1" transform="rotate(15 50 50)"/>
        </svg>
        
        {/* 顶部导航 */}
        <div className="flex items-center justify-between py-3 relative z-10">
          <h1 className="text-xl font-bold text-white">个人中心</h1>
          <div className="flex items-center gap-2">
            {/* 老人阅读模式 - 轻量开关 */}
            <button
              onClick={() => onElderModeChange(!elderMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-sm",
                elderMode 
                  ? "bg-emerald-400/30 text-emerald-100 border border-emerald-300/50" 
                  : "bg-white/15 text-white/80 border border-white/30"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{elderMode ? "阅读模式" : "阅读模式"}</span>
            </button>
            <button className="text-sm font-bold text-violet-700 bg-white px-4 py-1.5 rounded-full shadow-lg">
              保存
            </button>
          </div>
        </div>
        
        {/* 用户信息卡片 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mt-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden border-2 border-white/30">
              <img 
                src="https://picsum.photos/seed/elderly/100/100" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <p className="text-white text-lg font-bold">李奶奶</p>
              <p className="text-white/70 text-sm">68岁 · 女 · 胆囊术后恢复中</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">健康档案</p>
              <p className="text-white font-bold">完整度 85%</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Device Binding Section - 折叠入口 */}
        <details className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                isSpeakerBound ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-400"
              )}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-main">小爱音箱</h3>
                <p className={cn(
                  "text-xs mt-0.5",
                  isSpeakerBound ? "text-brand-green" : "text-text-hint"
                )}>
                  {isSpeakerBound ? "已连接" : "未绑定"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-hint group-open:rotate-90 transition-transform" />
          </summary>
          <div className="px-4 pb-4 pt-0 border-t border-gray-50">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isSpeakerBound ? "bg-brand-green" : "bg-gray-300"
                )}></span>
                <span className="text-sm text-text-sub">{isSpeakerBound ? "客厅音箱" : "暂无设备"}</span>
              </div>
              <button 
                onClick={() => setIsSpeakerBound(!isSpeakerBound)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  isSpeakerBound ? "bg-gray-100 text-text-sub" : "bg-indigo-600 text-white"
                )}
              >
                {isSpeakerBound ? "解绑" : "绑定"}
              </button>
            </div>
          </div>
        </details>

        {/* Health Records Section */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <History className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-base text-gray-800">健康档案</h2>
          </div>
          <div className="space-y-5">
            {/* Chronic Diseases */}
            <div>
              <label className="block text-sm font-bold text-text-hint mb-2 uppercase tracking-wider">基础疾病</label>
              <div className="flex flex-wrap gap-2">
                {['高血压', '糖尿病', '高血脂', '痛风', '心脏病'].map((disease) => (
                  <button 
                    key={disease} 
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      ['高血压', '高血脂'].includes(disease) 
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                        : "border-gray-100 bg-gray-50 text-text-sub"
                    )}
                  >
                    {disease}
                  </button>
                ))}
                <button className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-gray-300 text-text-hint">
                  + 其他
                </button>
              </div>
            </div>

            {/* Surgery History */}
            <div>
              <label className="block text-sm font-bold text-text-hint mb-2 uppercase tracking-wider">手术史</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-bold text-rose-700">胆囊切除术 (2024.10)</span>
                  </div>
                  <Plus className="w-4 h-4 rotate-45 text-rose-300" />
                </div>
                <button className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-text-hint flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> 添加手术记录
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Medication Section */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Pill className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-base text-gray-800">用药管理</h2>
          </div>
          <div className="space-y-3">
            {[
              { name: '氨氯地平 (降压)', dose: '每日 1 次，每次 1 片', time: '早餐后' },
              { name: '阿托伐他汀 (降脂)', dose: '每日 1 次，每次 1 片', time: '睡前' },
            ].map((med, i) => (
              <div key={i} className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-text-main">{med.name}</p>
                  <p className="text-sm text-text-sub mt-1">{med.dose} · {med.time}</p>
                </div>
                <Edit2 className="w-4 h-4 text-orange-400" />
              </div>
            ))}
            <button className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-text-hint flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> 添加药品
            </button>
          </div>
        </section>

        {/* Medical Advice Section */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Stethoscope className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-base text-gray-800">医嘱信息</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="text-sm text-emerald-800 leading-relaxed">
                “术后三个月内严禁摄入高脂肪、辛辣刺激性食物。保持少食多餐，每餐七分饱。增加优质蛋白和绿叶蔬菜摄入，每日饮水不少于1500ml。”
              </p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-emerald-100/50">
                <span className="text-sm text-emerald-600 font-bold">来源：主治医生 王医生</span>
                <span className="text-sm text-text-hint">更新于 2024.11.01</span>
              </div>
            </div>
            <button className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-text-hint flex items-center justify-center gap-1">
              <Edit2 className="w-3 h-3" /> 修改医嘱
            </button>
          </div>
        </section>

        {/* Authorization Management Section */}
        <AuthorizationManagement />

        {/* Preferences Section */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Utensils className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-base text-gray-800">偏好配置</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-main">口味偏好</span>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-gray-50 text-text-sub text-sm rounded border border-gray-100">清淡</span>
                <span className="px-2 py-1 bg-gray-50 text-text-sub text-sm rounded border border-gray-100">少盐</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-main">喜欢的食物</span>
              <span className="text-sm text-text-hint">小米粥、鸡蛋羹、清蒸鱼</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-main">忌口食物</span>
              <span className="text-sm text-brand-red font-bold">红烧肉、辣椒、油炸食品</span>
            </div>
            <button className="w-full py-2.5 bg-gray-50 rounded-xl text-sm text-indigo-600 font-bold">
              修改偏好
            </button>
          </div>
        </section>

        {/* Logout Button */}
        <button className="w-full py-4 text-brand-red font-bold text-sm bg-white rounded-2xl shadow-sm border border-red-50">
          退出登录
        </button>
      </main>
    </div>
  );
};

const ReportScreen = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');

  const nutritionData = [
    { label: '碳水', value: 105, target: '100-130', status: '正常', color: 'bg-brand-green', progress: 80, advice: '符合胆囊术后饮食要求' },
    { label: '蛋白质', value: 31, target: '50-60', status: '偏低', color: 'bg-brand-yellow', progress: 55, advice: '建议：增加优质蛋白（鸡蛋/鱼/豆腐）' },
    { label: '脂肪', value: 29, target: '20-25', status: '偏高', color: 'bg-brand-red', progress: 90, advice: '建议：减少高脂肉类' },
    { label: '膳食纤维', value: 5, target: '20-25', status: '缺乏', color: 'bg-brand-red', progress: 20, advice: '建议：增加蔬菜摄入' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg pb-24 hide-scrollbar">
      {/* Header - 现代深色渐变设计 */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 pt-safe pb-6 rounded-b-3xl relative overflow-hidden">
        {/* 装饰性SVG图案 */}
        <svg className="absolute top-0 right-0 w-48 h-48 text-white/5" viewBox="0 0 200 200" fill="none">
          <circle cx="150" cy="50" r="100" stroke="currentColor" strokeWidth="2"/>
          <circle cx="150" cy="50" r="70" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="150" cy="50" r="40" stroke="currentColor" strokeWidth="1"/>
          <path d="M50 150 Q100 100 150 150 T250 150" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="absolute bottom-0 left-0 w-32 h-32 text-white/5" viewBox="0 0 100 100" fill="none">
          <rect x="10" y="10" width="80" height="80" rx="20" stroke="currentColor" strokeWidth="2"/>
          <rect x="25" y="25" width="50" height="50" rx="15" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        
        {/* 顶部导航 */}
        <div className="flex items-center justify-between py-3 relative z-10">
          <h1 className="text-xl font-bold text-white">健康报告</h1>
          <div className="flex gap-1">
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <Calendar className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 日期选择器 */}
        <div className="flex gap-3 mt-4 relative z-10">
          <button 
            onClick={() => setReportType('daily')}
            className={cn(
              "flex-1 py-3 rounded-2xl text-sm font-bold transition-all",
              reportType === 'daily' 
                ? "bg-white text-slate-800 shadow-lg" 
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            每日报告
          </button>
          <button 
            onClick={() => setReportType('weekly')}
            className={cn(
              "flex-1 py-3 rounded-2xl text-sm font-bold transition-all",
              reportType === 'weekly' 
                ? "bg-white text-slate-800 shadow-lg" 
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            本周汇总
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Overall Score Card */}
        <section className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50 blur-2xl"></div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                  <circle 
                    cx="32" cy="32" r="28" fill="none" stroke="#4f46e5" strokeWidth="6" 
                    strokeDasharray={176} 
                    strokeDashoffset={176 - (176 * 75) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600">75</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main">总体评分：75分</h3>
                <button className="text-sm text-indigo-600 font-medium">查看详情</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: '规律性', score: '20/20', color: 'text-brand-green' },
              { label: '营养平衡', score: '25/40', color: 'text-brand-yellow' },
              { label: '适合度', score: '30/40', color: 'text-brand-yellow' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 p-2 rounded-xl text-center">
                <div className="text-sm text-text-hint mb-1">{item.label}</div>
                <div className={cn("text-sm font-bold", item.color)}>{item.score}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-sub leading-relaxed border-t border-gray-50 pt-4">
            今日评价：三餐规律，整体清淡，但蛋白质和蔬菜摄入不足。红烧肉偏油，建议减少。
          </p>
        </section>

        {/* Diet Details Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-text-main">🍽️ 饮食详情</h3>
            </div>
            <button className="text-sm text-text-hint">折叠</button>
          </div>
          <div className="space-y-4">
            {[
              { time: '08:00', type: '早餐', items: [{ name: '🥣 粥', score: 90, status: '适合', nutrition: '碳水25g 蛋白质3g 脂肪1g' }] },
              { time: '12:00', type: '午餐', items: [{ name: '🍜 面条 (1碗)', score: 85, status: '适合', nutrition: '碳水40g 蛋白质8g 脂肪2g' }] },
              { time: '19:00', type: '晚餐', items: [
                { name: '🍚 米饭', score: 85, status: '适合', nutrition: '碳水35g 蛋白质5g 脂肪1g' },
                { name: '🥩 红烧肉', score: 40, status: '需注意', nutrition: '碳水5g 蛋白质15g 脂肪25g', warning: '⚠️ 脂肪偏高，建议适量' }
              ] },
            ].map((meal, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-sm font-bold text-text-sub">{meal.type} ({meal.time})</div>
                {meal.items.map((item, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-text-main">{item.name}</span>
                      <CheckCircle2 className={cn("w-4 h-4", item.status === '适合' ? "text-brand-green" : "text-brand-yellow")} />
                    </div>
                    <div className="flex justify-between items-center text-sm text-text-hint">
                      <span>评分：{item.score}分 | 适合度：{item.status}</span>
                    </div>
                    <div className="text-sm text-text-hint mt-1">营养：{item.nutrition}</div>
                    {item.warning && (
                      <div className="mt-2 text-sm text-brand-red font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {item.warning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Nutrition Analysis Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-text-main">📊 营养分析</h3>
            </div>
            <button className="text-sm text-indigo-600 font-medium">对比本周平均</button>
          </div>
          <div className="space-y-6">
            {nutritionData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-text-main">{item.label}：{item.status}</span>
                  <span className={cn(
                    "text-sm font-bold",
                    item.status === '正常' ? "text-brand-green" : "text-brand-red"
                  )}>{item.status === '正常' ? '✅' : '⚠️'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between text-sm text-text-sub mb-2">
                    <span>摄入量：{item.value}g</span>
                    <span>推荐量：{item.target}g</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", item.color)} 
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-text-sub mt-2 italic">{item.advice}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Regularity Analysis */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-text-main">📈 饮食规律性分析</h3>
            </div>
            <span className="text-sm font-bold text-brand-green">20/20分 ✅</span>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                <span className="text-sm font-bold text-text-main">三餐记录完整</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['早餐', '午餐', '晚餐'].map(t => (
                  <div key={t} className="text-sm text-text-sub flex items-center gap-1">
                    <div className="w-1 h-1 bg-brand-green rounded-full"></div>
                    {t}已记录
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                <span className="text-sm font-bold text-text-main">用餐时间规律</span>
              </div>
              {[
                { label: '早餐', time: '08:00', range: '07:00-09:00' },
                { label: '午餐', time: '12:00', range: '11:00-13:00' },
                { label: '晚餐', time: '19:00', range: '18:00-20:00' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-text-sub">{item.label}：{item.time}</span>
                  <span className="text-sm text-text-hint">标准：{item.range}</span>
                  <Check className="w-3 h-3 text-brand-green" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Comprehensive Advice */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-text-main">💡 AI 综合建议</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-text-main flex items-center gap-1">
                <div className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</div>
                增加蛋白质摄入
              </h4>
              <div className="bg-indigo-50/50 p-3 rounded-xl space-y-2">
                <div className="flex justify-between text-sm text-text-sub">
                  <span>当前：31g / 目标：50-60g</span>
                  <span className="text-indigo-600 font-bold">完成度 52%</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[52%] rounded-full"></div>
                </div>
                <div className="text-sm text-text-sub mt-2">
                  <p className="font-bold text-indigo-700 mb-1">具体建议：</p>
                  <p>• 早餐：增加1个鸡蛋或1杯豆浆</p>
                  <p>• 午餐：增加50g鱼肉或100g豆腐</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-text-main flex items-center gap-1">
                <div className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                增加蔬菜摄入
              </h4>
              <div className="bg-emerald-50/50 p-3 rounded-xl space-y-2">
                <div className="flex justify-between text-sm text-text-sub">
                  <span>当前：5g / 目标：20-25g</span>
                  <span className="text-brand-green font-bold">完成度 20%</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-green h-full w-[20%] rounded-full"></div>
                </div>
                <div className="text-sm text-text-sub mt-2">
                  <p className="font-bold text-emerald-700 mb-1">具体建议：</p>
                  <p>• 每天2-3种绿叶菜（如菠菜、小白菜）</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tomorrow's Meal Guide */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-text-main">📋 明日用餐指引</h3>
            </div>
            <button className="text-sm text-indigo-600 font-medium">换一套推荐</button>
          </div>
          <div className="space-y-3">
            {[
              { type: '早餐', time: '08:00', menu: '粥 + 蒸蛋 + 小青菜', reason: '补充蛋白质和膳食纤维' },
              { type: '午餐', time: '12:00', menu: '面条 + 清蒸鱼 + 豆腐', reason: '优质蛋白，低脂健康' },
              { type: '晚餐', time: '19:00', menu: '米饭 + 蔬菜汤', reason: '清淡易消化' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-text-main">{item.type} ({item.time})</span>
                  <button className="text-sm text-indigo-600">换一个</button>
                </div>
                <p className="text-sm text-indigo-700 font-bold mt-1">{item.menu}</p>
                <p className="text-sm text-text-hint mt-1">理由：{item.reason}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Trend Comparison */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-text-main">📊 本周趋势对比</h3>
            </div>
            <button className="text-sm text-indigo-600 font-medium">查看更长时间 ▶</button>
          </div>
          <div className="h-40 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#9ca3af' }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-sm text-text-sub px-2">
            <span>今日（周五）：75分</span>
            <span className="text-brand-green font-bold flex items-center gap-1">较昨日：+5分 <ChevronRight className="w-2 h-2 -rotate-90" /></span>
            <span>本周平均：77.9分</span>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [elderMode, setElderMode] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = elderMode ? '17px' : '16px';
    return () => {
      document.documentElement.style.fontSize = '16px';
    };
  }, [elderMode]);

  useEffect(() => {
    setShowQuickActions(false);
  }, [activeTab]);

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden bg-brand-bg font-sans", elderMode && "elder-mode")}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {activeTab === 'home' && (
            <HomeScreen
              onTabChange={setActiveTab}
              elderMode={elderMode}
              onOpenElderMode={() => setElderMode((prev) => !prev)}
            />
          )}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'log' && <LogScreen />}
          {activeTab === 'settings' && (
            <SettingsScreen elderMode={elderMode} onElderModeChange={setElderMode} />
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} elderMode={elderMode} />
      
      {/* Floating Action Button for Home and Log */}
      {(activeTab === 'home' || activeTab === 'log') && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowQuickActions((prev) => !prev)}
            className={cn(
              "fixed right-6 bg-indigo-600 text-white rounded-full shadow-xl z-50 active:scale-95 transition-transform",
              elderMode ? "bottom-28 p-5" : "bottom-24 p-4"
            )}
          >
            <Plus className={cn("w-6 h-6 transition-transform", showQuickActions && "rotate-45")} />
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={cn("fixed right-6 z-50 w-56", elderMode ? "bottom-52" : "bottom-44")}
              >
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-3 space-y-2">
                  <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 text-text-main">
                    + 手动补录今日饮食
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 text-text-main">
                    📝 添加特殊备注
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 text-text-main">
                    📤 分享报告给家人
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
