import React, { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  BellRing,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Droplets,
  Edit2,
  Eye,
  FileText,
  Heart,
  History,
  Home as HomeIcon,
  MessageSquare,
  Mic,
  Pill,
  Plus,
  Search,
  Settings,
  Share2,
  Sparkles,
  Stethoscope,
  ThumbsDown,
  ThumbsUp,
  User,
  Utensils,
  X,
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
} from 'recharts';
import { cn } from './lib/utils';
import { Meal, ChatMessage } from './types';
import { AuthorizationManagement } from './AuthorizationManagement';
import {
  fetchDashboard,
  fetchLatestHealthReport,
  fetchTomorrowMealGuide,
  fetchConversationLogs,
  fetchConversationDates,
  fetchPatientProfile,
  fetchHealthConditions,
  fetchMedications,
  fetchPreferences,
  fetchMedicalOrders,
  createMeal,
  addHealthCondition,
  removeHealthCondition,
  addMedication as addMedicationApi,
  recognizeMedicationImage,
  updateMedication as updateMedicationApi,
  removeMedication as removeMedicationApi,
  updatePreferences as updatePreferencesApi,
  createMedicalOrder as createMedicalOrderApi,
  updateMedicalOrder as updateMedicalOrderApi,
  scanMedicalOrderImage,
} from './api';

type AlertItem = {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  suggestion: string;
};

type TomorrowMealOption = {
  menu: string;
  reason: string;
  type: '早餐' | '午餐' | '晚餐';
  time: string;
};

function mapApiMealToMeal(apiMeal: any): Meal {
  const foods: any[] = apiMeal.foods || [];
  return {
    id: String(apiMeal.id),
    type: apiMeal.mealType || apiMeal.meal_type,
    time: apiMeal.mealTime || apiMeal.meal_time || '',
    items: foods.map((f: any) => f.name),
    calories: apiMeal.calories || 0,
    protein: foods.reduce((s: number, f: any) => s + (f.protein || 0), 0),
    fat: foods.reduce((s: number, f: any) => s + (f.fat || 0), 0),
    carbs: foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0),
    analysis: apiMeal.notes || '',
    isWarning: (apiMeal.nutritionScore ?? apiMeal.nutrition_score ?? 100) < 70,
  };
}

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function formatTrendDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_LABELS[d.getDay()] || dateStr;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">加载中...</p>
      </div>
    </div>
  );
}

const FOOD_LIBRARY = [
  { category: '主食', items: ['米饭', '面条', '粥', '馒头', '全麦面包', '杂粮粥', '小米粥', '红薯'] },
  { category: '蛋白质', items: ['鸡蛋', '蒸蛋', '豆腐', '鱼肉', '鸡胸肉', '虾仁', '牛奶', '豆浆'] },
  { category: '蔬菜', items: ['菠菜', '小白菜', '西兰花', '胡萝卜', '番茄', '黄瓜', '青菜', '冬瓜'] },
  { category: '肉类', items: ['猪肉', '牛肉', '鸡肉', '排骨', '红烧肉', '鱼片', '虾'] },
  { category: '汤品', items: ['蔬菜汤', '紫菜蛋花汤', '鱼汤', '骨头汤', '番茄蛋汤', '冬瓜汤'] },
];

// --- Shared bottom sheet wrapper ---
function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/50 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="w-full bg-white rounded-t-[28px] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Center dialog wrapper ---
function CenterDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center px-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm bg-white rounded-[24px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ImagePreviewDialog({
  open,
  onClose,
  title,
  image,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  image?: string | null;
}) {
  return (
    <CenterDialog open={open} onClose={onClose}>
      <div className="p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        {image ? (
          <div className="rounded-[20px] overflow-hidden border border-gray-100 bg-gray-50">
            <img src={image} alt={title} className="w-full max-h-[70vh] object-contain bg-white" />
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50 py-14 text-center text-sm text-gray-400">
            暂无原图
          </div>
        )}
      </div>
    </CenterDialog>
  );
}

// --- Bottom Tab Navigation ---
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100/80 pb-safe z-50">
      <div className={cn('flex justify-around items-center', elderMode ? 'h-20' : 'h-16')}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center w-1/4 gap-1 transition-all',
                active ? 'text-indigo-600' : 'text-gray-400'
              )}
            >
              <tab.icon
                className={cn(
                  elderMode ? 'w-7 h-7' : 'w-5.5 h-5.5',
                  active && 'drop-shadow-[0_2px_4px_rgba(79,70,229,0.3)]'
                )}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className={cn('font-semibold', elderMode ? 'text-sm' : 'text-xs')}>
                {tab.label}
              </span>
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 w-10 h-0.5 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// --- Manual Meal Entry Bottom Sheet ---
function MealEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetAndClose = () => {
    setStep(1);
    setSelectedFoods([]);
    setNote('');
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const foods = selectedFoods.map((name) => ({
        name, amount: 1, unit: '份', calories: 100, protein: 5, carbs: 15, fat: 3,
      }));
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toTimeString().slice(0, 5);
      await createMeal({
        mealType,
        mealDate: today,
        mealTime: now,
        foods,
        nutritionScore: 75,
        calories: foods.length * 100,
        notes: note || undefined,
      });
      resetAndClose();
    } catch (e) {
      console.error('Failed to create meal:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFood = (food: string) => {
    setSelectedFoods((prev) =>
      prev.includes(food) ? prev.filter((f) => f !== food) : [...prev, food]
    );
  };

  return (
    <BottomSheet open={open} onClose={resetAndClose} title="补录饮食">
      {step === 1 && (
        <div className="p-5 space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">选择餐次</p>
            <div className="grid grid-cols-3 gap-3">
              {([['breakfast', '早餐', '🌅'], ['lunch', '午餐', '☀️'], ['dinner', '晚餐', '🌙']] as const).map(([key, label, icon]) => (
                <button
                  key={key}
                  onClick={() => setMealType(key)}
                  className={cn(
                    'py-4 rounded-2xl text-center border-2 transition-all',
                    mealType === key
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-100 bg-gray-50/80'
                  )}
                >
                  <span className="text-2xl block mb-1">{icon}</span>
                  <span className={cn('text-sm font-bold', mealType === key ? 'text-indigo-700' : 'text-gray-500')}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">选择食物</p>
            {FOOD_LIBRARY.map((cat) => (
              <div key={cat.category} className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat.category}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((food) => (
                    <button
                      key={food}
                      onClick={() => toggleFood(food)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                        selectedFoods.includes(food)
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 bg-white text-gray-600'
                      )}
                    >
                      {selectedFoods.includes(food) && <Check className="w-3 h-3 inline mr-1" />}
                      {food}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedFoods.length > 0 && (
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-600 mb-2">已选 {selectedFoods.length} 项</p>
              <div className="flex flex-wrap gap-2">
                {selectedFoods.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg text-sm text-indigo-700 border border-indigo-200">
                    {f}
                    <button onClick={() => toggleFood(f)}>
                      <X className="w-3 h-3 text-indigo-400" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => selectedFoods.length > 0 && setStep(2)}
            disabled={selectedFoods.length === 0}
            className={cn(
              'w-full py-4 rounded-2xl text-base font-bold transition-all',
              selectedFoods.length > 0
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            下一步：确认并提交
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="p-5 space-y-5">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-gray-900">
                {mealType === 'breakfast' ? '🌅 早餐' : mealType === 'lunch' ? '☀️ 午餐' : '🌙 晚餐'}
              </span>
              <button onClick={() => setStep(1)} className="text-sm text-indigo-600 font-medium">修改</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFoods.map((f) => (
                <span key={f} className="bg-white px-3 py-1.5 rounded-xl text-sm text-gray-700 border border-gray-200">{f}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2">备注（选填）</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="如：今天吃得比较少、食欲不好..."
              className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none h-24"
            />
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">AI 将自动分析</p>
                <p className="text-sm text-emerald-700 mt-1">提交后，系统会根据您的健康档案和医嘱自动评估这顿饭的营养状况。</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-base"
            >
              返回修改
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'flex-1 py-4 rounded-2xl font-bold text-base shadow-lg shadow-indigo-200 active:scale-[0.98]',
                submitting ? 'bg-indigo-400 text-white/80' : 'bg-indigo-600 text-white'
              )}
            >
              {submitting ? '提交中...' : '确认提交'}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

// --- Note Entry Modal ---
function NoteEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'symptom' | 'mood'>('general');

  const resetAndClose = () => {
    setNoteText('');
    setNoteType('general');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={resetAndClose} title="添加备注">
      <div className="p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">备注类型</p>
          <div className="grid grid-cols-3 gap-3">
            {([['general', '📝', '一般备注'], ['symptom', '🩺', '身体症状'], ['mood', '😊', '情绪状态']] as const).map(
              ([key, icon, label]) => (
                <button
                  key={key}
                  onClick={() => setNoteType(key)}
                  className={cn(
                    'py-3 rounded-2xl text-center border-2 transition-all',
                    noteType === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-gray-50/80'
                  )}
                >
                  <span className="text-xl block mb-1">{icon}</span>
                  <span className={cn('text-xs font-bold', noteType === key ? 'text-indigo-700' : 'text-gray-500')}>
                    {label}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">备注内容</p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={
              noteType === 'symptom'
                ? '描述身体情况，如：今天胃不太舒服...'
                : noteType === 'mood'
                ? '描述情绪状态，如：今天心情不错...'
                : '记录任何想告诉医生或家人的内容...'
            }
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none h-32"
          />
        </div>

        {noteType === 'symptom' && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">快捷选择</p>
            <div className="flex flex-wrap gap-2">
              {['食欲不振', '腹胀', '腹泻', '便秘', '恶心', '头晕', '乏力', '失眠'].map((s) => (
                <button
                  key={s}
                  onClick={() => setNoteText((prev) => (prev ? `${prev}、${s}` : s))}
                  className="px-3 py-1.5 rounded-xl text-sm border border-gray-100 bg-white text-gray-600 active:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={resetAndClose}
          disabled={!noteText.trim()}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold transition-all',
            noteText.trim()
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400'
          )}
        >
          保存备注
        </button>
      </div>
    </BottomSheet>
  );
}

// --- Share Report Modal ---
function ShareReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CenterDialog open={open} onClose={onClose}>
      <div className="p-6 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
          <Share2 className="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">分享健康报告</h3>
          <p className="text-sm text-gray-500 mt-2">选择分享方式，将今日健康报告发送给家人</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Copy className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">复制报告摘要</p>
              <p className="text-xs text-gray-500 mt-0.5">复制为文字，粘贴到微信发送</p>
            </div>
            {copied && <Check className="w-5 h-5 text-emerald-500" />}
          </button>

          <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">发送给授权医生</p>
              <p className="text-xs text-gray-500 mt-0.5">通过平台直接推送给主治医生</p>
            </div>
          </button>
        </div>

        <button onClick={onClose} className="w-full py-3 text-sm font-bold text-gray-400">
          取消
        </button>
      </div>
    </CenterDialog>
  );
}

// --- Weekly / History View ---
function WeeklyViewSheet({ open, onClose, trendData }: { open: boolean; onClose: () => void; trendData: { day: string; score: number }[] }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="本周饮食概览">
      <div className="p-5 space-y-4">
        {trendData.length > 0 && (
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {trendData.map((d) => (
              <div key={d.day} className="space-y-1">
                <span className="text-xs font-bold text-gray-400">{d.day}</span>
                <div
                  className={cn(
                    'w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold',
                    d.score >= 80 ? 'bg-emerald-100 text-emerald-700' : d.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  {d.score}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-40">
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

        <div className="space-y-3">
          {trendData.map((d) => (
            <div key={d.day} className="bg-gray-50 rounded-2xl p-4 border border-gray-100/80">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">{d.day}</span>
                <span className={cn(
                  'text-sm font-bold',
                  d.score >= 80 ? 'text-emerald-600' : d.score >= 70 ? 'text-amber-600' : 'text-red-500'
                )}>
                  {d.score}分
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

// --- Add / Edit Medication Modal ---
function AddMedicationSheet({
  open,
  onClose,
  onCreated,
  medication,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  medication?: { id: string; name: string; dosage: string; frequency?: string; timing: string; packageImage?: string; ocrText?: string };
}) {
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFrequency, setMedFrequency] = useState('每日1次');
  const [medTime, setMedTime] = useState('早餐后');
  const [packageImage, setPackageImage] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMedName(medication?.name || '');
      setMedDose(medication?.dosage || '');
      setMedFrequency(medication?.frequency || '每日1次');
      setMedTime(medication?.timing || '早餐后');
      setPackageImage(medication?.packageImage || '');
      setOcrText(medication?.ocrText || '');
    }
  }, [open, medication]);

  const resetAndClose = () => {
    setMedName('');
    setMedDose('');
    setMedFrequency('每日1次');
    setMedTime('早餐后');
    setPackageImage('');
    setOcrText('');
    setRecognizing(false);
    onClose();
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setRecognizing(true);
      const imageData = await fileToDataUrl(file);
      const result = await recognizeMedicationImage(imageData);
      setMedName(result.name || '');
      setMedDose(result.dosage || '');
      setMedFrequency(result.frequency || '请遵医嘱');
      setMedTime(result.timing || '请遵医嘱');
      setPackageImage(result.packageImage || imageData);
      setOcrText(result.ocrText || '');
    } catch (e) {
      console.error('Failed to recognize medication image:', e);
      window.alert('药品图片识别失败，请重试');
    } finally {
      setRecognizing(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!medName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: medName.trim(),
        dosage: medDose.trim() || '请遵医嘱',
        frequency: medFrequency.trim() || '请遵医嘱',
        timing: medTime.trim() || '请遵医嘱',
        packageImage: packageImage || undefined,
        ocrText: ocrText || undefined,
      };
      if (medication?.id) {
        await updateMedicationApi(medication.id, payload);
      } else {
        await addMedicationApi(payload);
      }
      onCreated?.();
      resetAndClose();
    } catch (e) {
      console.error('Failed to save medication:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!medication?.id || submitting) return;
    if (!window.confirm(`确认删除“${medication.name}”吗？`)) return;
    setSubmitting(true);
    try {
      await removeMedicationApi(medication.id);
      onCreated?.();
      resetAndClose();
    } catch (e) {
      console.error('Failed to remove medication:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={resetAndClose} title={medication ? '编辑药品' : '添加药品'}>
      <div className="p-5 space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="rounded-[24px] border border-orange-100 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,1))] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900">拍药盒识别</p>
              <p className="text-xs text-gray-500 mt-1">拍摄药品包装，系统自动提取药名、剂量、频次与服用时机。</p>
            </div>
            <button
              onClick={handleChooseImage}
              disabled={recognizing || submitting}
              className={cn(
                'px-4 py-2 rounded-2xl text-sm font-bold transition-all',
                recognizing ? 'bg-orange-200 text-white' : 'bg-orange-500 text-white shadow-lg shadow-orange-100'
              )}
            >
              {recognizing ? '识别中...' : packageImage ? '重新拍摄' : '上传识别'}
            </button>
          </div>
          {packageImage ? (
            <div className="mt-4 rounded-[20px] overflow-hidden border border-orange-100 bg-white">
              <img src={packageImage} alt="药品包装" className="w-full h-44 object-cover" />
            </div>
          ) : null}
          {ocrText ? (
            <div className="mt-3 rounded-2xl bg-white/80 border border-orange-100 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">OCR 摘要</p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{ocrText}</p>
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">药品名称</label>
          <input
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            placeholder="例如：氨氯地平"
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {['降压药', '降脂药', '降糖药', '止痛药', '消炎药', '维生素'].map((t) => (
              <button key={t} onClick={() => setMedName(t)} className="px-3 py-1.5 rounded-xl text-xs border border-gray-100 bg-gray-50 text-gray-500 active:bg-gray-100">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">用量</label>
          <input
            value={medDose}
            onChange={(e) => setMedDose(e.target.value)}
            placeholder="例如：5mg/片，每次1片"
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">用药频次</label>
          <input
            value={medFrequency}
            onChange={(e) => setMedFrequency(e.target.value)}
            placeholder="例如：每日1次"
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">用药时间</label>
          <div className="grid grid-cols-3 gap-3">
            {['早餐后', '午餐后', '晚餐后', '睡前', '空腹', '饭前', '请遵医嘱'].map((t) => (
              <button
                key={t}
                onClick={() => setMedTime(t)}
                className={cn(
                  'py-3 rounded-2xl text-sm font-medium border-2 transition-all',
                  medTime === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50/80 text-gray-500'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!medName.trim() || submitting}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold transition-all',
            medName.trim() && !submitting
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400'
          )}
        >
          {submitting ? '保存中...' : medication ? '保存修改' : '保存药品'}
        </button>
        {medication ? (
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="w-full py-3 rounded-2xl text-sm font-bold border border-red-100 text-red-500 bg-red-50"
          >
            删除药品
          </button>
        ) : null}
      </div>
    </BottomSheet>
  );
}

function AddConditionSheet({
  open,
  onClose,
  type,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  type: 'disease' | 'surgery';
  onSaved?: () => void;
}) {
  const [name, setName] = useState('');
  const [diagnosedDate, setDiagnosedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setDiagnosedDate('');
      setNotes('');
      setSubmitting(false);
    }
  }, [open]);

  const presets =
    type === 'surgery'
      ? ['胆囊切除术', '胃息肉切除术', '阑尾切除术', '髋关节置换术']
      : ['高血压', '高血脂', '糖尿病', '痛风', '冠心病'];

  const handleSave = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addHealthCondition({
        conditionName: name.trim(),
        conditionType: type,
        diagnosedDate: diagnosedDate || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved?.();
      onClose();
    } catch (e) {
      console.error('Failed to add condition:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={type === 'surgery' ? '添加手术记录' : '增加健康状况'}>
      <div className="p-5 space-y-5">
        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">
            {type === 'surgery' ? '手术名称' : '健康状况'}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'surgery' ? '例如：胆囊切除术' : '例如：高血压'}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {presets.map((item) => (
              <button
                key={item}
                onClick={() => setName(item)}
                className="px-3 py-1.5 rounded-xl text-xs border border-gray-100 bg-gray-50 text-gray-500 active:bg-gray-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">发生时间</label>
          <input
            type="date"
            value={diagnosedDate}
            onChange={(e) => setDiagnosedDate(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-500 block mb-2">备注</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={type === 'surgery' ? '例如：术后恢复中，需要低脂饮食' : '例如：长期服药控制中'}
            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none h-24"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || submitting}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold transition-all',
            name.trim() && !submitting ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]' : 'bg-gray-100 text-gray-400'
          )}
        >
          {submitting ? '保存中...' : '保存记录'}
        </button>
      </div>
    </BottomSheet>
  );
}

// --- Edit Preferences Modal ---
function EditPreferencesSheet({
  open,
  onClose,
  initialData,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: { tastePreferences: string[]; likedFoods: string[]; dislikedFoods: string[] };
  onSaved?: () => void;
}) {
  const [taste, setTaste] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTaste(initialData.tastePreferences || []);
      setLiked(initialData.likedFoods || []);
      setDisliked(initialData.dislikedFoods || []);
    }
  }, [initialData]);

  const toggleItem = (list: string[], setter: (v: string[]) => void, item: string) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updatePreferencesApi({ tastePreferences: taste, likedFoods: liked, dislikedFoods: disliked });
      onSaved?.();
      onClose();
    } catch (e) {
      console.error('Failed to update preferences:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="编辑饮食偏好">
      <div className="p-5 space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">口味偏好</p>
          <div className="flex flex-wrap gap-2">
            {['清淡', '少盐', '少糖', '少油', '微辣', '软烂', '温热'].map((t) => (
              <button
                key={t}
                onClick={() => toggleItem(taste, setTaste, t)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                  taste.includes(t) ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50 text-gray-500'
                )}
              >
                {taste.includes(t) && <Check className="w-3 h-3 inline mr-1" />}{t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">喜欢的食物</p>
          <div className="flex flex-wrap gap-2">
            {['小米粥', '鸡蛋羹', '清蒸鱼', '豆腐', '面条', '馒头', '蔬菜汤', '水果'].map((f) => (
              <button
                key={f}
                onClick={() => toggleItem(liked, setLiked, f)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                  liked.includes(f) ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50 text-gray-500'
                )}
              >
                {liked.includes(f) ? <ThumbsUp className="w-3 h-3 inline mr-1" /> : null}{f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">忌口食物</p>
          <div className="flex flex-wrap gap-2">
            {['红烧肉', '辣椒', '油炸食品', '冰饮', '生冷食物', '酒精', '咖啡', '甜品'].map((f) => (
              <button
                key={f}
                onClick={() => toggleItem(disliked, setDisliked, f)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                  disliked.includes(f) ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-100 bg-gray-50 text-gray-500'
                )}
              >
                {disliked.includes(f) ? <ThumbsDown className="w-3 h-3 inline mr-1" /> : null}{f}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={submitting}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold shadow-lg shadow-indigo-200 active:scale-[0.98]',
            submitting ? 'bg-indigo-400 text-white/80' : 'bg-indigo-600 text-white'
          )}
        >
          {submitting ? '保存中...' : '保存偏好'}
        </button>
      </div>
    </BottomSheet>
  );
}

// --- Edit Medical Orders Modal ---
function EditMedicalOrderSheet({
  open,
  onClose,
  order,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  order?: {
    id: string;
    content: string;
    doctorName: string;
    hospitalName?: string;
    visitDate?: string;
    originalImage?: string;
  };
  onSaved?: () => void;
}) {
  const [preview, setPreview] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setProcessing(false);
      setSubmitting(false);
      return;
    }

    if (order) {
      setPreview({
        content: order.content || '',
        doctorName: order.doctorName || '',
        hospitalName: order.hospitalName || '',
        visitDate: order.visitDate || '',
        originalImage: order.originalImage || '',
      });
    } else {
      setPreview(null);
    }
  }, [open, order?.id]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProcessing(true);
      const imageData = await fileToDataUrl(file);
      const result = await scanMedicalOrderImage(imageData, order?.id);
      setPreview(result);
    } catch (e) {
      console.error('Failed to scan medical order:', e);
      window.alert('纸质医嘱识别失败，请重试');
    } finally {
      setProcessing(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!preview || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        content: preview.content || '未识别到清晰医嘱内容',
        doctorName: preview.doctorName || '待确认医生',
        hospitalName: preview.hospitalName || '待确认医院',
        visitDate: preview.visitDate || new Date().toISOString().slice(0, 10),
        originalImage: preview.originalImage || undefined,
        rawOcrText: preview.rawOcrText || undefined,
      };
      if (order?.id) {
        await updateMedicalOrderApi(order.id, payload);
      } else {
        await createMedicalOrderApi(payload);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error('Failed to save medical order:', e);
      window.alert('医嘱保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={order ? '重拍医嘱' : '拍照添加医嘱'}>
      <div className="p-5 space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="rounded-[24px] border border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,1))] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900">仅支持拍纸质医嘱</p>
              <p className="text-xs text-gray-500 mt-1">系统会自动识别医嘱内容、主治医生、医院和就诊时间，不支持手动录入。</p>
            </div>
            <button
              onClick={handlePickImage}
              disabled={processing}
              className={cn(
                'px-4 py-2 rounded-2xl text-sm font-bold transition-all',
                processing ? 'bg-emerald-200 text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
              )}
            >
              {processing ? '识别中...' : preview?.originalImage ? '重新拍摄' : '上传识别'}
            </button>
          </div>
          {preview?.originalImage ? (
            <div className="mt-4 rounded-[20px] overflow-hidden border border-emerald-100 bg-white">
              <img src={preview.originalImage} alt="纸质医嘱" className="w-full h-44 object-cover" />
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-gray-50/80 p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-500 block mb-2">识别出的医嘱内容</label>
            <div className="min-h-28 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {preview?.content || '上传纸质医嘱后，这里会展示识别结果。'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-bold text-gray-400 mb-1">主治医生</p>
              <p className="text-sm font-semibold text-gray-800">{preview?.doctorName || '待识别'}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-bold text-gray-400 mb-1">医院</p>
              <p className="text-sm font-semibold text-gray-800">{preview?.hospitalName || '待识别'}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-bold text-gray-400 mb-1">就诊时间</p>
              <p className="text-sm font-semibold text-gray-800">{preview?.visitDate || '待识别'}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">识别结果需要您确认后才会回填保存；每次重新拍照都会覆盖当前预览结果。</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!preview || submitting}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold shadow-lg shadow-indigo-200 active:scale-[0.98]',
            !preview || submitting ? 'bg-indigo-400 text-white/80' : 'bg-indigo-600 text-white'
          )}
        >
          {submitting ? '保存中...' : order ? '确认并更新医嘱' : '确认回填医嘱'}
        </button>
      </div>
    </BottomSheet>
  );
}

// ========== SCREENS ==========

const HomeScreen = ({
  onTabChange,
  elderMode,
  onOpenElderMode,
}: {
  onTabChange: (tab: string) => void;
  elderMode: boolean;
  onOpenElderMode: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [trendData, setTrendData] = useState<{ day: string; score: number }[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [stats, setStats] = useState({ avgScore: 0, maxScore: 0, minScore: 0 });
  const [patientName, setPatientName] = useState('');

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [showWeekly, setShowWeekly] = useState(false);

  useEffect(() => {
    fetchDashboard()
      .then((data: any) => {
        setPatientName(data.patient?.name || '');
        setHealthScore(data.healthScore || 0);
        setMeals((data.meals || []).map(mapApiMealToMeal));
        setAlerts(data.alerts || []);
        setChats(data.conversations || []);
        setTrendData(
          (data.trendData || []).map((d: any) => ({ day: formatTrendDay(d.date), score: d.score }))
        );
        setStats(data.stats || { avgScore: 0, maxScore: 0, minScore: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

        <div className="relative z-10 flex items-end justify-between mt-3">
          <div>
            <p className="text-white/60 text-xs mb-1">今日健康指数</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white tracking-tight">{healthScore}</span>
              <span className="text-lg text-white/70">分</span>
            </div>
            <p className="text-white/50 text-xs mt-1">较昨日 +3分 ↑</p>
          </div>
          <div className="bg-white/12 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/15">
            <p className="text-xs text-white/60">今日节气</p>
            <p className="text-sm font-bold text-white">立冬 · 宜温补</p>
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
                  <button
                    onClick={() => setSelectedAlert(primaryAlert)}
                    className="flex-1 rounded-2xl bg-[#8f4b06] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(122,63,0,0.22)] transition active:scale-[0.98]"
                  >
                    立即查看原因
                  </button>
                  <button
                    onClick={() => {
                      const warningMeal = meals.find((meal) => meal.isWarning) || meals[0];
                      if (warningMeal) setSelectedMeal(warningMeal);
                    }}
                    className="flex-1 rounded-2xl border border-[#efc777] bg-white/75 px-4 py-3 text-sm font-bold text-[#8f4b06] transition hover:bg-white"
                  >
                    去看今日饮食
                  </button>
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

        {/* Today's Diet */}
        <section className="bg-white rounded-[22px] p-5">
          <div className={cn('mb-4', elderMode ? 'space-y-3' : 'flex justify-between items-center')}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">今日饮食</h3>
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

          {meals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无饮食记录</p>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div key={meal.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">
                        {getMealLabel(meal.type)} ({meal.time})
                      </span>
                      {meal.isWarning && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <button onClick={() => setSelectedMeal(meal)} className="text-sm text-indigo-600 font-medium">
                      查看详情
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {meal.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl">
                        <span className="text-sm">{item}</span>
                        {meal.isWarning ? (
                          <span className="text-xs text-red-500 font-bold">⚠</span>
                        ) : (
                          <Check className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3" /> 语音录入
                    </span>
                    <span className={cn('font-bold', meal.isWarning ? 'text-red-500' : 'text-emerald-600')}>
                      {meal.calories} kcal
                    </span>
                  </div>
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

        {/* Latest Conversation */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">最新对话</h3>
            </div>
            <button onClick={() => onTabChange('log')} className="text-sm text-indigo-600 font-medium">
              查看全部对话 ▶
            </button>
          </div>
          {chats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无对话记录</p>
          ) : (
            <div className="space-y-3">
              {chats.slice(0, 4).map((chat) => (
                <div key={chat.id} className="py-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">{chat.timestamp}</span>
                    <span className={cn('text-xs font-bold', chat.role === 'user' ? 'text-gray-500' : 'text-indigo-500')}>
                      {chat.role === 'user' ? '老人' : '小爱'}
                    </span>
                  </div>
                  <p className={cn('text-sm leading-relaxed', chat.role === 'user' ? 'text-gray-800' : 'text-gray-500')}>
                    {chat.content}
                  </p>
                </div>
              ))}
            </div>
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
    </div>
  );
};

// --- Log Screen ---

const LogScreen = () => {
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);
  const [dateIndex, setDateIndex] = useState(0);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  useEffect(() => {
    fetchConversationDates()
      .then((d: string[]) => {
        const sortedDates = (d || []).sort();
        setDates(sortedDates);
        setDateIndex(Math.max(0, sortedDates.length - 1));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (dates.length === 0) return;
    setChatsLoading(true);
    fetchConversationLogs(dates[dateIndex])
      .then((logs: any[]) => {
        setChats(
          (logs || []).map((log: any) => ({
            id: String(log.id),
            role: log.role,
            content: log.content,
            timestamp: log.timestamp,
            extra: log.extra || undefined,
          }))
        );
      })
      .catch(() => setChats([]))
      .finally(() => setChatsLoading(false));
  }, [dates, dateIndex]);

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
          <h1 className="text-xl font-bold text-white">对话记录</h1>
          <div className="flex gap-1">
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"><Search className="w-5 h-5" /></button>
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

      {dates.length > 0 && (
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
        {dates.length > 0 && (
          <div className="flex justify-center">
            <span className="bg-gray-100 text-gray-400 text-xs px-3 py-1 rounded-full">
              {isToday ? '今天 ' : ''}{currentYear}年{currentDateLabel}
            </span>
          </div>
        )}

        {chatsLoading ? (
          <LoadingSpinner />
        ) : chats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">暂无对话记录</p>
        ) : (
          chats.map((chat) => (
            <div key={chat.id} className={cn('flex items-start gap-3', chat.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn(
                'w-9 h-9 rounded-full shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center',
                chat.role === 'user' ? 'bg-gray-200' : 'bg-indigo-100'
              )}>
                {chat.role === 'user' ? (
                  <img src="https://picsum.photos/seed/elderly/100/100" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className={cn('flex flex-col max-w-[78%]', chat.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'px-4 py-3 rounded-[20px] text-sm leading-relaxed shadow-sm',
                  chat.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-md' : 'bg-white text-gray-800 rounded-tl-md'
                )}>
                  {chat.content}
                </div>
                {chat.extra && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'mt-2 p-3.5 rounded-2xl border w-full shadow-sm',
                      chat.extra.type === 'alert' ? 'bg-red-50/70 border-red-100' : 'bg-emerald-50/70 border-emerald-100'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {chat.extra.type === 'alert' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className={cn('text-sm font-bold', chat.extra.type === 'alert' ? 'text-red-600' : 'text-emerald-700')}>
                        {chat.extra.title}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{chat.extra.text}</p>
                    {chat.extra.items && (
                      <ul className="mt-2 space-y-1">
                        {chat.extra.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0" />{item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
                <span className="text-xs text-gray-400 mt-1 px-1">{chat.timestamp}</span>
              </div>
            </div>
          ))
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

const SettingsScreen = ({
  elderMode,
  onElderModeChange,
}: {
  elderMode: boolean;
  onElderModeChange: (value: boolean) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [conditions, setConditions] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [medicalOrders, setMedicalOrders] = useState<any[]>([]);

  const [isSpeakerBound, setIsSpeakerBound] = useState(true);
  const [showAddMed, setShowAddMed] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddSurgery, setShowAddSurgery] = useState(false);
  const [showEditPrefs, setShowEditPrefs] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([
      fetchPatientProfile().catch(() => null),
      fetchHealthConditions().catch(() => []),
      fetchMedications().catch(() => []),
      fetchPreferences().catch(() => null),
      fetchMedicalOrders().catch(() => []),
    ])
      .then(([p, c, m, pref, o]) => {
        setProfile(p);
        setConditions(c || []);
        setMedications(m || []);
        setPreferences(pref);
        setMedicalOrders(o || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const activeOrder = medicalOrders[0];
  const diseaseConditions = conditions.filter((c: any) => (c.conditionType || c.condition_type) !== 'surgery');
  const surgeryConditions = conditions.filter((c: any) => (c.conditionType || c.condition_type) === 'surgery');

  const handleRemoveCondition = async (item: any) => {
    if (!window.confirm(`确认删除“${item.conditionName || item.condition_name}”吗？`)) return;
    try {
      await removeHealthCondition(String(item.id));
      loadData();
    } catch (e) {
      console.error('Failed to remove condition:', e);
    }
  };

  const openImagePreview = (title: string, image?: string | null) => {
    if (!image) return;
    setPreviewTitle(title);
    setPreviewImage(image);
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
      <header className="relative bg-gradient-to-br from-violet-500 to-purple-600 px-5 pt-safe pb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="absolute top-0 right-0 w-44 h-44" viewBox="0 0 100 100" fill="none">
            <circle cx="80" cy="20" r="30" stroke="white" strokeWidth="1.5" />
            <circle cx="80" cy="20" r="18" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between py-3">
          <h1 className="text-xl font-bold text-white">个人中心</h1>
          <button
            onClick={() => onElderModeChange(!elderMode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border transition-all',
              elderMode
                ? 'bg-emerald-400/25 text-emerald-100 border-emerald-300/40'
                : 'bg-white/15 text-white/80 border-white/25'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            阅读模式
          </button>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 mt-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 overflow-hidden border-2 border-white/25 shrink-0">
              <img src="https://picsum.photos/seed/elderly/100/100" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-lg font-bold">{profile?.name || '加载中'}</p>
              <p className="text-white/60 text-sm truncate">
                {profile ? `${profile.age || ''}岁 · ${profile.gender === 'female' ? '女' : profile.gender === 'male' ? '男' : ''}` : ''}
                {conditions.length > 0 ? ` · ${conditions.map((c: any) => c.conditionName || c.condition_name).join('、')}` : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white/50 text-xs">健康档案</p>
              <p className="text-white font-bold text-sm">完整度 85%</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 -mt-2">
        {/* Device Binding */}
        <details className="group bg-white rounded-[22px] shadow-sm overflow-hidden">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isSpeakerBound ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400')}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">小爱音箱</h3>
                <p className={cn('text-xs mt-0.5', isSpeakerBound ? 'text-emerald-500' : 'text-gray-400')}>
                  {isSpeakerBound ? '已连接' : '未绑定'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="px-4 pb-4 border-t border-gray-50">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', isSpeakerBound ? 'bg-emerald-400' : 'bg-gray-300')} />
                <span className="text-sm text-gray-600">{isSpeakerBound ? '客厅音箱' : '暂无设备'}</span>
              </div>
              <button
                onClick={() => setIsSpeakerBound(!isSpeakerBound)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  isSpeakerBound ? 'bg-gray-100 text-gray-500' : 'bg-indigo-600 text-white'
                )}
              >
                {isSpeakerBound ? '解绑' : '绑定'}
              </button>
            </div>
          </div>
        </details>

        {/* Health Records */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-base text-gray-800">健康档案</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">健康状况</label>
              <div className="flex flex-wrap gap-2">
                {diseaseConditions.length > 0 ? diseaseConditions.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => handleRemoveCondition(c)}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium border border-indigo-400 bg-indigo-50 text-indigo-700"
                  >
                    {c.conditionName || c.condition_name} <span className="ml-1 text-indigo-400">×</span>
                  </button>
                )) : (
                  <span className="text-sm text-gray-400">暂无记录</span>
                )}
                <button
                  onClick={() => setShowAddCondition(true)}
                  className="px-3 py-1.5 rounded-xl text-sm border border-dashed border-gray-300 text-gray-400"
                >
                  + 其他
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">手术史</label>
              <div className="space-y-2">
                {surgeryConditions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-bold text-rose-700">{c.conditionName || c.condition_name}</span>
                    </div>
                    <button onClick={() => handleRemoveCondition(c)}>
                      <X className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ))}
                {surgeryConditions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">暂无手术记录</p>
                ) : null}
                <button
                  onClick={() => setShowAddSurgery(true)}
                  className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 添加手术记录
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Medication */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Pill className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-base text-gray-800">用药管理</h2>
          </div>
          <div className="space-y-3">
            {medications.map((med: any) => (
              <div key={med.id} className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">{med.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{med.dosage} · {med.timing}</p>
                  <p className="text-xs text-gray-400 mt-1">{med.frequency || '每日1次'}</p>
                  {med.packageImage || med.package_image ? (
                    <button
                      onClick={() => openImagePreview(`${med.name} 原图`, med.packageImage || med.package_image)}
                      className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-orange-600 border border-orange-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> 查看原图
                    </button>
                  ) : null}
                </div>
                <button onClick={() => { setEditingMedication(med); setShowAddMed(true); }}>
                  <Edit2 className="w-4 h-4 text-orange-400" />
                </button>
              </div>
            ))}
            {medications.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">暂无用药记录</p>
            )}
            <button
              onClick={() => setShowAddMed(true)}
              className="w-full py-3 border border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 flex items-center justify-center gap-1 hover:border-indigo-200 hover:text-indigo-500 transition"
            >
              <Plus className="w-3 h-3" /> 添加药品
            </button>
          </div>
        </section>

        {/* Medical Orders */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Stethoscope className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-base text-gray-800">医嘱信息</h2>
          </div>
          <div className="space-y-3">
            {activeOrder ? (
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-sm text-emerald-800 leading-relaxed">
                  "{activeOrder.content}"
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div className="rounded-2xl bg-white/80 border border-emerald-100 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400">主治医生</p>
                    <p className="text-sm font-semibold text-emerald-700 mt-1">{activeOrder.doctorName || activeOrder.doctor_name || '待识别'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 border border-emerald-100 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400">医院 / 就诊时间</p>
                    <p className="text-sm font-semibold text-emerald-700 mt-1">
                      {activeOrder.hospitalName || activeOrder.hospital_name || '待识别医院'}
                      {' · '}
                      {activeOrder.visitDate || activeOrder.visit_date || activeOrder.orderDate || activeOrder.order_date || '待识别日期'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-emerald-100/50">
                  <button
                    onClick={() => openImagePreview('医嘱原件', activeOrder.originalImage || activeOrder.original_image)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> 查看医嘱原件
                  </button>
                  <span className="text-xs text-gray-400">
                    更新于 {new Date(activeOrder.updatedAt || activeOrder.updated_at || activeOrder.createdAt || activeOrder.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">暂无医嘱</p>
            )}
            <button
              onClick={() => setShowEditOrder(true)}
              className="w-full py-3 border border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 flex items-center justify-center gap-1 hover:border-indigo-200 hover:text-indigo-500 transition"
            >
              <Edit2 className="w-3 h-3" /> {activeOrder ? '修改医嘱' : '添加医嘱'}
            </button>
          </div>
        </section>

        {/* Authorization Management */}
        <AuthorizationManagement />

        {/* Preferences */}
        <section className="bg-white rounded-[22px] p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
            <Utensils className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-base text-gray-800">偏好配置</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">口味偏好</span>
              <div className="flex gap-2">
                {(preferences?.tastePreferences || []).length > 0 ? (
                  (preferences.tastePreferences as string[]).map((t: string) => (
                    <span key={t} className="px-2.5 py-1 bg-gray-50 text-gray-500 text-sm rounded-lg border border-gray-100">{t}</span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">未设置</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">喜欢的食物</span>
              <span className="text-sm text-gray-400">
                {(preferences?.likedFoods || []).join('、') || '未设置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">忌口食物</span>
              <span className="text-sm text-red-500 font-bold">
                {(preferences?.dislikedFoods || []).join('、') || '未设置'}
              </span>
            </div>
            <button
              onClick={() => setShowEditPrefs(true)}
              className="w-full py-3 bg-gray-50 rounded-2xl text-sm text-indigo-600 font-bold hover:bg-indigo-50 transition"
            >
              修改偏好
            </button>
          </div>
        </section>

        <button className="w-full py-4 text-red-400 font-bold text-sm bg-white rounded-[22px] shadow-sm border border-red-50 active:bg-red-50 transition">
          退出登录
        </button>
      </main>

      <AddConditionSheet open={showAddCondition} onClose={() => setShowAddCondition(false)} type="disease" onSaved={loadData} />
      <AddConditionSheet open={showAddSurgery} onClose={() => setShowAddSurgery(false)} type="surgery" onSaved={loadData} />
      <AddMedicationSheet
        open={showAddMed}
        onClose={() => { setShowAddMed(false); setEditingMedication(null); }}
        onCreated={loadData}
        medication={editingMedication ? {
          id: String(editingMedication.id),
          name: editingMedication.name,
          dosage: editingMedication.dosage,
          frequency: editingMedication.frequency,
          timing: editingMedication.timing,
          packageImage: editingMedication.packageImage || editingMedication.package_image,
          ocrText: editingMedication.ocrText || editingMedication.ocr_text,
        } : undefined}
      />
      <EditPreferencesSheet open={showEditPrefs} onClose={() => setShowEditPrefs(false)} initialData={preferences} onSaved={loadData} />
      <EditMedicalOrderSheet
        open={showEditOrder}
        onClose={() => setShowEditOrder(false)}
        order={activeOrder ? {
          id: String(activeOrder.id),
          content: activeOrder.content,
          doctorName: activeOrder.doctorName || activeOrder.doctor_name || '',
          hospitalName: activeOrder.hospitalName || activeOrder.hospital_name || '',
          visitDate: activeOrder.visitDate || activeOrder.visit_date || '',
          originalImage: activeOrder.originalImage || activeOrder.original_image || '',
        } : undefined}
        onSaved={loadData}
      />
      <ImagePreviewDialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title={previewTitle}
        image={previewImage}
      />
    </div>
  );
};

// --- Report Screen ---

const ReportScreen = () => {
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

// ========== MAIN APP ==========

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [elderMode, setElderMode] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMealEntry, setShowMealEntry] = useState(false);
  const [showNoteEntry, setShowNoteEntry] = useState(false);
  const [showShareReport, setShowShareReport] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = elderMode ? '17px' : '16px';
    return () => { document.documentElement.style.fontSize = '16px'; };
  }, [elderMode]);

  useEffect(() => { setShowQuickActions(false); }, [activeTab]);

  return (
    <div className={cn('h-screen flex flex-col overflow-hidden bg-brand-bg font-sans', elderMode && 'elder-mode')}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {activeTab === 'home' && (
            <HomeScreen onTabChange={setActiveTab} elderMode={elderMode} onOpenElderMode={() => setElderMode((p) => !p)} />
          )}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'log' && <LogScreen />}
          {activeTab === 'settings' && <SettingsScreen elderMode={elderMode} onElderModeChange={setElderMode} />}
        </motion.div>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} elderMode={elderMode} />

      {/* FAB */}
      {(activeTab === 'home' || activeTab === 'log') && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowQuickActions((p) => !p)}
            className={cn(
              'fixed right-5 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-200/50 z-50 active:scale-90 transition-transform',
              elderMode ? 'bottom-28 p-5' : 'bottom-24 p-4'
            )}
          >
            <Plus className={cn('w-6 h-6 transition-transform duration-200', showQuickActions && 'rotate-45')} />
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  className={cn('fixed right-5 z-50 w-56', elderMode ? 'bottom-52' : 'bottom-44')}
                >
                  <div className="bg-white border border-gray-100 rounded-[22px] shadow-2xl shadow-gray-200/50 p-2 space-y-1">
                    {[
                      { icon: Utensils, label: '手动补录饮食', action: () => { setShowQuickActions(false); setShowMealEntry(true); } },
                      { icon: Edit2, label: '添加特殊备注', action: () => { setShowQuickActions(false); setShowNoteEntry(true); } },
                      { icon: Share2, label: '分享报告给家人', action: () => { setShowQuickActions(false); setShowShareReport(true); } },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-800 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <item.icon className="w-4 h-4 text-indigo-500" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Global Modals */}
      <MealEntrySheet open={showMealEntry} onClose={() => setShowMealEntry(false)} />
      <NoteEntrySheet open={showNoteEntry} onClose={() => setShowNoteEntry(false)} />
      <ShareReportDialog open={showShareReport} onClose={() => setShowShareReport(false)} />
    </div>
  );
}
