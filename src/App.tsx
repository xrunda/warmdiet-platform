import React, { useState } from 'react';
import {
  ClipboardList,
  Clock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/hospitals/LoginForm';
import { DoctorDashboard } from './components/doctors/DoctorDashboard';
import { AuthorizationList } from './components/authorization/AuthorizationList';
import { PatientRecords } from './components/patients/PatientRecords';
import { FollowUpPlan } from './components/doctors/FollowUpPlan';
import { Navigation } from './components/common/Navigation';
import { ToastProvider } from './components/common/Toast';

// 导航菜单项
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '工作台', icon: ClipboardList, component: DoctorDashboard },
  { id: 'authorizations', label: '我的患者', icon: ShieldCheck, component: AuthorizationList },
  { id: 'patients', label: '患者记录', icon: Users, component: PatientRecords },
  { id: 'followup', label: '随访计划', icon: Clock, component: FollowUpPlan },
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