/**
 * 餐食记录 - 纯 CSS 版本
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';

type FoodItem = {
  name: string;
  amount: string;
  calories: number;
};

type MealEntry = {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  mealType: string;
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
};

type VitalItem = {
  metricType: 'blood_pressure' | 'blood_glucose';
  systolicValue?: number;
  diastolicValue?: number;
  glucoseValue?: number;
  measuredAt?: string;
  measurementDate?: string;
};

type DailySummary = {
  key: string;
  patientId: string;
  patientName: string;
  date: string;
  meals: MealEntry[];
  totalCalories: number;
  avgNutrition: { protein: number; carbs: number; fat: number };
  latestBloodPressure?: { systolic: number; diastolic: number; measuredAt: string };
  latestBloodGlucose?: { value: number; measuredAt: string };
};

function formatMinute(timeOrDatetime?: string): string {
  if (!timeOrDatetime) return '--:--';

  // HH:MM[:SS]
  const pureTime = String(timeOrDatetime).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(pureTime)) {
    return pureTime.slice(0, 5);
  }

  const d = new Date(pureTime);
  if (Number.isNaN(d.getTime())) return '--:--';
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
}

function resolveDate(input?: string): string {
  if (!input) return '';
  if (input.includes('T')) return input.split('T')[0];
  return input.slice(0, 10);
}

function parseFoods(raw: any): FoodItem[] {
  const arr = Array.isArray(raw)
    ? raw
    : (() => {
        try {
          return JSON.parse(raw || '[]');
        } catch {
          return [];
        }
      })();

  return (arr || []).map((f: any) => ({
    name: f?.name || '未知食物',
    amount: `${f?.amount ?? ''}${f?.unit || ''}`,
    calories: Number(f?.calories || 0),
  }));
}

export function MealRecord() {
  const [dayRecords, setDayRecords] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(null);

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

      const allRecords: MealEntry[] = [];
      const vitalByPatientDate = new Map<string, VitalItem[]>();

      for (const pid of patientIds) {
        try {
          const [mealsRes, vitalsRes]: any = await Promise.all([
            api.getMeals(pid),
            api.getVitalMeasurements(pid, { days: 30 }),
          ]);

          const meals = mealsRes.data || [];
          const vitals = vitalsRes.data || [];

          for (const v of vitals) {
            const d = resolveDate(v.measurementDate || v.measuredAt);
            if (!d) continue;
            const key = `${pid}__${d}`;
            const list = vitalByPatientDate.get(key) || [];
            list.push(v as VitalItem);
            vitalByPatientDate.set(key, list);
          }

          for (const meal of meals) {
            const foods = parseFoods(meal.foods);
            const date = resolveDate(meal.mealDate || meal.createdAt || '');
            const time = formatMinute(meal.mealTime || meal.createdAt || '');

            allRecords.push({
              id: meal.id,
              patientId: pid,
              patientName: pid,
              date,
              time,
              mealType: meal.mealType,
              foods,
              calories: meal.calories || foods.reduce((s: number, f: any) => s + (f.calories || 0), 0),
              protein: foods.reduce((s: number, f: any) => s + (f.protein || 0), 0),
              carbs: foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0),
              fat: foods.reduce((s: number, f: any) => s + (f.fat || 0), 0),
              notes: meal.notes,
            });
          }
        } catch { /* skip patient with no meals */ }
      }

      const grouped = new Map<string, DailySummary>();
      for (const r of allRecords) {
        const key = `${r.patientId}__${r.date}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            patientId: r.patientId,
            patientName: r.patientName,
            date: r.date,
            meals: [],
            totalCalories: 0,
            avgNutrition: { protein: 0, carbs: 0, fat: 0 },
          });
        }
        const g = grouped.get(key)!;
        g.meals.push(r);
        g.totalCalories += r.calories || 0;
        g.avgNutrition.protein += r.protein || 0;
        g.avgNutrition.carbs += r.carbs || 0;
        g.avgNutrition.fat += r.fat || 0;
      }

      for (const [key, summary] of grouped) {
        summary.meals.sort((a, b) => `${b.time}`.localeCompare(`${a.time}`));

        const v = (vitalByPatientDate.get(key) || []).slice().sort((a, b) => {
          const ta = new Date(a.measuredAt || '').getTime();
          const tb = new Date(b.measuredAt || '').getTime();
          return tb - ta;
        });
        const bp = v.find((x) => x.metricType === 'blood_pressure');
        const bg = v.find((x) => x.metricType === 'blood_glucose');

        if (bp?.systolicValue != null && bp?.diastolicValue != null) {
          summary.latestBloodPressure = {
            systolic: Number(bp.systolicValue),
            diastolic: Number(bp.diastolicValue),
            measuredAt: formatMinute(bp.measuredAt),
          };
        }
        if (bg?.glucoseValue != null) {
          summary.latestBloodGlucose = {
            value: Number(bg.glucoseValue),
            measuredAt: formatMinute(bg.measuredAt),
          };
        }
      }

      const summaries = Array.from(grouped.values()).sort((a, b) => `${b.date}`.localeCompare(`${a.date}`));
      setDayRecords(summaries);
    } catch (err) {
      console.error('Failed to load meals:', err);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const stats = {
    totalDays: dayRecords.length,
    totalMeals: dayRecords.reduce((sum, d) => sum + d.meals.length, 0),
    todayRecords: dayRecords.filter(r => r.date === today).length,
    totalCalories: dayRecords.reduce((sum, r) => sum + r.totalCalories, 0),
    avgCalories: dayRecords.length > 0
      ? Math.round(dayRecords.reduce((sum, r) => sum + r.totalCalories, 0) / dayRecords.length)
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

  const filteredRecords = dayRecords.filter(record => {
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
    const matchesType =
      mealTypeFilter === 'all' ||
      record.meals.some((m) => m.mealType === mealTypeFilter);

    const allFoodNames = record.meals.flatMap((m) => m.foods.map((f) => f.name)).join(' ');
    const matchesSearch =
      searchTerm === '' ||
      record.patientName.includes(searchTerm) ||
      allFoodNames.includes(searchTerm);

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
          { label: '汇总天数', value: stats.totalDays, icon: '📊', color: '#64748b', bgLight: '#f1f5f9' },
          { label: '今日记录天数', value: stats.todayRecords, icon: '📅', color: '#3b82f6', bgLight: '#bfdbfe' },
          { label: '餐食总条数', value: stats.totalMeals, icon: '🍽️', color: '#8b5cf6', bgLight: '#ede9fe' },
          { label: '平均热量', value: `${stats.avgCalories} kcal`, icon: '🔥', color: '#f97316', bgLight: '#fee2e2' },
          { label: '总摄入热量', value: `${stats.totalCalories} kcal`, icon: '📦', color: '#ef4444', bgLight: '#fee2e2' },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredRecords.map((record, idx) => {
              const calorieLevel = getCalorieLevel(record.totalCalories);
              return (
                <div
                  key={record.key}
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
                        📅
                      </div>
                      <div>
                        <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '14px', margin: 0 }}>{record.patientName}</p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>• {record.date}</p>
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
                      当日总热量：{record.totalCalories} kcal
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0' }}>记录条数：{record.meals.length} 条</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0' }}>蛋白质：{record.avgNutrition.protein}g</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0' }}>碳水：{record.avgNutrition.carbs}g</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0' }}>脂肪：{record.avgNutrition.fat}g</p>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 8 }}>
                      当日食物：{Array.from(new Set(record.meals.flatMap((m: MealEntry) => m.foods.map((f) => f.name)))).join('、') || '暂无'}
                    </p>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
                    <span>血压：{record.latestBloodPressure ? `${record.latestBloodPressure.systolic}/${record.latestBloodPressure.diastolic} (${record.latestBloodPressure.measuredAt})` : '暂无'}</span>
                    <span>血糖：{record.latestBloodGlucose ? `${record.latestBloodGlucose.value} (${record.latestBloodGlucose.measuredAt})` : '暂无'}</span>
                  </div>

                  <button
                    onClick={() => setSelectedDay(record)}
                    style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #bae6fd',
                      background: '#f0f9ff',
                      color: '#0369a1',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    查看当日三餐与指标详情
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDay && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDay(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{ width: '100%', maxWidth: 900, maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>{selectedDay.patientName} · {selectedDay.date}</h3>
              <button onClick={() => setSelectedDay(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 16, fontSize: 13, color: '#475569' }}>
              <span>当日总热量：{selectedDay.totalCalories} kcal</span>
              <span>血压：{selectedDay.latestBloodPressure ? `${selectedDay.latestBloodPressure.systolic}/${selectedDay.latestBloodPressure.diastolic} (${selectedDay.latestBloodPressure.measuredAt})` : '暂无'}</span>
              <span>血糖：{selectedDay.latestBloodGlucose ? `${selectedDay.latestBloodGlucose.value} mmol/L (${selectedDay.latestBloodGlucose.measuredAt})` : '暂无'}</span>
            </div>

            {['breakfast', 'lunch', 'dinner', 'snack'].map((mt) => {
              const list = selectedDay.meals.filter((m) => m.mealType === mt);
              const labelMap: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
              return (
                <div key={mt} style={{ marginBottom: 14, border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: 0, marginBottom: 10, fontWeight: 700, color: '#1e293b' }}>{labelMap[mt]}（{list.length} 条）</p>
                  {list.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>无记录</p>
                  ) : (
                    list.map((m) => (
                      <div key={m.id} style={{ background: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>记录时间：{m.time}（精确到分）</p>
                        <p style={{ margin: '4px 0', fontSize: 13, color: '#334155' }}>食物：{m.foods.map((f) => f.name).join('、') || '暂无'}</p>
                        <p style={{ margin: '4px 0', fontSize: 12, color: '#64748b' }}>热量 {m.calories} kcal · 蛋白质 {m.protein}g · 碳水 {m.carbs}g · 脂肪 {m.fat}g</p>
                        {m.notes ? <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>备注：{m.notes}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
