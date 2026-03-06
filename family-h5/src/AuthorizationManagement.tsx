import React, { useEffect, useState } from 'react';
import {
  User,
  Hospital,
  Shield,
  Eye,
  Edit2,
  X,
  Plus,
  Search,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  MessageSquare,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { DoctorAuthorization, DoctorProfile, AuthorizationType, DataRange } from './types';
import { createAuthorization, fetchPatientAuthorizationsDetailed, revokeAuthorization as apiRevokeAuthorization, searchDoctors } from './api';

const AUTHORIZATION_TYPE_LABELS: Record<AuthorizationType, string> = {
  meal_records: '日常餐食记录',
  health_reports: '健康分析报告',
  chat_logs: '饮食对话日志',
};

const DATA_RANGE_LABELS: Record<DataRange, string> = {
  recent_7d: '最近7天',
  recent_30d: '最近30天',
  recent_90d: '最近90天',
  all: '全部',
};

// ============ Components ============

const AuthorizationCard = ({
  authorization,
  onView,
  onEdit,
  onRevoke,
}: {
  authorization: DoctorAuthorization;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onRevoke: (id: string) => void;
}) => {
  const { authorizationType, scope, expiresAt, lastAccessedAt, accessCount } = authorization;

  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-base font-bold text-text-main">{authorization.doctorName}</h4>
            <div className="flex items-center gap-1 text-sm text-text-sub mt-0.5">
              <Hospital className="w-3.5 h-3.5" />
              <span>{authorization.hospital} · {authorization.department}</span>
            </div>
            <div className="text-xs text-text-hint mt-1">执业证：{authorization.licenseNumber}</div>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold",
          isExpired ? "bg-yellow-50 text-yellow-700" : "bg-emerald-50 text-emerald-700"
        )}>
          {isExpired ? '已过期' : '有效中'}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-1 text-sm text-text-sub">
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>权限：{authorizationType.map(t => AUTHORIZATION_TYPE_LABELS[t]).join('、')}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-text-sub">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>数据范围：{DATA_RANGE_LABELS[scope.dataRange]}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-text-sub">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {expiresAt ? `有效期至：${expiresAt.split('T')[0]}` : '有效期：永久'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={() => onView(authorization.id)}
          className="flex-1 py-2 px-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          查看详情
        </button>
        <button
          onClick={() => onEdit(authorization.id)}
          className="flex-1 py-2 px-3 text-sm font-bold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          修改权限
        </button>
        <button
          onClick={() => onRevoke(authorization.id)}
          className="flex-1 py-2 px-3 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          撤销授权
        </button>
      </div>
    </motion.div>
  );
};

const AddAuthorizationModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}) => {
  const [step, setStep] = useState<'search' | 'confirm' | 'success'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<AuthorizationType[]>(['meal_records']);
  const [dataRange, setDataRange] = useState<DataRange>('recent_30d');
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [agreed, setAgreed] = useState(false);

  const handleSearch = () => {
    if (!searchQuery) return;
    searchDoctors(searchQuery)
      .then((list: any) => {
        setSelectedDoctor(null);
        // 这里仅在搜索结果中选择一个医生，因此不单独维护 doctors 列表
        if (Array.isArray(list) && list.length > 0) {
          setSelectedDoctor(list[0]);
          setStep('confirm');
        }
      })
      .catch((err) => {
        console.error('搜索医生失败', err);
        alert('搜索医生失败，请稍后重试');
      });
  };

  const handleConfirm = () => {
    if (selectedDoctor && agreed) {
      setStep('success');
      onAdd({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        hospital: selectedDoctor.hospital,
        department: selectedDoctor.department,
        licenseNumber: selectedDoctor.licenseNumber,
        authorizationType: selectedTypes,
        dataRange,
        expiryDays,
      });
    }
  };

  const reset = () => {
    setStep('search');
    setSearchQuery('');
    setSelectedDoctor(null);
    setSelectedTypes(['meal_records']);
    setDataRange('recent_30d');
    setExpiryDays(90);
    setAgreed(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/40 flex items-end"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-main">
              {step === 'search' && '授权医生'}
              {step === 'confirm' && '确认授权信息'}
              {step === 'success' && '授权成功'}
            </h3>
            <button onClick={handleClose} className="p-1 rounded-full text-text-hint hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step 1: Search */}
          {step === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" />
                <input
                  type="text"
                  placeholder="输入医生姓名或执业证号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {searchQuery && filteredDoctors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-text-hint">搜索结果：</div>
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        selectedDoctor?.id === doctor.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-100 hover:border-indigo-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-main">{doctor.name}</span>
                            {doctor.verified && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div className="text-sm text-text-sub mt-0.5">
                            {doctor.hospital} · {doctor.department}
                          </div>
                          <div className="text-xs text-text-hint mt-1">
                            执业证：{doctor.licenseNumber}
                          </div>
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={!selectedDoctor}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-bold transition-all",
                  selectedDoctor
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                下一步
              </button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-text-sub mb-2">授权给：</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-bold text-text-main">{selectedDoctor?.name}</div>
                    <div className="text-sm text-text-sub">
                      {selectedDoctor?.hospital} · {selectedDoctor?.department}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-text-sub leading-relaxed">
                您将授权该医生查看您在"三餐管家"平台的日常餐食记录数据，用于随诊健康管理。
              </div>

              <div>
                <div className="text-sm font-bold text-text-main mb-2">🔒 授权范围：</div>
                <div className="space-y-2">
                  {(['meal_records', 'health_reports', 'chat_logs'] as AuthorizationType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedTypes((prev) =>
                          prev.includes(type)
                            ? prev.filter((t) => t !== type)
                            : [...prev, type]
                        );
                      }}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left flex items-center gap-2 transition-all",
                        selectedTypes.includes(type)
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-100"
                      )}
                    >
                      {selectedTypes.includes(type) ? (
                        <Check className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-gray-300" />
                      )}
                      <span className="text-sm">{AUTHORIZATION_TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-text-main mb-2">📅 数据时间范围：</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['recent_7d', 'recent_30d', 'recent_90d', 'all'] as DataRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDataRange(range)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-bold border transition-all",
                        dataRange === range
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 text-text-sub"
                      )}
                    >
                      {DATA_RANGE_LABELS[range]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-text-main mb-2">⏰ 授权有效期：</div>
                <div className="grid grid-cols-2 gap-2">
                  {[30, 90, 180, null].map((days) => (
                    <button
                      key={days || 'permanent'}
                      onClick={() => setExpiryDays(days || 99999)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-bold border transition-all",
                        expiryDays === (days || 99999)
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-100 text-text-sub"
                      )}
                    >
                      {days ? `${days}天` : '永久'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-text-sub">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>我已阅读并同意《数据授权协议》</span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('search')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-text-sub bg-gray-50"
                >
                  返回
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!agreed || selectedTypes.length === 0}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                    agreed && selectedTypes.length > 0
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  确认授权
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-text-main">授权成功</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-text-sub mb-2">您已成功授权{selectedDoctor?.name}查看您的日常餐食记录</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-sub">授权类型：</span>
                    <span className="text-text-main font-bold">
                      {selectedTypes.map(t => AUTHORIZATION_TYPE_LABELS[t]).join('、')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-sub">数据范围：</span>
                    <span className="text-text-main font-bold">{DATA_RANGE_LABELS[dataRange]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-sub">有效期至：</span>
                    <span className="text-text-main font-bold">
                      {expiryDays === 99999 ? '永久' : `${expiryDays}天`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-sub">授权时间：</span>
                    <span className="text-text-main font-bold">
                      {new Date().toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-text-sub leading-relaxed">
                您可以随时在"授权管理"中撤销或修改授权
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white"
              >
                完成
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const AuthorizationDetailModal = ({
  authorization,
  isOpen,
  onClose,
}: {
  authorization: DoctorAuthorization | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !authorization) return null;

  const { authorizationType, scope, expiresAt, lastAccessedAt, accessCount } = authorization;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-2xl p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-text-main">{authorization.doctorName}</h4>
                <div className="text-sm text-text-sub">
                  {authorization.hospital} · {authorization.department}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-text-hint hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-sm font-bold text-text-main mb-2">📋 授权信息</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-sub">授权时间</span>
                  <span className="text-text-main">
                    {new Date(authorization.authorizedAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-sub">状态</span>
                  <span className="text-emerald-600 font-bold">🟢 有效中</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-sub">有效期至</span>
                  <span className="text-text-main">
                    {expiresAt ? expiresAt.split('T')[0] : '永久'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-text-main mb-2">🔒 授权范围</div>
              <div className="space-y-2 text-sm">
                {(['meal_records', 'health_reports', 'chat_logs'] as AuthorizationType[]).map((type) => {
                  const isAuthorized = authorizationType.includes(type);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      {isAuthorized ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={isAuthorized ? 'text-text-main' : 'text-text-hint'}>
                        {AUTHORIZATION_TYPE_LABELS[type]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-text-main mb-2">📊 数据访问统计</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-sub">最后访问</span>
                  <span className="text-text-main">
                    {lastAccessedAt
                      ? new Date(lastAccessedAt).toLocaleString('zh-CN')
                      : '暂无'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-sub">访问次数</span>
                  <span className="text-text-main">{accessCount || 0} 次</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
            <button className="flex-1 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50">
              延长授权
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-50">
              修改权限
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50">
              撤销授权
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const AuthorizationManagement = () => {
  const [authorizations, setAuthorizations] = useState<DoctorAuthorization[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAuthorization, setSelectedAuthorization] = useState<DoctorAuthorization | null>(null);

  useEffect(() => {
    fetchPatientAuthorizationsDetailed()
      .then((data: any) => setAuthorizations(data))
      .catch((err) => console.error('加载授权列表失败', err));
  }, []);

  const handleView = (id: string) => {
    const auth = authorizations.find((a) => a.id === id);
    if (auth) {
      setSelectedAuthorization(auth);
    }
  };

  const handleEdit = (id: string) => {
    // TODO: 实现编辑功能
    console.log('Edit authorization:', id);
  };

  const handleRevoke = (id: string) => {
    if (confirm('确定要撤销此授权吗？')) {
      apiRevokeAuthorization(id)
        .then(() => {
          setAuthorizations((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, status: 'revoked' as const } : a
            )
          );
        })
        .catch((err) => {
          console.error('撤销授权失败', err);
          alert('撤销授权失败，请稍后重试');
        });
    }
  };

  const handleAdd = (data: any) => {
    createAuthorization({
      doctorId: data.doctorId,
      authorizationType: data.authorizationType,
      dataRange: data.dataRange,
      expiryDays: data.expiryDays,
    })
      .then((created: any) => {
        // 重新加载列表，保持与服务端一致
        return fetchPatientAuthorizationsDetailed().then((list: any) => {
          setAuthorizations(list);
          return created;
        });
      })
      .catch((err) => {
        console.error('创建授权失败', err);
        alert('创建授权失败，请稍后重试');
      });
  };

  const activeAuthorizations = authorizations.filter((a) => a.status === 'active');
  const revokedAuthorizations = authorizations.filter((a) => a.status === 'revoked');

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-base text-gray-800">授权管理</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          添加授权
        </button>
      </div>

      {activeAuthorizations.length > 0 ? (
        <>
          <div className="space-y-3 mb-4">
            <div className="text-sm text-text-sub">已授权医生列表 ({activeAuthorizations.length})</div>
            {activeAuthorizations.map((auth) => (
              <AuthorizationCard
                key={auth.id}
                authorization={auth}
                onView={handleView}
                onEdit={handleEdit}
                onRevoke={handleRevoke}
              />
            ))}
          </div>

          {revokedAuthorizations.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-text-sub mb-3">授权历史（已撤销）</div>
              <div className="space-y-2">
                {revokedAuthorizations.map((auth) => (
                  <div key={auth.id} className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-yellow-600" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-yellow-800">
                        已撤销 · {auth.doctorName}
                      </div>
                      <div className="text-xs text-yellow-700">
                        撤销于 {new Date(auth.authorizedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <div className="text-sm text-text-sub">暂无授权医生</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            添加授权
          </button>
        </div>
      )}

      <AddAuthorizationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />

      <AuthorizationDetailModal
        authorization={selectedAuthorization}
        isOpen={!!selectedAuthorization}
        onClose={() => setSelectedAuthorization(null)}
      />
    </section>
  );
};