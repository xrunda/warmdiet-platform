const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function getDemoToken(): Promise<{ token: string; patientId: string }> {
  const cached = localStorage.getItem('family_patient_token');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem('family_patient_token');
    }
  }

  const res = await fetch(`${API_BASE_URL}/demo/patient-token`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || '获取测试患者 token 失败');
  }
  localStorage.setItem('family_patient_token', JSON.stringify(json.data));
  return json.data;
}

async function request<T>(path: string, options: { method?: HttpMethod; body?: any } = {}): Promise<T> {
  const { token } = await getDemoToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || json.message || '请求失败');
  }

  return json.data as T;
}

// ===== Dashboard / Home =====

export async function fetchDashboard() {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/dashboard`);
}

export async function fetchLatestVitalMeasurements() {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/vital-measurements/latest`);
}

export async function fetchVitalMeasurements(params?: { days?: number; type?: 'blood_pressure' | 'blood_glucose' }) {
  const { patientId } = await getDemoToken();
  const query = new URLSearchParams();
  if (params?.days) query.set('days', String(params.days));
  if (params?.type) query.set('type', params.type);
  return request<any[]>(`/patients/${patientId}/vital-measurements${query.toString() ? `?${query.toString()}` : ''}`);
}

// ===== Meals =====

export async function fetchPatientMeals(date?: string) {
  const { patientId } = await getDemoToken();
  const query = date ? `?startDate=${date}&endDate=${date}` : '';
  return request<any[]>(`/meals/patient/${patientId}${query}`);
}

export async function fetchPatientMealStats(days?: number) {
  const { patientId } = await getDemoToken();
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
  const { patientId } = await getDemoToken();
  return request<any>(`/meals/patient/${patientId}`, { method: 'POST', body: data });
}

// ===== Health Reports =====

export async function fetchHealthReports() {
  const { patientId } = await getDemoToken();
  return request<any[]>(`/reports/patient/${patientId}`);
}

export async function fetchLatestHealthReport() {
  const { patientId } = await getDemoToken();
  return request<any>(`/reports/patient/${patientId}/latest`);
}

export async function fetchTomorrowMealGuide(payload?: {
  mode?: 'set' | 'single';
  mealType?: '早餐' | '午餐' | '晚餐';
  nonce?: number;
}) {
  const { patientId } = await getDemoToken();
  return request<any>(`/reports/patient/${patientId}/tomorrow-guide`, {
    method: 'POST',
    body: payload || { mode: 'set' },
  });
}

// ===== Patient Profile =====

export async function fetchPatientProfile() {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}`);
}

export async function updatePatientProfile(data: any) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}`, { method: 'PUT', body: data });
}

// ===== Health Conditions =====

export async function fetchHealthConditions() {
  const { patientId } = await getDemoToken();
  return request<any[]>(`/patients/${patientId}/health-conditions`);
}

export async function addHealthCondition(data: { conditionName: string; conditionType: string; diagnosedDate?: string; notes?: string }) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/health-conditions`, { method: 'POST', body: data });
}

export async function removeHealthCondition(condId: string) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/health-conditions/${condId}`, { method: 'DELETE' });
}

// ===== Medications =====

export async function fetchMedications() {
  const { patientId } = await getDemoToken();
  return request<any[]>(`/patients/${patientId}/medications`);
}

export async function addMedication(data: { name: string; dosage: string; frequency: string; timing: string; packageImage?: string; ocrText?: string }) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/medications`, { method: 'POST', body: data });
}

export async function updateMedication(medId: string, data: { name: string; dosage: string; frequency: string; timing: string; packageImage?: string; ocrText?: string }) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/medications/${medId}`, { method: 'PUT', body: data });
}

export async function recognizeMedicationImage(imageData: string) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/medications/recognize-image`, {
    method: 'POST',
    body: { imageData },
  });
}

export async function removeMedication(medId: string) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/medications/${medId}`, { method: 'DELETE' });
}

// ===== Preferences =====

export async function fetchPreferences() {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/preferences`);
}

export async function updatePreferences(data: { tastePreferences: string[]; likedFoods: string[]; dislikedFoods: string[] }) {
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/preferences`, { method: 'PUT', body: data });
}

// ===== Medical Orders =====

export async function fetchMedicalOrders() {
  const { patientId } = await getDemoToken();
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
  const { patientId } = await getDemoToken();
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
  const { patientId } = await getDemoToken();
  return request<any>(`/patients/${patientId}/medical-orders/${orderId}`, { method: 'PUT', body: data });
}

export async function scanMedicalOrderImage(imageData: string, orderId?: string) {
  const { patientId } = await getDemoToken();
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
  const { patientId } = await getDemoToken();
  const query = date ? `?date=${date}` : '';
  return request<any[]>(`/patients/${patientId}/diet-alerts${query}`);
}

// ===== Conversation Logs =====

export async function fetchConversationLogs(date: string) {
  const { patientId } = await getDemoToken();
  return request<any[]>(`/patients/${patientId}/conversation-logs?date=${date}`);
}

export async function fetchConversationDates() {
  const { patientId } = await getDemoToken();
  return request<string[]>(`/patients/${patientId}/conversation-logs/dates`);
}

// ===== Authorizations =====

export async function fetchPatientAuthorizationsDetailed() {
  const { patientId } = await getDemoToken();
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
  const { patientId } = await getDemoToken();
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
