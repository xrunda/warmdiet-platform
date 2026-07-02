/**
 * 医院端登录表单
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export function LoginForm() {
  const [hospitalForm, setHospitalForm] = useState({
    hospitalId: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(hospitalForm, 'hospital');
      success('登录成功！');
    } catch (err: any) {
      error(err.message || '操作失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  const useTestAccount = () => {
    setHospitalForm({
      hospitalId: '91110000MD0010209',
      password: 'password123',
    });
  };

  const plans = [
    { name: '基础版', price: '299', period: '/月', features: ['5 名医生', '基础功能', '标准支持'], color: 'from-gray-500 to-gray-600' },
    { name: '专业版', price: '899', period: '/月', features: ['20 名医生', '高级功能', '优先支持'], color: 'from-violet-500 to-purple-600', popular: true },
    { name: '企业版', price: '1999', period: '起/月', features: ['50+ 名医生', '全部功能', '专属客服'], color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* 左侧 - 品牌展示区 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <span className="text-2xl">🏥</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">三餐管家</h1>
            <p className="text-slate-400">WarmDiet - 医疗健康管理平台</p>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            专业的医院膳食管理
          </h2>
          <p className="text-xl text-slate-300 max-w-md mx-auto">
            连接患者、医生和医院，打造全方位的健康管理服务
          </p>

          {/* 功能特点 */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <p className="text-slate-300 text-sm">医生管理</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🔐</span>
              </div>
              <p className="text-slate-300 text-sm">授权管理</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-slate-300 text-sm">健康报告</p>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="relative z-10">
          <p className="text-slate-500 text-sm text-center">
            © 2024 三餐管家 WarmDiet. All rights reserved.
          </p>
        </div>
      </div>

      {/* 右侧 - 登录表单 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">三餐管家</h1>
              <p className="text-slate-500 text-sm">医院管理后台</p>
            </div>
          </div>

          {/* 角色标识 */}
          <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100">
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <span className="text-xl">🏥</span>
              <span className="font-medium">医院/医生登录</span>
            </div>
            <p className="text-center text-sm text-emerald-600 mt-2">专为医院管理人员和医生设计</p>
          </div>

          {/* 跳转到家属端链接 */}
          <div className="bg-indigo-50 rounded-xl p-3 mb-4 border border-indigo-100">
            <p className="text-center text-sm text-indigo-700 flex items-center justify-center gap-2">
              <span>👤</span>
              患者/家属请访问
              <a
                href="/family/"
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                家属端登录
              </a>
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">欢迎回来</h2>
              <p className="text-slate-500 mt-2">请输入医院账号信息登录</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 医院登录表单 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  统一社会信用代码
                </label>
                <input
                  type="text"
                  name="hospitalId"
                  value={hospitalForm.hospitalId}
                  onChange={(e) =>
                    setHospitalForm({ ...hospitalForm, hospitalId: e.target.value })
                  }
                  required
                  placeholder="请输入18位统一社会信用代码"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  name="password"
                  value={hospitalForm.password}
                  onChange={(e) =>
                    setHospitalForm({ ...hospitalForm, password: e.target.value })
                  }
                  required
                  placeholder="请输入密码"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>

            {/* 测试账号 */}
            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={useTestAccount}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L12 21l-2.257-2.257A6 6 0 1115 7z" />
                </svg>
                使用医院测试账号
              </button>
            </div>
          </div>

          {/* 套餐价格 - 仅医院端显示 */}
          <div className="lg:hidden mt-8">
            <p className="text-center text-slate-500 text-sm mb-4">套餐价格</p>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-3 rounded-xl bg-white text-center ${
                    plan.popular ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <p className="text-xs text-slate-500">{plan.name}</p>
                  <p className="text-lg font-bold text-slate-800">
                    ¥{plan.price}
                    <span className="text-xs">{plan.period}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
