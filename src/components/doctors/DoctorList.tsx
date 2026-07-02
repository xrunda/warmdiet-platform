/**
 * 医生列表 - 纯 CSS 版本
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Doctor {
  id: string;
  name: string;
  department: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  accountStatus: string;
}

export function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const departments = [
    { id: 'all', name: '全部科室' },
    { id: '内科', name: '内科' },
    { id: '外科', name: '外科' },
    { id: '儿科', name: '儿科' },
    { id: '妇科', name: '妇科' },
    { id: '中医科', name: '中医科' },
    { id: '口腔科', name: '口腔科' },
    { id: '营养科', name: '营养科' },
  ];

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, statusFilter, departmentFilter]);

  const loadDoctors = async () => {
    try {
      const response: any = await api.getDoctors();
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.accountStatus === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(doc => doc.department === departmentFilter);
    }

    setFilteredDoctors(filtered);
  };

  const handleAddDoctor = async () => {
    const name = window.prompt('请输入医生姓名：');
    if (!name) return;

    const department = window.prompt('请输入科室（如：内科、外科、营养科）：');
    if (!department) return;

    const licenseNumber = window.prompt('请输入执业证号：');
    if (!licenseNumber) return;

    const email = window.prompt('请输入邮箱（可选）：') || undefined;
    const phone = window.prompt('请输入手机号（可选）：') || undefined;

    try {
      setActionLoading('add');
      const res: any = await api.createDoctor({ name, department, licenseNumber, email, phone });
      if (res.success) {
        await loadDoctors();
        alert('添加成功！');
      } else {
        alert('添加失败：' + (res.message || '未知错误'));
      }
    } catch (err: any) {
      alert('添加失败：' + (err.message || '网络错误'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!window.confirm(`确认删除医生「${doctor.name}」吗？此操作不可撤销。`)) return;

    try {
      setActionLoading(doctor.id);
      await api.deleteDoctor(doctor.id);
      await loadDoctors();
    } catch (err: any) {
      alert('删除失败：' + (err.message || '网络错误'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (doctor: Doctor) => {
    const newStatus = doctor.accountStatus === 'active' ? 'suspended' : 'active';
    const actionLabel = newStatus === 'suspended' ? '暂停' : '激活';

    if (!window.confirm(`确认${actionLabel}医生「${doctor.name}」吗？`)) return;

    try {
      setActionLoading(doctor.id);
      await api.toggleDoctorStatus(doctor.id, newStatus);
      await loadDoctors();
    } catch (err: any) {
      alert(`${actionLabel}失败：` + (err.message || '网络错误'));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: '活跃', color: '#dcfce7', text: '#16a34a' },
      inactive: { label: '已暂停', color: '#fee2e2', text: '#dc2626' },
      suspended: { label: '已暂停', color: '#fee2e2', text: '#dc2626' },
      pending: { label: '待审核', color: '#fef3c7', text: '#d97706' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return statusInfo;
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>医生管理</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px', marginBottom: 0 }}>
            管理您的医生团队 ({doctors.length} 位医生)
          </p>
        </div>
        <button
          onClick={handleAddDoctor}
          disabled={actionLoading === 'add'}
          style={{
            padding: '10px 20px',
            background: actionLoading === 'add' ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: actionLoading === 'add' ? 'not-allowed' : 'pointer'
          }}
        >
          {actionLoading === 'add' ? '添加中...' : '+ 添加医生'}
        </button>
      </div>

      {/* 筛选 */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="搜索医生姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ width: '192px' }}>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#64748b',
                outline: 'none'
              }}
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#64748b',
                outline: 'none'
              }}
            >
              <option value="all">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">已暂停</option>
              <option value="suspended">已暂停</option>
              <option value="pending">待审核</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDepartmentFilter('all'); }}
              style={{
                padding: '12px 16px',
                color: '#64748b',
                background: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 医生列表 */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
        ) : filteredDoctors.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍⚕️</div>
            <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? '未找到匹配的医生' : '暂无医生'}
            </h3>
            <p style={{ color: '#64748b' }}>
              {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                ? '请尝试调整筛选条件'
                : '暂无医生，请点击"+ 添加医生"添加'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '14px' }}>医生姓名</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '14px' }}>科室</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '14px' }}>状态</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: '14px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => {
                const statusBadge = getStatusBadge(doctor.accountStatus);
                const isActioning = actionLoading === doctor.id;
                return (
                  <tr key={doctor.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', color: '#1e293b', fontWeight: 500 }}>{doctor.name}</td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{doctor.department}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: statusBadge.color,
                        color: statusBadge.text,
                        fontWeight: 600
                      }}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(doctor)}
                        disabled={isActioning}
                        style={{
                          color: doctor.accountStatus === 'active' ? '#f59e0b' : '#10b981',
                          background: 'none',
                          border: 'none',
                          cursor: isActioning ? 'not-allowed' : 'pointer',
                          marginRight: '12px',
                          fontSize: '14px',
                          opacity: isActioning ? 0.5 : 1,
                        }}
                      >
                        {doctor.accountStatus === 'active' ? '暂停' : '激活'}
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doctor)}
                        disabled={isActioning}
                        style={{
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          cursor: isActioning ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: isActioning ? 0.5 : 1,
                        }}
                      >
                        {isActioning ? '处理中...' : '删除'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
