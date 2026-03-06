/**
 * 餐食记录 - 纯 CSS 版本
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function MealRecord() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');

  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      const doctorsRes: any = await api.getDoctors();
      const doctors = doctorsRes.data || [];

      const patientIds = new Set<string>();
      for (const doc of doctors) {
        try {
          const authRes: any = await api.getDoctorAuthorizations(doc.id);
          const auths = authRes.data || [];
          for (const auth of auths) {
            if (auth.status === 'active') patientIds.add(auth.patientId);
          }
        } catch { /* skip */ }
      }

      const allRecords: any[] = [];
      for (const pid of patientIds) {
        try {
          const mealsRes: any = await api.getMeals(pid);
          const meals = mealsRes.data || [];
          for (const meal of meals) {
            const foods = Array.isArray(meal.foods)
              ? meal.foods
              : JSON.parse(meal.foods || '[]');
            allRecords.push({
              id: meal.id,
              patientName: pid,
              date: (meal.mealDate || meal.createdAt || '').split('T')[0],
              mealType: meal.mealType,
              foods: foods.map((f: any) => ({
                name: f.name,
                amount: `${f.amount}${f.unit || ''}`,
                calories: f.calories || 0,
              })),
              calories: meal.calories || foods.reduce((s: number, f: any) => s + (f.calories || 0), 0),
              protein: foods.reduce((s: number, f: any) => s + (f.protein || 0), 0),
              carbs: foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0),
              fat: foods.reduce((s: number, f: any) => s + (f.fat || 0), 0),
              notes: meal.notes,
            });
          }
        } catch { /* skip patient with no meals */ }
      }

      setRecords(allRecords);
    } catch (err) {
      console.error('Failed to load meals:', err);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const stats = {
    total: records.length,
    todayRecords: records.filter(r => r.date === today).length,
    totalCalories: records.reduce((sum, r) => sum + r.calories, 0),
    avgCalories: records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.calories, 0) / records.length)
      : 0,
  };

  const getCalorieLevel = (calories: number) => {
    if (calories < 300) return { label: '低热量', color: '#10b981', bg: '#d1fae5', border: '#6ee7b7' };
    if (calories < 500) return { label: '中等热量', color: '#3b82f6', bg: '#bfdbfe', border: '#93c5fd' };
    return { label: '高热量', color: '#f97316', bg: '#fee2e2', border: '#fca5a5' };
  };

  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍪',
    };
    return icons[type] || '🍽️';
  };

  const filteredRecords = records.filter(record => {
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = record.date === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = record.date >= weekAgo.toISOString().split('T')[0];
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      matchesDate = record.date >= monthAgo.toISOString().split('T')[0];
    }
    const matchesType = mealTypeFilter === 'all' || record.mealType === mealTypeFilter;
    const matchesSearch = searchTerm === '' || record.patientName.includes(searchTerm);
    return matchesDate && matchesType && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>餐食记录</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px', marginBottom: 0 }}>
          查看患者的饮食记录
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: '总记录数', value: stats.total, icon: '📊', color: '#64748b', bgLight: '#f1f5f9' },
          { label: '今日记录', value: stats.todayRecords, icon: '📅', color: '#3b82f6', bgLight: '#bfdbfe' },
          { label: '平均热量', value: `${stats.avgCalories} kcal`, icon: '🔥', color: '#f97316', bgLight: '#fee2e2' },
          { label: '总摄入热量', value: `${stats.totalCalories} kcal`, icon: '🍽️', color: '#ef4444', bgLight: '#fee2e2' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flexStart' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, margin: 0 }}>{stat.label}</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e293b', marginTop: '8px', marginBottom: 0 }}>
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
                }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选和搜索 */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <input
            type="text"
            placeholder="搜索患者姓名或食物..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#64748b',
              outline: 'none'
            }}
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">最近7天</option>
            <option value="month">最近30天</option>
          </select>

          <select
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#64748b',
              outline: 'none'
            }}
          >
            <option value="all">全部餐别</option>
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">加餐</option>
          </select>

          {(searchTerm || dateFilter !== 'all' || mealTypeFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setDateFilter('all'); setMealTypeFilter('all'); }}
              style={{
                padding: '12px 16px',
                color: '#64748b',
                background: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 餐食记录列表 */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
            <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              暂无餐食记录
            </h3>
            <p style={{ color: '#64748b' }}>
              患者将从此处记录每日的饮食情况
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredRecords.map((record, idx) => {
              const calorieLevel = getCalorieLevel(record.calories);
              return (
                <div
                  key={record.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #fef3c7, #d1fae5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        {getMealTypeIcon(record.mealType)}
                      </div>
                      <div>
                        <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '14px', margin: 0 }}>{record.patientName}</p>
                        <p style={{ color: '#64748b', fontSize: '12px' }}>• {record.date}</p>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: calorieLevel.bg,
                      color: calorieLevel.color,
                      fontWeight: 600,
                      border: `1px solid ${calorieLevel.border}`
                    }}>
                      {calorieLevel.label}
                    </span>
                  </div>

                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: 4, margin: 0 }}>
                      热量：{record.calories} kcal
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>蛋白质：{record.protein}g</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>碳水：{record.carbs}g</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>脂肪：{record.fat}g</p>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 8 }}>
                      食物：{record.foods.map((f: any) => f.name).join('、')}
                    </p>
                  </div>
                  {record.notes && (
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: 8 }}>
                      <span style={{ color: '#6b7280' }}>📝</span> {record.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
