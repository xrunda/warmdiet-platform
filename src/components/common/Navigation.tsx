/**
 * 导航组件
 */

import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
}

interface NavigationProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ items, activeTab, onTabChange }: NavigationProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">🏥 三餐管家</h1>
          {user?.hospitalName && (
            <p className="text-sm text-gray-600 mt-2">{user.hospitalName}</p>
          )}
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="text-xs text-gray-500">
            <p>套餐：{user?.planType === 'basic' && '基础版'}</p>
            <p>套餐：{user?.planType === 'professional' && '专业版'}</p>
            <p>套餐：{user?.planType === 'enterprise' && '企业版'}</p>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {(() => {
            const ActiveComponent = items.find(item => item.id === activeTab)?.component;
            return ActiveComponent ? <ActiveComponent /> : null;
          })()}
        </div>
      </div>
    </div>
  );
}