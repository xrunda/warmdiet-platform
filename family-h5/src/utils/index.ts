import React, { useState } from 'react';
import type { Meal, VitalStatus } from '../types/app';

// ========== FOOD NAME DICTIONARY ==========

export const FOOD_NAME_ZH: Record<string, string> = {
  banana: '香蕉', apple: '苹果', orange: '橙子', grape: '葡萄', watermelon: '西瓜', pear: '梨', peach: '桃子', mango: '芒果', strawberry: '草莓', kiwi: '猕猴桃', cherry: '樱桃', lemon: '柠檬', pineapple: '菠萝', papaya: '木瓜', blueberry: '蓝莓', plum: '李子', pomegranate: '石榴', fig: '无花果', lychee: '荔枝', longan: '龙眼', coconut: '椰子', cantaloupe: '哈密瓜', durian: '榴莲', persimmon: '柿子', tangerine: '橘子', avocado: '牛油果',
  rice: '米饭', noodles: '面条', noodle: '面条', porridge: '粥', congee: '粥', bread: '面包', steamed_bun: '馒头', mantou: '馒头', bun: '包子', dumpling: '饺子', dumplings: '饺子', wonton: '馄饨', pancake: '煎饼', fried_rice: '炒饭', millet_porridge: '小米粥', oatmeal: '燕麦粥', toast: '吐司', pasta: '意面',
  egg: '鸡蛋', eggs: '鸡蛋', boiled_egg: '煮鸡蛋', steamed_egg: '蒸蛋', tea_egg: '茶叶蛋', fried_egg: '煎蛋', omelette: '蛋饼', scrambled_eggs: '炒鸡蛋',
  milk: '牛奶', yogurt: '酸奶', soy_milk: '豆浆', soymilk: '豆浆', juice: '果汁',
  tofu: '豆腐', bean_curd: '豆腐',
  chicken: '鸡肉', pork: '猪肉', beef: '牛肉', lamb: '羊肉', duck: '鸭肉', fish: '鱼', shrimp: '虾', prawn: '虾', crab: '螃蟹',
  'lean pork': '瘦肉', 'lean meat': '瘦肉', 'pork belly': '五花肉', 'braised pork': '红烧肉', 'roast duck': '烤鸭', 'steamed fish': '清蒸鱼', 'grilled fish': '烤鱼',
  'chicken breast': '鸡胸肉', 'chicken wing': '鸡翅', 'chicken leg': '鸡腿', 'pork ribs': '排骨', 'spare ribs': '排骨', 'beef steak': '牛排', steak: '牛排',
  spinach: '菠菜', cabbage: '白菜', broccoli: '西兰花', carrot: '胡萝卜', tomato: '番茄', cucumber: '黄瓜', potato: '土豆', corn: '玉米', lettuce: '生菜', celery: '芹菜', onion: '洋葱', garlic: '大蒜', ginger: '姜', pepper: '辣椒', mushroom: '蘑菇', eggplant: '茄子', pumpkin: '南瓜', zucchini: '西葫芦', asparagus: '芦笋', pea: '豌豆', peas: '豌豆', bean: '豆子', beans: '豆子', 'green beans': '青豆', 'sweet potato': '红薯', radish: '萝卜', turnip: '萝卜', bamboo_shoot: '竹笋', 'bok choy': '青菜', 'chinese cabbage': '大白菜',
  soup: '汤', salad: '沙拉', stew: '炖菜', 'vegetable soup': '蔬菜汤', 'egg soup': '蛋花汤', 'bone soup': '骨头汤',
  cookie: '饼干', cookies: '饼干', cake: '蛋糕', chocolate: '巧克力', candy: '糖果', ice_cream: '冰淇淋', 'ice cream': '冰淇淋', pudding: '布丁', pie: '馅饼',
  tea: '茶', coffee: '咖啡', water: '水', beer: '啤酒', wine: '葡萄酒',
  sausage: '香肠', ham: '火腿', bacon: '培根', 'fried chicken': '炸鸡', hamburger: '汉堡', sandwich: '三明治', pizza: '披萨',
  walnut: '核桃', peanut: '花生', peanuts: '花生', almond: '杏仁', cashew: '腰果', sesame: '芝麻',
  honey: '蜂蜜', sugar: '糖', salt: '盐', vinegar: '醋', 'soy sauce': '酱油', oil: '油', butter: '黄油', cheese: '奶酪',
};

export function translateFoodName(name: string): string {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  return FOOD_NAME_ZH[lower] || name;
}

// ========== CONSTANTS ==========

export const FOOD_LIBRARY = [
  { category: '主食', items: ['米饭', '面条', '粥', '馒头', '全麦面包', '杂粮粥', '小米粥', '红薯'] },
  { category: '蛋白质', items: ['鸡蛋', '蒸蛋', '豆腐', '鱼肉', '鸡胸肉', '虾仁', '牛奶', '豆浆'] },
  { category: '蔬菜', items: ['菠菜', '小白菜', '西兰花', '胡萝卜', '番茄', '黄瓜', '青菜', '冬瓜'] },
  { category: '肉类', items: ['猪肉', '牛肉', '鸡肉', '排骨', '红烧肉', '鱼片', '虾'] },
  { category: '汤品', items: ['蔬菜汤', '紫菜蛋花汤', '鱼汤', '骨头汤', '番茄蛋汤', '冬瓜汤'] },
];

export const MEAL_SCHEDULES = [
  { key: 'breakfast', label: '早餐', emoji: '🌅' },
  { key: 'lunch', label: '午餐', emoji: '☀️' },
  { key: 'dinner', label: '晚餐', emoji: '🌙' },
] as const;

export const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const MOCK_AI_CONSULTATION_REPORTS: any[] = [];

// ========== FORMATTERS ==========

export function formatTrendDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_LABELS[d.getDay()] || dateStr;
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatChatTimestamp(logDate?: string, timestamp?: string) {
  if (!timestamp) return '';
  if (!logDate) return timestamp.slice(0, 5);
  const normalized = /^\d{2}:\d{2}:\d{2}$/.test(timestamp) ? timestamp : `${timestamp}:00`;
  const dt = new Date(`${logDate}T${normalized}`);
  if (Number.isNaN(dt.getTime())) return timestamp.slice(0, 5);
  const dateLabel = formatDateLabel(logDate);
  return `${dateLabel} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export function formatMeasuredTime(dateTime?: string) {
  if (!dateTime) return '暂无记录';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function parseMealTimeStamp(value?: string) {
  if (!value) return new Date(0);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const fallback = new Date(`1970-01-01T${value}`);
  return fallback;
}

export function formatMealRecordTime(value?: string) {
  if (!value) return '暂无时间';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return value;
}

// ========== HELPERS ==========

export function getVitalTone(status?: VitalStatus) {
  if (status === 'high') {
    return {
      pill: 'bg-[#fff0eb] text-[#c2512f]',
      card: 'border-[#ffd1c2] bg-[linear-gradient(135deg,#fff8f5_0%,#fff3ef_100%)]',
      text: 'text-[#9c3d1f]',
      badge: '偏高',
    };
  }

  if (status === 'low') {
    return {
      pill: 'bg-[#eef6ff] text-[#2a67a7]',
      card: 'border-[#cfe4ff] bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)]',
      text: 'text-[#2a67a7]',
      badge: '偏低',
    };
  }

  return {
    pill: 'bg-[#edf9f1] text-[#1d7a48]',
    card: 'border-[#caecd7] bg-[linear-gradient(135deg,#fbfffc_0%,#f1faf5_100%)]',
    text: 'text-[#226847]',
    badge: '平稳',
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

export function mapApiMealToMeal(apiMeal: any): Meal {
  const foods: any[] = apiMeal.foods || [];
  return {
    id: String(apiMeal.id),
    type: apiMeal.mealType || apiMeal.meal_type,
    time: apiMeal.mealTime || apiMeal.meal_time || '',
    items: foods.map((f: any) => translateFoodName(f.name)),
    calories: apiMeal.calories || 0,
    protein: foods.reduce((s: number, f: any) => s + (f.protein || 0), 0),
    fat: foods.reduce((s: number, f: any) => s + (f.fat || 0), 0),
    carbs: foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0),
    analysis: apiMeal.notes || '',
    isWarning: (apiMeal.nutritionScore ?? apiMeal.nutrition_score ?? 100) < 70,
  };
}

// ========== MARKDOWN RENDERER ==========

/** 简易 Markdown 渲染（Tailwind 版）：将文本按段落、标题、列表等拆分为 React 元素 */
export function renderFormattedTextH5(text: string) {
  if (!text) return null;
  const lines = text.split(/\n/);
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      React.createElement('ul', { key: key++, className: 'my-2 pl-5 list-disc space-y-0.5' },
        listBuffer.map((item, i) =>
          React.createElement('li', { key: i, className: 'text-sm text-gray-700 leading-relaxed' }, renderInline(item))
        )
      )
    );
    listBuffer = [];
  };

  const renderInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIdx = 0;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIdx) parts.push(line.slice(lastIdx, match.index));
      parts.push(React.createElement('strong', { key: `b${match.index}`, className: 'text-gray-900 font-bold' }, match[1]));
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < line.length) parts.push(line.slice(lastIdx));
    return parts.length > 0 ? React.createElement(React.Fragment, null, ...parts) : line;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      elements.push(React.createElement('div', { key: key++, className: 'h-2' }));
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const level = (line.match(/^(#+)/)?.[1]?.length) || 1;
      const headingText = line.replace(/^#{1,3}\s*/, '');
      const cls = level === 1
        ? 'text-base font-bold text-gray-900 mt-4 mb-1 pb-1.5 border-b border-gray-100'
        : level === 2
        ? 'text-[15px] font-bold text-gray-900 mt-3 mb-1 pb-1 border-b border-gray-50'
        : 'text-sm font-bold text-gray-800 mt-2 mb-0.5';
      elements.push(React.createElement('div', { key: key++, className: cls }, renderInline(headingText)));
      continue;
    }

    if (/^[-*•]\s/.test(line)) {
      listBuffer.push(line.replace(/^[-*•]\s*/, ''));
      continue;
    }

    if (/^\d+[.、)]\s/.test(line)) {
      listBuffer.push(line);
      continue;
    }

    flushList();
    elements.push(
      React.createElement('p', { key: key++, className: 'text-sm text-gray-700 leading-relaxed my-1' }, renderInline(line))
    );
  }
  flushList();
  return React.createElement(React.Fragment, null, ...elements);
}
