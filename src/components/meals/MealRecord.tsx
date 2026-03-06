/**
 * 餐食记录 - 纯 CSS 版本
 */

import { useState } from 'react';

export function MealRecord() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');

  const mockMealRecords = [
    {
      id: '1',
      patientName: '张三',
      date: '2024-03-06',
      mealType: 'breakfast',
      foods: [
        { name: '牛奶', amount: '250ml', calories: 150 },
        { name: '全麦面包', amount: '2片', calories: 180 },
        { name: '鸡蛋', amount: '2个', calories: 140 },
      ],
      calories: 470,
      protein: 22,
      carbs: 45,
      fat: 18,
      notes: '营养搭配合理',
    },
    {
      id: '2',
      patientName: '李四',
      date: '2024-03-05',
      mealType: 'lunch',
      foods: [
        { name: '米饭', amount: '1碗', calories: 200 },
        { name: '清蒸鱼', amount: '200g', calories: 150 },
        { name: '炒青菜', amount: '200g', calories: 60 },
      ],
      calories: 410,
      protein: 28,
      carbs: 65,
      fat: 15,
      notes: '午餐控制得很好',
    },
    {
      id: '3',
      patientName: '王五',
      date: '2024-03-06',
      mealType: 'dinner',
      foods: [
        { name: '小米粥', amount: '1碗', calories: 80 },
        { name: '凉拌黄瓜', amount: '200g', calories: 40 },
        { name: '煮鸡蛋', amount: '1个', calories: 70 },
      ],
      calories: 190,
      protein: 12,
      carbs: 28,
      fat: 6,
      notes: '晚餐清淡健康',
    },
    {
      id: '4',
      patientName: '赵六',
      date: '2024-03-05',
      mealType: 'breakfast',
      foods: [
        { name: '豆浆', amount: '250ml', calories: 80 },
        { name: '包子', amount: '3个', calories: 270 },
      ],
      calories: 350,
      protein: 18,
      carbs: 48,
      fat: 12,
      notes: '碳水化合物较高',
    },
    {
      id: '5',
      patientName: '张三',
      date: '2024-03-06',
      mealType: 'lunch',
      foods: [
        { name: '面条', amount: '1碗', calories: 220 },
        { name: '红烧牛肉', amount: '150g', calories: 300 },
        { name: '炒时蔬', amount: '200g', calories: 80 },
      ],
      calories: 600,
      protein: 35,
      carbs: 75,
      fat: 25,
      notes: '午餐热量偏高',
    },
  ];

  const stats = {
    total: mockMealRecords.length,
    todayRecords: mockMealRecords.filter(r => r.date === '2024-03-06').length,
    totalCalories: mockMealRecords.reduce((sum, r) => sum + r.calories, 0),
    avgCalories: Math.round(mockMealRecords.reduce((sum, r) => sum + r.calories, 0) / mockMealRecords.length),
  };

  const getCalorieLevel = (calories: number) => {
    if (calories < 300) return { label: '低热量', color: '#10b981', bg: '#d1fae5' };
    if (calories < 500) return { label: '中等热量', color: '#3b82f6', bg: '#bfdbfe' };
    return { label: '高热量', color: '#f97316', bg: '#fee2e2' };
  };

  const getMealTypeIcon = (type: string) => {
    const icons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍪',
    };
    return icons[type] || breakfast;
  };

  const filteredRecords = mockMealRecords.filter(record => {
    const matchesDate = dateFilter === 'all' || (dateFilter === 'today' && record.date === '2024-03-06');
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
        ].map((stat, idx) => (
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
                  {stat.value}
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
                      食物：{record.foods.map((f) => f.name).join('、')}
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
