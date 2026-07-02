import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Droplets,
  Edit2,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Stethoscope,
  ThumbsDown,
  ThumbsUp,
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
import { cn } from '../lib/utils';
import { BottomSheet, CenterDialog, LoadingSpinner } from './ui';
import {
  FOOD_LIBRARY,
  fileToDataUrl,
  getVitalTone,
  formatMeasuredTime,
  formatDateLabel,
  formatChatTimestamp,
  translateFoodName,
} from '../utils';
import type { VitalSummary, VitalSummaryItem } from '../types/app';
import {
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
  fetchVitalMeasurements,
  fetchTimeline,
} from '../api';

export function MealEntrySheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const resetAndClose = () => {
    setStep(1);
    setSelectedFoods([]);
    setNote('');
    setSubmitMessage('');
    setSubmitError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');
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
      setSubmitMessage('补录成功，首页饮食记录已更新');
      onSaved?.();
      window.setTimeout(resetAndClose, 600);
    } catch (e) {
      console.error('Failed to create meal:', e);
      setSubmitError(e instanceof Error ? e.message : '补录失败，请稍后重试');
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
          {(submitMessage || submitError) && (
            <div
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-bold',
                submitError ? 'border border-red-100 bg-red-50 text-red-600' : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
              )}
            >
              {submitError || submitMessage}
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

// --- Note Entry Modal ---
export function NoteEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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
export function ShareReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
export function WeeklyViewSheet({ open, onClose, trendData }: { open: boolean; onClose: () => void; trendData: { day: string; score: number }[] }) {
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
export function AddMedicationSheet({
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

export function AddConditionSheet({
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
export function EditPreferencesSheet({
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
export function EditMedicalOrderSheet({
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

export function VitalSignsSheet({
  open,
  onClose,
  summary,
}: {
  open: boolean;
  onClose: () => void;
  summary: VitalSummary | null;
}) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<VitalSummaryItem[]>([]);
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30>(14);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchVitalMeasurements({ days: selectedDays })
      .then((data: VitalSummaryItem[]) => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [open, selectedDays]);

  const latestCards = [summary?.latestBloodPressure, summary?.latestBloodGlucose].filter(Boolean) as VitalSummaryItem[];

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 按日期分组记录
  const groupedRecords = records.reduce((acc, item) => {
    const date = item.measuredAt?.split('T')[0] || 'unknown';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, VitalSummaryItem[]>);

  // 按日期倒序排序
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天';
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (dateTime?: string): string => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="血压血糖">
      <div className="p-5 space-y-5">
        <div className="rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">附属健康指标</p>
            <button
              type="button"
              onClick={scrollToHistory}
              className="shrink-0 flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2.5 text-indigo-700 hover:bg-indigo-100 active:scale-[0.98] transition"
            >
              <span className="whitespace-nowrap text-xs font-bold">
                {selectedDays === 7 ? '近一周记录' : selectedDays === 30 ? '近一月记录' : '近两周记录'}
              </span>
              <span className="text-lg font-black">{records.length}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {latestCards.length > 0 ? latestCards.map((item) => {
            const tone = getVitalTone(item.status);
            const isPressure = item.metricType === 'blood_pressure';
            return (
              <div key={item.metricType} className={cn('rounded-[24px] border p-4', tone.card)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', isPressure ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-500')}>
                        {isPressure ? <Heart className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{isPressure ? '最近一次血压' : '最近一次血糖'}</p>
                        <p className="text-xs text-gray-500">{formatMeasuredTime(item.measuredAt)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end gap-2">
                      <span className={cn('text-3xl font-black tracking-tight', tone.text)}>{item.value}</span>
                      <span className="pb-1 text-sm font-semibold text-gray-400">{item.unit}</span>
                    </div>
                    {!isPressure ? (
                      <>
                        <p className="mt-1 text-xs text-gray-500">测量场景：{item.glucoseContextLabel || '未标注'}</p>
                        {item.hasFollowUpInfo && item.followUpInfo ? (
                          <p className="mt-1.5 rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                            补录信息：{item.followUpInfo.replace(/^补录[:：]\s*/, '')}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold', tone.pill)}>{tone.badge}</span>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
              <p className="text-sm font-bold text-gray-700">还没有血压血糖记录</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">老人如果对小爱说“我刚量了血压 128/76，空腹血糖 6.2”，系统会自动帮你留档。</p>
            </div>
          )}
        </div>

        <div ref={historyRef} className="rounded-[24px] border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">语音上报历史</p>
            <div className="flex gap-1.5">
              {[
                { label: '1周', value: 7 },
                { label: '2周', value: 14 },
                { label: '1月', value: 30 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedDays(opt.value as 7 | 14 | 30)}
                  className={cn(
                    'rounded-xl px-2.5 py-1 text-xs font-bold transition-all',
                    selectedDays === opt.value
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">加载中...</p>
          ) : records.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">最近还没有同步到测量记录</p>
          ) : (
            <div className="space-y-2.5">
              {sortedDates.map((date) => {
                const dayRecords = groupedRecords[date];
                const isExpanded = expandedDays.has(date);
                const bpCount = dayRecords.filter((r) => r.metricType === 'blood_pressure').length;
                const bgCount = dayRecords.filter((r) => r.metricType === 'blood_glucose').length;
                const recordCountText = [bpCount > 0 && `血压${bpCount}`, bgCount > 0 && `血糖${bgCount}`]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <div key={date} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleDay(date)}
                      className="w-full flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/90 px-4 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-gray-500">{formatDateLabel(date)}</span>
                        <span className="text-xs text-gray-400">{recordCountText}</span>
                      </div>
                      <ChevronDown
                        className={cn('h-4 w-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
                      />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-2 pb-2">
                            {dayRecords.map((item, index) => {
                              const tone = getVitalTone(item.status);
                              const isPressure = item.metricType === 'blood_pressure';
                              return (
                                <div
                                  key={`${item.metricType}-${item.measuredAt}-${index}`}
                                  className="mb-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isPressure ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-500')}>
                                        {isPressure ? <Heart className="h-3.5 w-3.5" /> : <Droplets className="h-3.5 w-3.5" />}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium text-gray-600">
                                          {isPressure ? '血压' : `血糖${item.glucoseContextLabel ? `·${item.glucoseContextLabel}` : ''}`}
                                        </span>
                                        <span className="text-[11px] text-gray-400">{formatTime(item.measuredAt)}</span>
                                        {!isPressure && item.hasFollowUpInfo && item.followUpInfo ? (
                                          <span className="mt-1 inline-flex rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                                            补录：{item.followUpInfo.replace(/^补录[:：]\s*/, '')}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-sm font-bold text-gray-900', tone.text)}>
                                        {item.value}{isPressure ? '' : ` ${item.unit}`}
                                      </span>
                                      <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', tone.pill)}>
                                        {tone.badge}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}


export function RecordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);
  const [dateIndex, setDateIndex] = useState(0);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'byDate'>('byDate');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchTimeline(undefined, 1000)
      .then((items: any[]) => {
        const allDates = Array.from(new Set((items || []).map((it: any) => it.logDate).filter(Boolean))).sort();
        setDates(allDates);
        setDateIndex(Math.max(0, allDates.length - 1));
        setTimelineItems(items || []);
      })
      .catch(() => {
        setDates([]);
        setTimelineItems([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || dates.length === 0) return;
    setLoading(true);
    const dateParam = viewMode === 'byDate' ? dates[dateIndex] : undefined;
    const limitParam = viewMode === 'all' ? 1000 : undefined;
    fetchTimeline(dateParam, limitParam)
      .then((items: any[]) => setTimelineItems(items || []))
      .catch(() => setTimelineItems([]))
      .finally(() => setLoading(false));
  }, [open, dates, dateIndex, viewMode]);

  return (
    <BottomSheet open={open} onClose={onClose} title="今日记录">
      <div className="p-5 space-y-4">
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

        {viewMode === 'byDate' && dates.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <button onClick={() => setDateIndex((i) => Math.max(0, i - 1))} disabled={dateIndex === 0} className="p-2 text-gray-400 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{dates[dateIndex] ? formatDateLabel(dates[dateIndex]) : '暂无日期'}</p>
              <p className="text-xs text-gray-400">{dates[dateIndex] || ''}</p>
            </div>
            <button onClick={() => setDateIndex((i) => Math.min(dates.length - 1, i + 1))} disabled={dateIndex === dates.length - 1} className="p-2 text-gray-400 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">加载中...</p>
        ) : timelineItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">暂无记录</p>
        ) : (
          <div className="space-y-3">
            {timelineItems.map((item: any) => {
              const timeLabel = viewMode === 'all'
                ? formatChatTimestamp(item.logDate, item.timestamp)
                : (item.timestamp || '').slice(0, 5);

              if (item.type === 'meal') {
                return (
                  <div key={item.id} className="rounded-[20px] border border-amber-100 bg-[linear-gradient(135deg,#fffbf0_0%,#fff7e6_100%)] p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold text-amber-800">{item.data?.mealType || '饮食记录'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{timeLabel}</span>
                    </div>
                    <p className="text-sm text-gray-700">{item.data?.foodNames || '暂无食物记录'}</p>
                  </div>
                );
              }

              if (item.type === 'vital') {
                const isPressure = item.data?.metricType === 'blood_pressure';
                const fallbackFollowUp = [item.data?.notes, item.data?.sourceText]
                  .filter((text: any) => typeof text === 'string' && /补录|服药|吃药|未服|漏服|场景|餐后|空腹|睡前|随机|降糖药|降压药/.test(text))
                  .map((text: string) => text.replace(/\[(追问)?补录\]/g, '').trim())
                  .filter(Boolean)
                  .join('；');
                const followUpText = (item.data?.followUpInfo || fallbackFollowUp || '').replace(/^补录[:：]\s*/, '');
                return (
                  <div key={item.id} className="rounded-[20px] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-800">
                        {item.data?.label || '指标记录'}
                        {!isPressure && item.data?.contextLabel ? ` · ${item.data.contextLabel}` : ''}
                      </span>
                      <span className="text-xs text-gray-400">{timeLabel}</span>
                    </div>
                    <p className="text-sm text-gray-700">{item.data?.value} {item.data?.unit || ''}</p>
                    {!isPressure && followUpText ? (
                      <p className="mt-2 inline-flex rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                        补录：{followUpText}
                      </p>
                    ) : null}
                  </div>
                );
              }

              return (
                <div key={item.id} className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-indigo-500">{item.data?.role === 'user' ? '老人' : '小爱'}</span>
                    <span className="text-xs text-gray-400">{timeLabel}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{item.data?.content || '暂无内容'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
