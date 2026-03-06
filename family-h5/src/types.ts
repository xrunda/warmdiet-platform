export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  items: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  analysis?: string;
  isWarning?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  extra?: {
    type: 'alert' | 'recommendation';
    title: string;
    text: string;
    items?: string[];
  };
}

export interface ElderlyProfile {
  name: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female';
  surgeries: string[];
  chronicDiseases: string[];
  preferences: {
    taste: {
      light: boolean;
      salty: boolean;
      spicy: boolean;
    };
    likedFoods: string[];
    dislikedFoods: string[];
    mealTimes: {
      breakfast: string;
      lunch: string;
      dinner: string;
    };
  };
}

// ============ 医生授权相关类型 ============

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
  status: 'active' | 'revoked' | 'expired';
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

export type AuthorizationType = 'meal_records' | 'health_reports' | 'chat_logs';
export type DataRange = 'recent_7d' | 'recent_30d' | 'recent_90d' | 'all';

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

export interface AuthorizationLog {
  id: string;
  authorizationId: string;
  action: 'granted' | 'revoked' | 'extended' | 'viewed';
  operator: 'patient' | 'doctor' | 'system';
  operatorId: string;
  timestamp: string;
  details?: string;
}
