/**
 * 数据脱敏中间件
 * 确保返回给医生的数据不包含敏感信息
 */

import { Request, Response, NextFunction } from 'express';
import { AuthorizationType } from '../types';

// 脱敏规则
const SENSITIVE_FIELDS = [
  'patientAddress',
  'patientPhone',
  'patientIdNumber',
  'idCardNumber',
  'homeAddress',
  'workAddress',
];

/**
 * 脱敏函数 - 隐藏部分信息
 */
function maskString(str: string, showStart: number = 3, showEnd: number = 4): string {
  if (!str || str.length <= showStart + showEnd) {
    return str;
  }
  const start = str.substring(0, showStart);
  const end = str.substring(str.length - showEnd);
  const middle = '*'.repeat(str.length - showStart - showEnd);
  return start + middle + end;
}

/**
 * 脱敏手机号
 */
function maskPhone(phone: string): string {
  if (!phone) return phone;
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

/**
 * 脱敏邮箱
 */
function maskEmail(email: string): string {
  if (!email) return email;
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.substring(0, 2) + '***';
  return maskedName + '@' + domain;
}

/**
 * 脱敏身份证号
 */
function maskIdCard(idCard: string): string {
  if (!idCard) return idCard;
  return idCard.replace(/^(\d{6})\d{8}(\d{4})$/, '$1********$2');
}

/**
 * 根据授权类型脱敏患者数据
 */
function sanitizePatientData(data: any, allowedTypes: AuthorizationType[]): any {
  if (!data) return data;

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => sanitizePatientData(item, allowedTypes));
  }

  // 如果是对象，递归处理每个属性
  if (typeof data === 'object' && data !== null) {
    const result: any = {};

    for (const key in data) {
      const value = data[key];

      // 敏感字段始终脱敏
      if (SENSITIVE_FIELDS.includes(key)) {
        if (key.toLowerCase().includes('phone')) {
          result[key] = maskPhone(value);
        } else if (key.toLowerCase().includes('email')) {
          result[key] = maskEmail(value);
        } else if (key.toLowerCase().includes('idcard') || key.toLowerCase().includes('id_number')) {
          result[key] = maskIdCard(value);
        } else {
          result[key] = maskString(value, 3, 3);
        }
      } else {
        // 递归处理嵌套对象
        result[key] = sanitizePatientData(value, allowedTypes);
      }
    }

    // 如果是餐食记录，确保只返回授权类型的数据
    if (data.foods && Array.isArray(data.foods)) {
      result.foods = data.foods.map((food: any) => ({
        name: food.name,
        amount: food.amount,
        unit: food.unit,
        calories: food.calories,
        protein: allowedTypes.includes('health_reports') ? food.protein : undefined,
        carbs: allowedTypes.includes('health_reports') ? food.carbs : undefined,
        fat: allowedTypes.includes('health_reports') ? food.fat : undefined,
      }));
    }

    return result;
  }

  return data;
}

/**
 * 数据脱敏中间件
 * 自动脱敏返回给医生的数据
 */
export function dataSanitizer(req: Request, res: Response, next: NextFunction): void {
  // 只对医生请求进行脱敏
  if (!req.user || req.user.type !== 'doctor') {
    return next();
  }

  // 保存原始的 json 方法
  const originalJson = res.json;

  // 重写 json 方法
  res.json = function (body: any) {
    // 如果返回成功且包含数据
    if (body && body.success === true && body.data) {
      // 根据授权类型脱敏数据
      body.data = sanitizePatientData(body.data, []);
    }

    return originalJson.call(this, body);
  };

  next();
}

/**
 * 手动脱敏函数 - 可在控制器中直接调用
 */
export function sanitize(
  data: any,
  options?: {
    allowedTypes?: AuthorizationType[];
    maskPhone?: boolean;
    maskEmail?: boolean;
    maskIdCard?: boolean;
  }
): any {
  const {
    allowedTypes = [],
    maskPhone: maskPhoneFlag = true,
    maskEmail: maskEmailFlag = true,
    maskIdCard: maskIdCardFlag = true,
  } = options || {};

  return sanitizePatientData(data, allowedTypes);
}

/**
 * 根据授权类型获取允许的字段
 */
export function getAllowedFields(authorizationType: AuthorizationType[]): string[] {
  const fields: string[] = [];

  // 基础字段（始终允许）
  fields.push('id', 'patientId', 'doctorId', 'hospitalId');

  // 根据授权类型添加字段
  if (authorizationType.includes('meal_records')) {
    fields.push(
      'mealDate',
      'mealTime',
      'mealType',
      'foods',
      'nutritionScore',
      'calories',
      'notes'
    );
  }

  if (authorizationType.includes('health_reports')) {
    fields.push(
      'reportDate',
      'startDate',
      'endDate',
      'nutritionScore',
      'trends',
      'recommendations'
    );
  }

  if (authorizationType.includes('chat_logs')) {
    fields.push('chatLogs', 'messages', 'timestamp');
  }

  return fields;
}