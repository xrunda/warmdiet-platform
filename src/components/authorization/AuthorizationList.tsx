/**
 * 授权管理组件 - 患者端
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

interface Authorization {
  id: string;
  doctorId: string;
  doctorName: string;
  hospital: string;
  department: string;
  licenseNumber: string;
  authorizationType: ('meal_records' | 'health_reports' | 'chat_logs')[];
  authorizedAt: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
}

export function AuthorizationList() {
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadAuthorizations();
  }, [user]);

  const loadAuthorizations = async () => {
    if (!user?.userId) return;

    try {
      const response: any = await api.getPatientAuthorizations(user.userId);
      setAuthorizations(response.data || []);
    } catch (err: any) {
      error(err.message || '加载授权列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销此授权吗？医生将无法继续访问您的数据。')) return;

    try {
      await api.revokeAuthorization(id);
      success('授权已撤销');
      loadAuthorizations();
    } catch (err: any) {
      error(err.message || '撤销失败');
    }
  };

  const handleExtend = async (id: string) => {
    const days = prompt('请输入延长的天数：', '30');
    if (!days) return;

    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum <= 0) {
      error('请输入有效的天数');
      return;
    }

    try {
      await api.extendAuthorization(id, daysNum);
      success(`授权已延长 ${daysNum} 天`);
      loadAuthorizations();
    } catch (err: any) {
      error(err.message || '延长失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🔐 授权管理</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + 添加授权
        </button>
      </div>

      {/* 已授权医生 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">已授权医生 ({authorizations.filter(a => a.status === 'active').length})</h3>

        {authorizations.filter(a => a.status === 'active').length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无授权，点击"添加授权"开始授权</p>
          </div>
        ) : (
          <div className="space-y-4">
            {authorizations
              .filter(a => a.status === 'active')
              .map(auth => (
                <AuthorizationCard
                  key={auth.id}
                  auth={auth}
                  onRevoke={handleRevoke}
                  onExtend={handleExtend}
                />
              ))}
          </div>
        )}
      </div>

      {/* 授权历史 */}
      {authorizations.filter(a => a.status !== 'active').length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">授权历史</h3>
          <div className="space-y-2">
            {authorizations
              .filter(a => a.status !== 'active')
              .map(auth => (
                <div key={auth.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{auth.doctorName}</p>
                    <p className="text-sm text-gray-600">
                      {auth.status === 'revoked' ? '已撤销' : '已过期'} · {new Date(auth.authorizedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    auth.status === 'revoked' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {auth.status === 'revoked' ? '已撤销' : '已过期'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <AddAuthorizationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadAuthorizations();
            success('授权成功');
          }}
        />
      )}
    </div>
  );
}

function AuthorizationCard({
  auth,
  onRevoke,
  onExtend,
}: {
  auth: Authorization;
  onRevoke: (id: string) => void;
  onExtend: (id: string) => void;
}) {
  const getAuthTypeLabels = () => {
    const labels: { [key: string]: string } = {
      meal_records: '餐食记录',
      health_reports: '健康报告',
      chat_logs: '对话日志',
    };
    return auth.authorizationType.map(type => labels[type]).join('、');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            👨‍⚕️
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{auth.doctorName}</h3>
            <p className="text-sm text-gray-600">
              {auth.hospital} · {auth.department}
            </p>
          </div>
        </div>
        <span className="text-green-500 text-sm font-medium">✓ 有效中</span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">执业证号：</span>
          <span>{auth.licenseNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">授权类型：</span>
          <span>{getAuthTypeLabels()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">授权时间：</span>
          <span>{new Date(auth.authorizedAt).toLocaleDateString()}</span>
        </div>
        {auth.expiresAt && (
          <div className="flex items-center gap-2">
            <span className="font-medium">有效期至：</span>
            <span>{new Date(auth.expiresAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onExtend(auth.id)}
          className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
        >
          延长授权
        </button>
        <button
          onClick={() => onRevoke(auth.id)}
          className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition"
        >
          撤销授权
        </button>
      </div>
    </div>
  );
}

function AddAuthorizationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [authConfig, setAuthConfig] = useState({
    authorizationType: ['meal_records'] as ('meal_records' | 'health_reports' | 'chat_logs')[],
    scopeDataRange: 'recent_30d' as 'recent_7d' | 'recent_30d' | 'recent_90d' | 'all',
    expiresInDays: 90,
  });

  const [loading, setLoading] = useState(false);
  const { error } = useToast();
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;

    try {
      setLoading(true);
      const response: any = await api.searchDoctors(searchKeyword);
      setSearchResults(response.data || []);
    } catch (err: any) {
      error(err.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.userId || !selectedDoctor) return;

    try {
      setLoading(true);
      await api.createAuthorization({
        doctorId: selectedDoctor.id,
        patientId: user.userId,
        ...authConfig,
        scopeDataStart: new Date().toISOString().split('T')[0],
      });
      onSuccess();
    } catch (err: any) {
      error(err.message || '授权失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthType = (type: 'meal_records' | 'health_reports' | 'chat_logs') => {
    setAuthConfig({
      ...authConfig,
      authorizationType: authConfig.authorizationType.includes(type)
        ? authConfig.authorizationType.filter(t => t !== type)
        : [...authConfig.authorizationType, type],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">添加授权</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* 步骤 1: 搜索医生 */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索医生
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入医生姓名或执业证号"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  搜索
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map(doctor => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedDoctor?.id === doctor.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <p className="font-semibold">{doctor.name}</p>
                    <p className="text-sm text-gray-600">
                      {doctor.hospital} · {doctor.department}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedDoctor && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  下一步
                </button>
              </div>
            )}
          </div>
        )}

        {/* 步骤 2: 配置授权 */}
        {step === 2 && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                授权给：<strong>{selectedDoctor?.name}</strong>（{selectedDoctor?.hospital}）
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  授权范围
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'meal_records', label: '日常餐食记录' },
                    { key: 'health_reports', label: '健康分析报告' },
                    { key: 'chat_logs', label: '饮食对话日志' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={authConfig.authorizationType.includes(item.key as any)}
                        onChange={() => toggleAuthType(item.key as any)}
                        className="w-4 h-4 text-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数据时间范围
                </label>
                <select
                  value={authConfig.scopeDataRange}
                  onChange={(e) => setAuthConfig({ ...authConfig, scopeDataRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="recent_7d">最近 7 天</option>
                  <option value="recent_30d">最近 30 天</option>
                  <option value="recent_90d">最近 90 天</option>
                  <option value="all">全部</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  授权有效期
                </label>
                <select
                  value={authConfig.expiresInDays}
                  onChange={(e) => setAuthConfig({ ...authConfig, expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={30}>30 天</option>
                  <option value={90}>90 天</option>
                  <option value={180}>180 天</option>
                  <option value={99999}>永久</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || authConfig.authorizationType.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {loading ? '授权中...' : '确认授权'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}