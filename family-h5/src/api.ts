import { notifyAuthExpired, shouldRefreshDemoSession } from './authSession';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Token 管理
const TOKEN_KEY = 'family_patient_token';

interface AuthData {
  token: string;
  patientId: string;
  name?: string;
  phone?: string;
  age?: number;
  gender?: string;
}

function getStoredAuth(): AuthData | null {
  const cached = localStorage.getItem(TOKEN_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
  return null;
}

function setStoredAuth(data: AuthData): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  const auth = getStoredAuth();
  return !!auth?.token;
}

export function getCurrentPatientId(): string | null {
  const auth = getStoredAuth();
  return auth?.patientId || null;
}

export function getCurrentUser(): { name?: string; phone?: string } | null {
  const auth = getStoredAuth();
  if (!auth) return null;
  return { name: auth.name, phone: auth.phone };
}

// 登录
export async function login(phone: string, password: string): Promise<AuthData> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '登录失败');
  }
  setStoredAuth(json.data);
  return json.data;
}

// 注册
export async function register(data: {
  phone: string;
  password: string;
  name: string;
  age?: number;
  gender?: string;
}): Promise<AuthData> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '注册失败');
  }
  setStoredAuth(json.data);
  return json.data;
}

// 登出
export function logout(): void {
  clearStoredAuth();
}

// 获取用户信息
export async function fetchProfile(): Promise<{ name: string; phone: string; age: number; gender: string }> {
  const auth = getStoredAuth();
  if (!auth?.token) {
    throw new Error('未登录');
  }
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '获取用户信息失败');
  }
  return json.data;
}

// 内部请求方法
async function refreshDemoAuth(): Promise<AuthData> {
  const res = await fetch(`${API_BASE_URL}/demo/patient-token`, { method: 'POST' });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '刷新测试患者登录状态失败');
  }
  setStoredAuth(json.data);
  return json.data;
}

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: any } = {},
  allowDemoRefresh = true
): Promise<T> {
  const auth = getStoredAuth();
  if (!auth?.token) {
    throw new Error('请先登录');
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // 401 时自动登出
  if (res.status === 401) {
    if (allowDemoRefresh && shouldRefreshDemoSession(auth.patientId, import.meta.env.DEV)) {
      await refreshDemoAuth();
      return request<T>(path, options, false);
    }
    logout();
    notifyAuthExpired();
    throw new Error('登录已过期，请重新登录');
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || json.message || '请求失败');
  }

  return json.data as T;
}

// ===== Dashboard / Home =====

export async function fetchDashboard() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/dashboard`);
}

export async function fetchLatestVitalMeasurements() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/vital-measurements/latest`);
}

export async function fetchVitalMeasurements(params?: { days?: number; type?: 'blood_pressure' | 'blood_glucose' }) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  const query = new URLSearchParams();
  if (params?.days) query.set('days', String(params.days));
  if (params?.type) query.set('type', params.type);
  return request<any[]>(`/patients/${patientId}/vital-measurements${query.toString() ? `?${query.toString()}` : ''}`);
}

// ===== Meals =====

export async function fetchPatientMeals(date?: string) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  const query = date ? `?startDate=${date}&endDate=${date}` : '';
  return request<any[]>(`/meals/patient/${patientId}${query}`);
}

export async function fetchPatientMealStats(days?: number) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  const query = days ? `?days=${days}` : '';
  return request<any>(`/meals/patient/${patientId}/stats${query}`);
}

export async function createMeal(data: {
  mealType: string;
  mealDate: string;
  mealTime: string;
  foods: Array<{ name: string; amount: number; unit: string; calories: number; protein: number; carbs: number; fat: number }>;
  nutritionScore: number;
  calories: number;
  notes?: string;
}) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/meals/patient/${patientId}`, { method: 'POST', body: data });
}

// ===== Health Reports =====

export async function fetchHealthReports() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any[]>(`/reports/patient/${patientId}`);
}

export async function fetchLatestHealthReport() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/reports/patient/${patientId}/latest`);
}

export async function fetchTomorrowMealGuide(payload?: {
  mode?: 'set' | 'single';
  mealType?: '早餐' | '午餐' | '晚餐';
  nonce?: number;
}) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/reports/patient/${patientId}/tomorrow-guide`, {
    method: 'POST',
    body: payload || { mode: 'set' },
  });
}

// ===== Patient Profile =====

export async function fetchPatientProfile() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}`);
}

export async function updatePatientProfile(data: any) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}`, { method: 'PUT', body: data });
}

// ===== Health Conditions =====

export async function fetchHealthConditions() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any[]>(`/patients/${patientId}/health-conditions`);
}

export async function addHealthCondition(data: { conditionName: string; conditionType: string; diagnosedDate?: string; notes?: string }) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/health-conditions`, { method: 'POST', body: data });
}

export async function removeHealthCondition(condId: string) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/health-conditions/${condId}`, { method: 'DELETE' });
}

// ===== Medications =====

export async function fetchMedications() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any[]>(`/patients/${patientId}/medications`);
}

export async function addMedication(data: { name: string; dosage: string; frequency: string; timing: string; packageImage?: string; ocrText?: string }) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/medications`, { method: 'POST', body: data });
}

export async function updateMedication(medId: string, data: { name: string; dosage: string; frequency: string; timing: string; packageImage?: string; ocrText?: string }) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/medications/${medId}`, { method: 'PUT', body: data });
}

export async function recognizeMedicationImage(imageData: string) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/medications/recognize-image`, {
    method: 'POST',
    body: { imageData },
  });
}

export async function removeMedication(medId: string) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/medications/${medId}`, { method: 'DELETE' });
}

// ===== Preferences =====

export async function fetchPreferences() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/preferences`);
}

export async function updatePreferences(data: { tastePreferences: string[]; likedFoods: string[]; dislikedFoods: string[] }) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/preferences`, { method: 'PUT', body: data });
}

// ===== Medical Orders =====

export async function fetchMedicalOrders() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any[]>(`/patients/${patientId}/medical-orders`);
}

export async function createMedicalOrder(data: {
  content: string;
  doctorName: string;
  hospitalName?: string;
  visitDate?: string;
  originalImage?: string;
  rawOcrText?: string;
}) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/medical-orders`, { method: 'POST', body: data });
}

export async function updateMedicalOrder(orderId: string, data: {
  content: string;
  doctorName: string;
  hospitalName?: string;
  visitDate?: string;
  originalImage?: string;
  rawOcrText?: string;
}) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/patients/${patientId}/medical-orders/${orderId}`, { method: 'PUT', body: data });
}

export async function scanMedicalOrderImage(imageData: string, orderId?: string) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(
    orderId ? `/patients/${patientId}/medical-orders/${orderId}/scan` : `/patients/${patientId}/medical-orders/scan`,
    {
      method: orderId ? 'PUT' : 'POST',
      body: { imageData },
    }
  );
}

// ===== Diet Alerts =====

export async function fetchDietAlerts(date?: string) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  const query = date ? `?date=${date}` : '';
  return request<any[]>(`/patients/${patientId}/diet-alerts${query}`);
}

// ===== Timeline =====

export async function fetchTimeline(date?: string, limit?: number) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  const query = new URLSearchParams();
  if (date) query.set('date', date);
  if (limit) query.set('limit', String(limit));
  return request<any[]>(`/patients/${patientId}/timeline${query.toString() ? `?${query.toString()}` : ''}`);
}

// ===== Conversation Logs =====

export async function fetchConversationLogs(date?: string, limit?: number) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  const query = new URLSearchParams();
  if (date) query.set('date', date);
  if (limit) query.set('limit', String(limit));
  return request<any[]>(`/patients/${patientId}/conversation-logs${query.toString() ? `?${query.toString()}` : ''}`);
}

export async function fetchConversationDates() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<string[]>(`/patients/${patientId}/conversation-logs/dates`);
}

// ===== Authorizations =====

export async function fetchPatientAuthorizationsDetailed() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request(`/authorizations/patient/${patientId}/detailed`);
}

export async function searchDoctors(keyword: string) {
  const params = new URLSearchParams({ q: keyword });
  return request(`/doctors/search?${params.toString()}`);
}

export async function createAuthorization(payload: {
  doctorId: string;
  authorizationType: string[];
  dataRange: string;
  expiryDays: number;
}) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request('/authorizations', {
    method: 'POST',
    body: {
      doctorId: payload.doctorId,
      patientId,
      authorizationType: payload.authorizationType,
      scopeDataRange: payload.dataRange,
      scopeDataStart: new Date().toISOString().slice(0, 10),
      scopeDataEnd: undefined,
      expiresInDays: payload.expiryDays,
    },
  });
}

export async function revokeAuthorization(id: string) {
  return request(`/authorizations/${id}`, { method: 'DELETE' });
}

// ===== AI Consultation =====

export async function createAIConsultation(payload: {
  title?: string;
  sourceType?: 'lab' | 'checkup' | 'imaging' | 'mixed';
  files: Array<{ name: string; type: 'image' | 'text'; content: string }>;
}) {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/ai-consultations/patient/${patientId}`, {
    method: 'POST',
    body: payload,
  });
}

export async function fetchAIConsultations() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any[]>(`/ai-consultations/patient/${patientId}`);
}

export async function fetchLatestAIConsultation() {
  const patientId = getCurrentPatientId();
  if (!patientId) throw new Error('请先登录');
  return request<any>(`/ai-consultations/patient/${patientId}/latest`);
}

export async function retryAIConsultationHtml(reportId: string) {
  return request<any>(`/ai-consultations/${reportId}/retry-html`, { method: 'POST' });
}

export async function deleteAIConsultation(reportId: string) {
  return request<any>(`/ai-consultations/${reportId}`, { method: 'DELETE' });
}

export async function updateAIConsultation(reportId: string, data: { title?: string }) {
  return request<any>(`/ai-consultations/${reportId}`, { method: 'PUT', body: data });
}
