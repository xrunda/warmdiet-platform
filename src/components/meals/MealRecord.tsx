/**
 * 餐食记录组件
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

interface Food {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealDate: string;
  mealTime: string;
  foods: Food[];
  nutritionScore: number;
  calories: number;
  notes?: string;
}

export function MealRecord() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadMeals();
  }, [user]);

  const loadMeals = async () => {
    if (!user?.userId) return;

    try {
      const response: any = await api.getMeals(user.userId);
      setMeals(response.data || []);
    } catch (err: any) {
      error(err.message || '加载餐食记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    if (!confirm('确定要删除这条餐食记录吗？')) return;

    try {
      await api.deleteMeal(user!.userId, mealId);
      success('餐食记录已删除');
      loadMeals();
    } catch (err: any) {
      error(err.message || '删除失败');
    }
  };

  const getMealTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      breakfast: '🌅 早餐',
      lunch: '☀️ 午餐',
      dinner: '🌙 晚餐',
      snack: '🍪 加餐',
    };
    return labels[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🍽️ 餐食记录</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + 添加餐食
        </button>
      </div>

      {meals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">暂无餐食记录，点击"添加餐食"开始记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              getMealTypeLabel={getMealTypeLabel}
              getScoreColor={getScoreColor}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMealModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadMeals();
            success('餐食记录添加成功');
          }}
        />
      )}
    </div>
  );
}

function MealCard({
  meal,
  getMealTypeLabel,
  getScoreColor,
  onDelete,
}: {
  meal: Meal;
  getMealTypeLabel: (type: string) => string;
  getScoreColor: (score: number) => string;
  onDelete: (id: string) => void;
}) {
  const totalCalories = meal.calories;
  const totalProtein = meal.foods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFat = meal.foods.reduce((sum, f) => sum + f.fat, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {getMealTypeLabel(meal.mealType)}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(meal.mealDate).toLocaleDateString()} · {meal.mealTime}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColor(meal.nutritionScore)}`}>
            {meal.nutritionScore}分
          </p>
          <p className="text-xs text-gray-500">营养评分</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">食物清单</h4>
        <div className="space-y-1">
          {meal.foods.map((food, idx) => (
            <div key={idx} className="text-sm text-gray-600 flex justify-between">
              <span>
                {food.name} · {food.amount}{food.unit}
              </span>
              <span>{food.calories} kcal</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-lg font-bold text-gray-800">{totalCalories}</p>
          <p className="text-xs text-gray-500">热量</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-lg font-bold text-blue-600">{totalProtein.toFixed(1)}g</p>
          <p className="text-xs text-gray-500">蛋白质</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-lg font-bold text-yellow-600">{totalCarbs.toFixed(1)}g</p>
          <p className="text-xs text-gray-500">碳水</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-lg font-bold text-red-600">{totalFat.toFixed(1)}g</p>
          <p className="text-xs text-gray-500">脂肪</p>
        </div>
      </div>

      {meal.notes && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-medium">备注：</span>
          {meal.notes}
        </div>
      )}

      <button
        onClick={() => onDelete(meal.id)}
        className="text-sm text-red-600 hover:text-red-700"
      >
        删除记录
      </button>
    </div>
  );
}

function AddMealModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    mealDate: new Date().toISOString().split('T')[0],
    mealTime: new Date().toTimeString().slice(0, 5),
    foods: [] as Food[],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const { error } = useToast();
  const { user } = useAuth();

  const addFood = () => {
    setFormData({
      ...formData,
      foods: [...formData.foods, {
        name: '',
        amount: 100,
        unit: 'g',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }],
    });
  };

  const updateFood = (index: number, field: keyof Food, value: any) => {
    const newFoods = [...formData.foods];
    newFoods[index][field] = value;
    setFormData({ ...formData, foods: newFoods });
  };

  const removeFood = (index: number) => {
    setFormData({
      ...formData,
      foods: formData.foods.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.foods.length === 0) {
      error('请至少添加一种食物');
      return;
    }

    const totalCalories = formData.foods.reduce((sum, f) => sum + f.calories, 0);
    const nutritionScore = Math.min(100, Math.max(0, 100 - (totalCalories > 800 ? (totalCalories - 800) / 20 : 0)));

    try {
      setLoading(true);
      await api.createMeal(user!.userId, {
        ...formData,
        foods: formData.foods,
        nutritionScore: Math.round(nutritionScore),
        calories: totalCalories,
      });
      onSuccess();
    } catch (err: any) {
      error(err.message || '添加餐食失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">添加餐食记录</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                餐食类型 *
              </label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="breakfast">早餐</option>
                <option value="lunch">午餐</option>
                <option value="dinner">晚餐</option>
                <option value="snack">加餐</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用餐时间 *
              </label>
              <input
                type="time"
                value={formData.mealTime}
                onChange={(e) => setFormData({ ...formData, mealTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期 *
            </label>
            <input
              type="date"
              value={formData.mealDate}
              onChange={(e) => setFormData({ ...formData, mealDate: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                食物清单 *
              </label>
              <button
                type="button"
                onClick={addFood}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 添加食物
              </button>
            </div>

            {formData.foods.map((food, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 mb-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">食物 {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFood(idx)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="食物名称"
                    value={food.name}
                    onChange={(e) => updateFood(idx, 'name', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="数量"
                    value={food.amount}
                    onChange={(e) => updateFood(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <select
                    value={food.unit}
                    onChange={(e) => updateFood(idx, 'unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="g">克 (g)</option>
                    <option value="ml">毫升 (ml)</option>
                    <option value="个">个</option>
                    <option value="碗">碗</option>
                    <option value="份">份</option>
                  </select>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">热量</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={food.calories}
                      onChange={(e) => updateFood(idx, 'calories', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">蛋白质</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={food.protein}
                      onChange={(e) => updateFood(idx, 'protein', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">碳水</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={food.carbs}
                      onChange={(e) => updateFood(idx, 'carbs', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">脂肪</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={food.fat}
                      onChange={(e) => updateFood(idx, 'fat', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="可选备注信息"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || formData.foods.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}