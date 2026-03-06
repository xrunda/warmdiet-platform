/**
 * 三餐管家 - 类型定义
 */

// 授权类型
export type AuthorizationType = 'meal_records' | 'health_reports' | 'chat_logs';

// 数据范围
export type DataRange = 'recent_7d' | 'recent_30d' | 'recent_90d' | 'all';

// 授权状态
export type AuthorizationStatus = 'active' | 'revoked' | 'expired';

// 授权记录
export interface DoctorAuthorization {
  id: string;
  // 医生信息
  doctorId: string;
  doctorName: string;
  hospital: string;
  department: string;
  licenseNumber: string;
  // 授权信息
  patientId: string;
  authorizationType: AuthorizationType[];
  authorizedAt: string;
  expiresAt?: string;
  status: AuthorizationStatus;
  // 授权详情
  scope: {
    startDate: string;
    endDate?: string;
    dataRange: DataRange;
  };
  // 审计信息
  ipAddress?: string;
  deviceId?: string;
  lastAccessedAt?: string;
  accessCount?: number;
}

// 医生信息
export interface DoctorProfile {
  id: string;
  name: string;
  hospital: string;
  department: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  avatar?: string;
  specialization?: string[];
  verified: boolean;
}

// 授权日志
export interface AuthorizationLog {
  id: string;
  authorizationId: string;
  action: 'granted' | 'revoked' | 'extended' | 'viewed';
  operator: 'patient' | 'doctor' | 'system';
  operatorId: string;
  timestamp: string;
  details?: string;
}

// 医院账号
export interface HospitalAccount {
  id: string;
  hospitalName: string;
  hospitalId: string;          // 医院统一社会信用代码
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  planType: 'basic' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'expired';
  maxDoctors: number;
  subscribedDoctors: string[];
  subscriptionStart: string;
  subscriptionEnd: string;
  billingCycle: 'monthly' | 'yearly';
}

// 医生账号
export interface DoctorAccount {
  id: string;
  hospitalId: string;
  name: string;
  licenseNumber: string;
  department: string;
  accountStatus: 'active' | 'suspended';
  canAccessPatientData: boolean;
}

// 患者信息
export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone?: string;
  email?: string;
  avatar?: string;
  medicalConditions?: string[];
  allergies?: string[];
}

// 餐食记录
export interface MealRecord {
  id: string;
  patientId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealDate: string;
  mealTime: string;
  foods: FoodItem[];
  nutritionScore: number;
  calories: number;
  notes?: string;
}

// 食物项
export interface FoodItem {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// 健康报告
export interface HealthReport {
  id: string;
  patientId: string;
  reportDate: string;
  startDate: string;
  endDate: string;
  nutritionScore: number;
  trends: NutritionTrend[];
  recommendations: string[];
}

// 营养趋势
export interface NutritionTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  score: number;
}