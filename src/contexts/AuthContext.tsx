/**
 * 认证上下文
 * 提供全局认证状态共享
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  type: 'hospital' | 'doctor' | 'patient';
  hospitalId?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any, type: 'hospital' | 'patient') => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时从 localStorage 读取用户状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: any, type: 'hospital' | 'patient') => {
    let response: any;

    if (type === 'hospital') {
      response = await api.loginHospital(credentials);
    } else if (type === 'patient') {
      response = await api.loginPatient(credentials);
    }

    if (response.success && response.data) {
      // 处理新格式：扁平结构 { patientId, name, phone, ... } 或旧格式 { patient: { id, name, ... } }
      const userData = response.data.hospital || response.data.patient || {
        id: response.data.patientId,
        name: response.data.name,
        phone: response.data.phone,
        age: response.data.age,
        gender: response.data.gender,
      };
      const userType = type;
      const userWithType = {
        id: userData.id,
        type: userType,
        hospitalId: userData.id,
        ...userData,
      };

      setUser(userWithType);
      localStorage.setItem('user', JSON.stringify(userWithType));

      return response;
    }

    throw new Error('登录失败');
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
