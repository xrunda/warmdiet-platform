/**
 * API 服务层
 * 与后端通信
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

export class ApiService {
  private token: string | null = null;

  constructor() {
    // 从 localStorage 读取 token
    this.token = localStorage.getItem('token');
  }

  /**
   * 设置认证 token
   */
  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  /**
   * 清除 token
   */
  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  /**
   * 发送 HTTP 请求
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // 401 未授权，清除 token
      if (response.status === 401) {
        this.clearToken();
        throw new Error('未授权，请重新登录');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || '请求失败');
      }

      return await response.json();
    } catch (error) {
      console.error('API 请求错误:', error);
      throw error;
    }
  }

  // ===== 医院账号 API =====

  /**
   * 医院注册
   */
  public async registerHospital(data: {
    hospitalName: string;
    hospitalId: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    planType: 'basic' | 'professional' | 'enterprise';
    billingCycle: 'monthly' | 'yearly';
    password: string;
  }) {
    return this.request('/hospitals/register', { method: 'POST', body: data });
  }

  /**
   * 医院登录
   */
  public async loginHospital(data: { hospitalId: string; password: string }) {
    const response: any = await this.request('/hospitals/login', {
      method: 'POST',
      body: data,
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  /**
   * 获取医院信息
   */
  public async getHospital(id: string) {
    return this.request(`/hospitals/${id}`);
  }

  /**
   * 更新医院信息
   */
  public async updateHospital(id: string, data: any) {
    return this.request(`/hospitals/${id}`, { method: 'PUT', body: data });
  }

  /**
   * 获取订阅状态
   */
  public async getSubscription(id: string) {
    return this.request(`/hospitals/${id}/subscription`);
  }

  // ===== 医生账号 API =====

  /**
   * 添加医生
   */
  public async createDoctor(data: {
    name: string;
    licenseNumber: string;
    department: string;
    email?: string;
    phone?: string;
  }) {
    return this.request('/doctors', { method: 'POST', body: data });
  }

  /**
   * 获取医生列表
   */
  public async getDoctors() {
    return this.request('/doctors');
  }

  /**
   * 搜索医生
   */
  public async searchDoctors(keyword: string) {
    return this.request(`/doctors/search?q=${encodeURIComponent(keyword)}`);
  }

  /**
   * 获取医生信息
   */
  public async getDoctor(id: string) {
    return this.request(`/doctors/${id}`);
  }

  /**
   * 更新医生信息
   */
  public async updateDoctor(id: string, data: any) {
    return this.request(`/doctors/${id}`, { method: 'PUT', body: data });
  }

  /**
   * 删除医生
   */
  public async deleteDoctor(id: string) {
    return this.request(`/doctors/${id}`, { method: 'DELETE' });
  }

  /**
   * 激活/暂停医生
   */
  public async toggleDoctorStatus(id: string, status: 'active' | 'suspended') {
    return this.request(`/doctors/${id}/status`, { method: 'PATCH', body: { status } });
  }

  // ===== 患者账号 API =====

  /**
   * 创建患者
   */
  public async createPatient(data: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    email?: string;
    phone?: string;
  }) {
    return this.request('/patients', { method: 'POST', body: data });
  }

  /**
   * 获取患者信息
   */
  public async getPatient(id: string) {
    return this.request(`/patients/${id}`);
  }

  /**
   * 更新患者信息
   */
  public async updatePatient(id: string, data: any) {
    return this.request(`/patients/${id}`, { method: 'PUT', body: data });
  }

  /**
   * 删除患者
   */
  public async deletePatient(id: string) {
    return this.request(`/patients/${id}`, { method: 'DELETE' });
  }

  /**
   * 搜索患者
   */
  public async searchPatients(keyword: string) {
    return this.request(`/patients/search?q=${encodeURIComponent(keyword)}`);
  }

  // ===== 授权管理 API =====

  /**
   * 创建授权
   */
  public async createAuthorization(data: {
    doctorId: string;
    patientId: string;
    authorizationType: ('meal_records' | 'health_reports' | 'chat_logs')[];
    scopeDataRange: 'recent_7d' | 'recent_30d' | 'recent_90d' | 'all';
    scopeDataStart: string;
    scopeDataEnd?: string;
    expiresInDays?: number;
  }) {
    return this.request('/authorizations', { method: 'POST', body: data });
  }

  /**
   * 获取患者的授权列表
   */
  public async getPatientAuthorizations(patientId: string) {
    return this.request(`/authorizations/patient/${patientId}`);
  }

  /**
   * 获取医生的授权列表
   */
  public async getDoctorAuthorizations(doctorId: string) {
    return this.request(`/authorizations/doctor/${doctorId}`);
  }

  /**
   * 撤销授权
   */
  public async revokeAuthorization(id: string) {
    return this.request(`/authorizations/${id}`, { method: 'DELETE' });
  }

  /**
   * 延长授权
   */
  public async extendAuthorization(id: string, days: number) {
    return this.request(`/authorizations/${id}/extend`, { method: 'POST', body: { days } });
  }

  // ===== 餐食记录 API =====

  /**
   * 添加餐食记录
   */
  public async createMeal(patientId: string, data: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    mealDate: string;
    mealTime: string;
    foods: Array<{
      name: string;
      amount: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
    nutritionScore: number;
    calories: number;
    notes?: string;
  }) {
    return this.request(`/meals/patient/${patientId}`, { method: 'POST', body: data });
  }

  /**
   * 获取患者的餐食记录
   */
  public async getMeals(patientId: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/meals/patient/${patientId}${query ? `?${query}` : ''}`);
  }

  /**
   * 删除餐食记录
   */
  public async deleteMeal(patientId: string, mealId: string) {
    return this.request(`/meals/patient/${patientId}/${mealId}`, { method: 'DELETE' });
  }

  /**
   * 获取营养统计
   */
  public async getNutritionStats(patientId: string, days?: number) {
    const query = days ? `?days=${days}` : '';
    return this.request(`/meals/patient/${patientId}/stats${query}`);
  }

  // ===== 健康报告 API =====

  /**
   * 生成健康报告
   */
  public async createReport(patientId: string, data: {
    startDate: string;
    endDate: string;
  }) {
    return this.request(`/reports/patient/${patientId}`, { method: 'POST', body: data });
  }

  /**
   * 获取健康报告列表
   */
  public async getReports(patientId: string) {
    return this.request(`/reports/patient/${patientId}`);
  }

  /**
   * 获取最新报告
   */
  public async getLatestReport(patientId: string) {
    return this.request(`/reports/patient/${patientId}/latest`);
  }
}

// 导出单例
export const api = new ApiService();