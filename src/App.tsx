import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/hospitals/LoginForm';
import { HospitalDashboard } from './components/hospitals/Dashboard';
import { DoctorList } from './components/doctors/DoctorList';
import { AuthorizationList } from './components/authorization/AuthorizationList';
import { MealRecord } from './components/meals/MealRecord';
import { HealthReport } from './components/reports/HealthReport';
import { Navigation } from './components/common/Navigation';
import { ToastProvider } from './components/common/Toast';

// 导航菜单项
const navItems = [
  { id: 'dashboard', label: '仪表盘', icon: '📊', component: HospitalDashboard },
  { id: 'doctors', label: '医生管理', icon: '👨‍⚕️', component: DoctorList },
  { id: 'authorizations', label: '授权管理', icon: '🔐', component: AuthorizationList },
  { id: 'meals', label: '餐食记录', icon: '🍽️', component: MealRecord },
  { id: 'reports', label: '健康报告', icon: '📋', component: HealthReport },
];

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // 调试日志
  console.log('App render:', { isAuthenticated, loading, activeTab });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">加载中...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <Navigation
          items={navItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </ToastProvider>
  );
}

export default App;