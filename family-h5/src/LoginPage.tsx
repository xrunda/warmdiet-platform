import React, { useState } from 'react';
import { login, register } from './api';
import { cn } from './lib/utils';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState(65);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register({ phone, password, name, age, gender });
      } else {
        await login(phone, password);
      }
      onLoginSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold text-white">三餐管家</h1>
            <p className="text-white/70 text-sm mt-1">守护家人健康饮食</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[28px] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {isRegistering ? '创建账号' : '登录'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                      placeholder="请输入姓名"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        min={1}
                        max={150}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="female">女</option>
                        <option value="male">男</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="请输入手机号"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="请输入密码"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all',
                  loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                )}
              >
                {loading ? '处理中...' : isRegistering ? '注册' : '登录'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-sm text-indigo-600 font-medium"
              >
                {isRegistering ? '已有账号？立即登录' : '没有账号？立即注册'}
              </button>
            </div>
          </div>

          {/* Demo hint */}
          {!isRegistering && (
            <p className="text-center text-white/60 text-xs mt-6">
              测试账号：13700137000 / 密码：任意6位以上
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
