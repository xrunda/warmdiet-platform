import React, { useState } from 'react';
import {
  ClipboardList,
  Users,
  Home,
  Utensils,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/hospitals/LoginForm';
import { DoctorDashboard } from './components/doctors/DoctorDashboard';
import { PatientList } from './components/patients/PatientList';
import { PatientDetail } from './components/patients/PatientDetail';
import { Navigation } from './components/common/Navigation';
import { ToastProvider } from './components/common/Toast';

// 医院端导航菜单项
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
}

const hospitalNavItems: NavItem[] = [
  { id: 'dashboard', label: '工作台', icon: ClipboardList, component: DoctorDashboard },
  { id: 'patients', label: '我的患者', icon: Users, component: PatientList },
];

// 患者端底部导航
const patientNavItems = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'meals', label: '记录', icon: Utensils },
  { id: 'reports', label: '报告', icon: FileText },
  { id: 'settings', label: '我的', icon: Settings },
];

// 患者端简化主页组件
function PatientHomeScreen() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* 欢迎卡片 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">欢迎使用三餐管家 👋</h1>
          <p className="text-indigo-100">记录您的每日饮食，获取专业营养建议</p>
        </div>

        {/* 今日概览 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">今日概览</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="text-2xl mb-1">🍳</div>
              <div className="text-sm text-gray-600">早餐</div>
              <div className="text-xs text-orange-500 mt-1">未记录</div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <div className="text-2xl mb-1">🥗</div>
              <div className="text-sm text-gray-600">午餐</div>
              <div className="text-xs text-green-500 mt-1">未记录</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="text-2xl mb-1">🍲</div>
              <div className="text-sm text-gray-600">晚餐</div>
              <div className="text-xs text-blue-500 mt-1">未记录</div>
            </div>
          </div>
        </div>

        {/* 快速记录按钮 */}
        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mb-6">
          <Utensils className="w-5 h-5" />
          记录今日餐食
        </button>

        {/* 功能列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">营养分析报告</div>
                <div className="text-sm text-gray-500">查看您的饮食分析</div>
              </div>
            </div>
            <div className="text-gray-400">→</div>
          </div>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">AI 健康咨询</div>
                <div className="text-sm text-gray-500">智能分析您的健康状况</div>
              </div>
            </div>
            <div className="text-gray-400">→</div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">👨‍⚕️</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">医生授权</div>
                <div className="text-sm text-gray-500">管理医生查看权限</div>
              </div>
            </div>
            <div className="text-gray-400">→</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 患者端其他占位组件
function PatientMealsScreen() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">餐食记录</h1>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-500">暂无餐食记录</p>
          <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl">
            添加记录
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientReportsScreen() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">健康报告</h1>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500">暂无健康报告</p>
          <p className="text-sm text-gray-400 mt-2">记录更多餐食后生成报告</p>
        </div>
      </div>
    </div>
  );
}

function PatientSettingsScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">我的</h1>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <div className="font-semibold text-gray-800">患者用户</div>
                <div className="text-sm text-gray-500">138****8000</div>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-gray-700">个人资料</span>
            <span className="text-gray-400">→</span>
          </div>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-gray-700">健康档案</span>
            <span className="text-gray-400">→</span>
          </div>
          <div className="p-4">
            <button
              onClick={onLogout}
              className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 患者端布局组件
function PatientLayout({ children, activeTab, onTabChange, onLogout }: {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-20">{children}</div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-md mx-auto flex justify-around">
          {patientNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
                activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [initialPatient, setInitialPatient] = useState<{
    id: string;
    name: string;
    latestUpdate?: string;
    unreadMessages?: number;
  } | null>(null);

  // 调试日志
  console.log('App render:', { isAuthenticated, loading, activeTab, selectedPatientId, userType: user?.type });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">加载中...</div>
      </div>
    );
  }

  // 未登录显示登录表单
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <LoginForm />
      </ToastProvider>
    );
  }

  // 患者端界面
  if (user?.type === 'patient') {
    return (
      <ToastProvider>
        <PatientLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout}>
          {activeTab === 'home' && <PatientHomeScreen />}
          {activeTab === 'meals' && <PatientMealsScreen />}
          {activeTab === 'reports' && <PatientReportsScreen />}
          {activeTab === 'settings' && <PatientSettingsScreen onLogout={logout} />}
        </PatientLayout>
      </ToastProvider>
    );
  }

  // 处理患者选择（医院端）
  const handleSelectPatient = (patient: {
    id: string;
    name: string;
    latestUpdate?: string;
    unreadMessages?: number;
  }) => {
    setSelectedPatientId(patient.id);
    setInitialPatient(patient);
  };

  // 处理返回患者列表
  const handleBackToList = () => {
    setSelectedPatientId(null);
  };

  // 医院端界面
  return (
    <ToastProvider>
      {selectedPatientId ? (
        <Navigation
          items={hospitalNavItems}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedPatientId(null);
            setInitialPatient(null);
          }}
        >
          <PatientDetail
            patientId={selectedPatientId}
            initialPatient={initialPatient || undefined}
            onBack={handleBackToList}
          />
        </Navigation>
      ) : (
        <Navigation
          items={hospitalNavItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {(() => {
            const ActiveItem = hospitalNavItems.find((item) => item.id === activeTab);
            if (!ActiveItem) return null;
            const Component = ActiveItem.component;
            if (activeTab === 'patients') {
              return <Component onSelectPatient={handleSelectPatient} />;
            }
            if (activeTab === 'dashboard') {
              return (
                <Component
                  onTabChange={setActiveTab}
                  onSelectPatient={handleSelectPatient}
                />
              );
            }
            return <Component onTabChange={setActiveTab} />;
          })()}
        </Navigation>
      )}
    </ToastProvider>
  );
}

export default App;
