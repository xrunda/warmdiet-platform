import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronRight,
  Edit2,
  Eye,
  Heart,
  History,
  MessageSquare,
  Pill,
  Plus,
  Stethoscope,
  Utensils,
  X,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingSpinner, ImagePreviewDialog } from '../components/ui';
import {
  AddMedicationSheet,
  AddConditionSheet,
  EditPreferencesSheet,
  EditMedicalOrderSheet,
} from '../components/sheets';
import { AuthorizationManagement } from '../AuthorizationManagement';
import {
  fetchPatientProfile,
  fetchHealthConditions,
  fetchMedications,
  fetchPreferences,
  fetchMedicalOrders,
  removeHealthCondition,
} from '../api';

export const SettingsScreen = ({
  elderMode,
  onElderModeChange,
  onLogout,
}: {
  elderMode: boolean;
  onElderModeChange: (value: boolean) => void;
  onLogout?: () => void;
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
            老人模式
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

        <button 
          onClick={() => {
            if (window.confirm('确定要退出登录吗？')) {
              onLogout?.();
            }
          }}
          className="w-full py-4 text-red-400 font-bold text-sm bg-white rounded-[22px] shadow-sm border border-red-50 active:bg-red-50 transition"
        >
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