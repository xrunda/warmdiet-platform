/**
 * 医院登录表单 - 全新设计
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function LoginForm() {
  const [formData, setFormData] = useState({
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
      await login(formData, 'hospital');
      success('登录成功！');
    } catch (err: any) {
      error(err.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const useTestAccount = () => {
    setFormData({
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

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">欢迎回来</h2>
              <p className="text-slate-500 mt-2">请输入您的账号信息登录</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  统一社会信用代码
                </label>
                <input
                  type="text"
                  name="hospitalId"
                  value={formData.hospitalId}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="请输入密码"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={useTestAccount}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm flex items-center justify-center gap-1.5 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L12 21l-2.257-2.257A6 6 0 1115 7z" />
                </svg>
                使用测试账号
              </button>
            </div>

            <div className="mt-4 text-center">
              <a href="#register" className="text-slate-500 hover:text-slate-700 font-medium transition-colors text-sm">
                还没有账号？立即注册
              </a>
            </div>
          </div>

          {/* 套餐价格 - 移动端显示 */}
          <div className="lg:hidden mt-8">
            <p className="text-center text-slate-500 text-sm mb-4">套餐价格</p>
            <div className="grid grid-cols-3 gap-3">
              {plans.map(plan => (
                <div key={plan.name} className={`p-3 rounded-xl bg-white text-center ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}>
                  <p className="text-xs text-slate-500">{plan.name}</p>
                  <p className="text-lg font-bold text-slate-800">¥{plan.price}<span className="text-xs">{plan.period}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
