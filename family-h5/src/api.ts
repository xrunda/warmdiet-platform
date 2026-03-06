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

// ===== 具体 API =====

export async function fetchPatientMeals() {
  const { patientId } = await getDemoToken();
  return request(`/meals/patient/${patientId}`);
}

export async function fetchPatientMealStats() {
  const { patientId } = await getDemoToken();
  return request(`/meals/patient/${patientId}/stats`);
}

export async function fetchLatestHealthReport() {
  const { patientId } = await getDemoToken();
  return request(`/reports/patient/${patientId}/latest`);
}

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

