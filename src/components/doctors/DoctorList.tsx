/**
 * 医生列表组件
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface Doctor {
  id: string;
  name: string;
  licenseNumber: string;
  department: string;
  email?: string;
  phone?: string;
  accountStatus: 'active' | 'suspended';
  canAccessPatientData: boolean;
}

export function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response: any = await api.getDoctors();
      setDoctors(response.data || []);
    } catch (err: any) {
      error(err.message || '加载医生列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (doctorId: string, status: 'active' | 'suspended') => {
    try {
      await api.toggleDoctorStatus(doctorId, status);
      success(status === 'active' ? '医生已激活' : '医生已暂停');
      loadDoctors();
    } catch (err: any) {
      error(err.message || '操作失败');
    }
  };

  const handleDelete = async (doctorId: string) => {
    if (!confirm('确定要删除这位医生吗？')) return;

    try {
      await api.deleteDoctor(doctorId);
      success('医生已删除');
      loadDoctors();
    } catch (err: any) {
      error(err.message || '删除失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">医生列表</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + 添加医生
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">暂无医生，点击"添加医生"开始添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddDoctorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDoctors();
            success('医生添加成功');
          }}
        />
      )}
    </div>
  );
}

function DoctorCard({
  doctor,
  onToggleStatus,
  onDelete,
}: {
  doctor: Doctor;
  onToggleStatus: (id: string, status: 'active' | 'suspended') => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            👨‍⚕️
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
            <p className="text-sm text-gray-600">{doctor.department}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            doctor.accountStatus === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {doctor.accountStatus === 'active' ? '活跃' : '已暂停'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">执业证号：</span>
          <span>{doctor.licenseNumber}</span>
        </div>
        {doctor.email && (
          <div className="flex items-center gap-2">
            <span className="font-medium">邮箱：</span>
            <span>{doctor.email}</span>
          </div>
        )}
        {doctor.phone && (
          <div className="flex items-center gap-2">
            <span className="font-medium">电话：</span>
            <span>{doctor.phone}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {doctor.accountStatus === 'active' ? (
          <button
            onClick={() => onToggleStatus(doctor.id, 'suspended')}
            className="flex-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
          >
            暂停
          </button>
        ) : (
          <button
            onClick={() => onToggleStatus(doctor.id, 'active')}
            className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
          >
            激活
          </button>
        )}
        <button
          onClick={() => onDelete(doctor.id)}
          className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition"
        >
          删除
        </button>
      </div>
    </div>
  );
}

function AddDoctorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    department: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createDoctor(formData);
      onSuccess();
    } catch (err: any) {
      error(err.message || '添加医生失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">添加医生</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              执业证号 *
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
              placeholder="15-20位执业证号"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              科室 *
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              电话
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}