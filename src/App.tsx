import React, { useState } from 'react';
import {
  ClipboardList,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/hospitals/LoginForm';
import { DoctorDashboard } from './components/doctors/DoctorDashboard';
import { PatientList } from './components/patients/PatientList';
import { PatientDetail } from './components/patients/PatientDetail';
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
  { id: 'patients', label: '我的患者', icon: Users, component: PatientList },
];

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // 调试日志
  console.log('App render:', { isAuthenticated, loading, activeTab, selectedPatientId });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">加载中...</div>
      </div>
    );
  }

  // 处理患者选择
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  // 处理返回患者列表
  const handleBackToList = () => {
    setSelectedPatientId(null);
  };

  return (
    <ToastProvider>
      {!isAuthenticated ? (
        <LoginForm />
      ) : selectedPatientId ? (
        <Navigation
          items={navItems}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedPatientId(null);
          }}
        >
          <PatientDetail
            patientId={selectedPatientId}
            onBack={handleBackToList}
          />
        </Navigation>
      ) : (
        <Navigation
          items={navItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {navItems.find(item => item.id === activeTab)?.component &&
            (() => {
              const Component = navItems.find(item => item.id === activeTab)!.component;
              return activeTab === 'patients' ? (
                <Component onSelectPatient={handleSelectPatient} />
              ) : (
                <Component onTabChange={setActiveTab} />
              );
            })()}
        </Navigation>
      )}
    </ToastProvider>
  );
}

export default App;