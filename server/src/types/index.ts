/**
 * 服务器端类型定义
 */

// 授权类型
export type AuthorizationType = 'meal_records' | 'health_reports' | 'chat_logs';

// 数据范围
export type DataRange = 'recent_7d' | 'recent_30d' | 'recent_90d' | 'all';

// 授权状态
export type AuthorizationStatus = 'active' | 'revoked' | 'expired';

// 订阅套餐类型
export type PlanType = 'basic' | 'professional' | 'enterprise';

// 订阅状态
export type SubscriptionStatus = 'active' | 'suspended' | 'expired';

// 账单周期
export type BillingCycle = 'monthly' | 'yearly';

// 餐食类型
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// 性别
export type Gender = 'male' | 'female';

// 医院账号
export interface HospitalAccount {
  id: string;
  hospitalName: string;
  hospitalId: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  maxDoctors: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  billingCycle: BillingCycle;
  createdAt: string;
  updatedAt: string;
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
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// 患者账号
export interface PatientAccount {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone?: string;
  email?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 授权记录
export interface DoctorAuthorization {
  id: string;
  patientId: string;
  doctorId: string;
  authorizationType: AuthorizationType[];
  authorizedAt: string;
  expiresAt?: string;
  status: AuthorizationStatus;
  scopeDataStart: string;
  scopeDataEnd?: string;
  scopeDataRange: DataRange;
  ipAddress?: string;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
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

// 餐食记录
export interface MealRecord {
  id: string;
  patientId: string;
  mealType: MealType;
  mealDate: string;
  mealTime: string;
  foods: string; // JSON string
  nutritionScore: number;
  calories: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 健康报告
export interface HealthReport {
  id: string;
  patientId: string;
  reportDate: string;
  startDate: string;
  endDate: string;
  nutritionScore: number;
  trends: string; // JSON string
  recommendations: string; // JSON string
  createdAt: string;
}

// 访问日志
export interface AccessLog {
  id: string;
  doctorId: string;
  patientId: string;
  hospitalId: string;
  dataType: string;
  accessedAt: string;
}

// 患者健康状况
export interface PatientHealthCondition {
  id: string;
  patientId: string;
  conditionName: string;
  conditionType: 'disease' | 'surgery' | 'allergy';
  diagnosedDate?: string;
  notes?: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

// 患者用药记录
export interface PatientMedication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  packageImage?: string;
  ocrText?: string;
  imageUploadedAt?: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

// 患者饮食偏好
export interface PatientPreference {
  id: string;
  patientId: string;
  tastePreferences: string;
  likedFoods: string;
  dislikedFoods: string;
  createdAt: string;
  updatedAt: string;
}

// 患者医嘱
export interface PatientMedicalOrder {
  id: string;
  patientId: string;
  content: string;
  doctorName: string;
  orderDate: string;
  hospitalName?: string;
  visitDate?: string;
  originalImage?: string;
  rawOcrText?: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

// 饮食预警
export interface DietAlert {
  id: string;
  patientId: string;
  mealId?: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  suggestion: string;
  alertDate: string;
  isRead: number;
  createdAt: string;
}

// 对话记录
export interface ConversationLog {
  id: string;
  patientId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  logDate: string;
  extra?: string;
  createdAt: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  type: 'hospital' | 'doctor' | 'patient';
  hospitalId?: string;
  iat?: number;
  exp?: number;
}

// API 响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}