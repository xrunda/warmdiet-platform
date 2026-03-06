/**
 * 认证 Hook
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  type: 'hospital' | 'doctor' | 'patient';
  hospitalId?: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查 localStorage 中的 token
    const token = localStorage.getItem('token');
    if (token) {
      // 这里可以添加验证 token 的逻辑
      // 目前简单设置用户信息
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any, type: 'hospital') => {
    let response: any;

    if (type === 'hospital') {
      response = await api.loginHospital(credentials);
    }

    if (response.success && response.data) {
      const userData = response.data.hospital;
      setUser({
        id: userData.id,
        type: type,
        hospitalId: userData.id,
        ...userData,
      });

      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        type: type,
        hospitalId: userData.id,
        ...userData,
      }));

      return response;
    }

    throw new Error('登录失败');
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}