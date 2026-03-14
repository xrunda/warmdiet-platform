import { Meal } from '../types';

export type { Meal };

export type AlertItem = {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  suggestion: string;
};

export type TomorrowMealOption = {
  menu: string;
  reason: string;
  type: '早餐' | '午餐' | '晚餐';
  time: string;
};

export type VitalStatus = 'normal' | 'high' | 'low';

export type VitalSummaryItem = {
  metricType: 'blood_pressure' | 'blood_glucose';
  value: string | number;
  unit: string;
  measuredAt: string;
  measurementDate: string;
  sourceType: string;
  status: VitalStatus;
  glucoseContextLabel?: string;
};

export type VitalSummary = {
  latestBloodPressure: VitalSummaryItem | null;
  latestBloodGlucose: VitalSummaryItem | null;
  recentCount: number;
};

export type AIConsultationReportItem = {
  id: string;
  title: string;
  hospitalName: string;
  reportUrl: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  summary: string;
  sourceMaterials: string[];
};

export type BufferedFile = {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';
