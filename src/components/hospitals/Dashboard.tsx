/**
 * 医院管理后台 - 仪表盘
 */

import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Stats {
  totalDoctors: number;
  totalPatients: number;
  activeAuthorizations: number;
  totalMeals: number;
}

export function HospitalDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalDoctors: 0,
    totalPatients: 0,
    activeAuthorizations: 0,
    totalMeals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.hospitalId) return;

    try {
      // 获取订阅信息（包含医生数量）
      const subResponse: any = await api.getSubscription(user.hospitalId);
      setStats({
        totalDoctors: subResponse.data?.currentDoctorCount || 0,
        totalPatients: 0, // 待实现
        activeAuthorizations: 0, // 待实现
        totalMeals: 0, // 待实现
      });
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">🏥 三餐管家 - 医院管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.hospitalName}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="医生数量"
            value={stats.totalDoctors}
            icon="👨‍⚕️"
            color="blue"
          />
          <StatCard
            title="患者数量"
            value={stats.totalPatients}
            icon="👤"
            color="green"
          />
          <StatCard
            title="活跃授权"
            value={stats.activeAuthorizations}
            icon="🔑"
            color="purple"
          />
          <StatCard
            title="餐食记录"
            value={stats.totalMeals}
            icon="🍽️"
            color="orange"
          />
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              title="添加医生"
              description="邀请医生加入平台"
              icon="➕"
              href="#doctors/add"
            />
            <QuickAction
              title="查看订阅"
              description="查看当前套餐和计费信息"
              icon="💳"
              href="#subscription"
            />
            <QuickAction
              title="访问日志"
              description="查看数据访问统计"
              icon="📊"
              href="#logs"
            />
          </div>
        </div>

        {/* 订阅信息 */}
        {user?.planType && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">当前套餐</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {user.planType === 'basic' && '基础版 ¥299/月'}
                  {user.planType === 'professional' && '专业版 ¥899/月'}
                  {user.planType === 'enterprise' && '企业版 ¥1999/月起'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  医生数量：{stats.totalDoctors} / {user.maxDoctors}
                </p>
              </div>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                升级套餐
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color as keyof typeof colorClasses]} rounded-full w-16 h-16 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, icon, href }: { title: string; description: string; icon: string; href: string }) {
  return (
    <a href={href} className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}