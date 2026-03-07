/**
 * 患者账号控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { authService } from '../services/authService';
import { ocrService } from '../services/ocrService';
import { extractVitalMeasurementsFromText } from '../services/vitalSignParser';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

const createPatientSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female']),
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
});

const healthConditionSchema = z.object({
  conditionName: z.string().min(1).max(100),
  conditionType: z.enum(['disease', 'surgery', 'allergy']),
  diagnosedDate: z.string().optional(),
  notes: z.string().optional(),
});

const medicationSchema = z.object({
  name: z.string().min(1).max(100),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  timing: z.string().min(1).max(100),
  packageImage: z.string().optional(),
  ocrText: z.string().optional(),
});

const medicalOrderSchema = z.object({
  content: z.string().min(1).max(2000),
  doctorName: z.string().min(1).max(100),
  hospitalName: z.string().max(100).optional(),
  visitDate: z.string().optional(),
  originalImage: z.string().optional(),
  rawOcrText: z.string().optional(),
});

const imagePayloadSchema = z.object({
  imageData: z.string().refine((value) => value.startsWith('data:image/'), '请上传图片文件'),
});

const vitalQuerySchema = z.object({
  days: z.coerce.number().min(1).max(30).default(7),
  type: z.enum(['blood_pressure', 'blood_glucose']).optional(),
});

const preferenceSchema = z.object({
  tastePreferences: z.union([z.string(), z.array(z.string())]),
  likedFoods: z.union([z.string(), z.array(z.string())]),
  dislikedFoods: z.union([z.string(), z.array(z.string())]),
});

export class PatientController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  private ensurePatientExists(patientId: string) {
    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);
    return patient;
  }

  private buildMeasuredAt(logDate: string, timestamp: string) {
    const normalizedTime = /^\d{2}:\d{2}$/.test(timestamp) ? `${timestamp}:00` : timestamp;
    return `${logDate}T${normalizedTime}`;
  }

  private normalizeVitalSummaryItem(item: any) {
    if (!item) return null;

    if (item.metricType === 'blood_pressure') {
      const isHigh = (item.systolicValue || 0) >= 140 || (item.diastolicValue || 0) >= 90;
      const isLow = (item.systolicValue || 0) < 90 || (item.diastolicValue || 0) < 60;
      return {
        metricType: item.metricType,
        value: `${item.systolicValue}/${item.diastolicValue}`,
        systolicValue: item.systolicValue,
        diastolicValue: item.diastolicValue,
        unit: item.unit,
        measuredAt: item.measuredAt,
        measurementDate: item.measurementDate,
        sourceType: item.sourceType,
        status: isHigh ? 'high' : isLow ? 'low' : 'normal',
      };
    }

    const highThreshold = item.glucoseContext === 'fasting' ? 7 : item.glucoseContext === 'post_meal' ? 10 : 11.1;
    return {
      metricType: item.metricType,
      value: item.glucoseValue,
      glucoseValue: item.glucoseValue,
      glucoseContext: item.glucoseContext,
      glucoseContextLabel:
        item.glucoseContext === 'fasting'
          ? '空腹'
          : item.glucoseContext === 'post_meal'
          ? '餐后'
          : item.glucoseContext === 'before_sleep'
          ? '睡前'
          : item.glucoseContext === 'random'
          ? '随机'
          : '未标注',
      unit: item.unit,
      measuredAt: item.measuredAt,
      measurementDate: item.measurementDate,
      sourceType: item.sourceType,
      status: item.glucoseValue >= highThreshold ? 'high' : item.glucoseValue < 4 ? 'low' : 'normal',
    };
  }

  private syncVitalsFromConversationLogs(patientId: string) {
    const logs = this.models.conversationLog.findRecentUserLogs(patientId, 80);

    for (const log of logs) {
      const extracted = extractVitalMeasurementsFromText(log.content || '');
      if (extracted.length === 0) continue;

      for (const measurement of extracted) {
        const existing = this.models.vitalMeasurement.findBySourceLog(measurement.metricType, log.id);
        if (existing) continue;

        this.models.vitalMeasurement.create({
          patientId,
          metricType: measurement.metricType,
          systolicValue: measurement.systolicValue,
          diastolicValue: measurement.diastolicValue,
          glucoseValue: measurement.glucoseValue,
          glucoseContext: measurement.glucoseContext,
          unit: measurement.unit,
          measuredAt: this.buildMeasuredAt(log.logDate, log.timestamp),
          measurementDate: log.logDate,
          sourceType: 'xiaoai_voice',
          sourceLogId: log.id,
          sourceText: log.content,
        } as any);
      }
    }
  }

  public createPatient = asyncHandler(async (req: Request, res: Response) => {
    const data = createPatientSchema.parse(req.body);

    if (data.email) {
      const existing = this.models.patient.findByEmail(data.email);
      if (existing) {
        throw new AppError('该邮箱已被使用', 400);
      }
    }

    const patient = this.models.patient.create(data);

    const response: ApiResponse = {
      success: true,
      data: patient,
      message: '患者创建成功',
    };

    logger.info(`Patient created: ${patient.name}`);
    res.status(201).json(response);
  });

  public getPatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.ensurePatientExists(patientId);

    const response: ApiResponse = {
      success: true,
      data: patient,
    };

    res.json(response);
  });

  public updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.ensurePatientExists(patientId);

    const updated = this.models.patient.update(patientId, req.body);

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: '更新成功',
    };

    res.json(response);
  });

  public deletePatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    this.models.patient.delete(patientId);

    const response: ApiResponse = {
      success: true,
      message: '删除成功',
    };

    logger.info(`Patient deleted: ${patient.name}`);
    res.json(response);
  });

  public searchPatients = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new AppError('搜索关键词不能为空', 400);
    }

    const patients = this.models.patient.searchPatients(q);

    const response: ApiResponse = {
      success: true,
      data: patients,
    };

    res.json(response);
  });

  // --- Health Conditions ---

  public getHealthConditions = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    this.ensurePatientExists(patientId);

    const conditions = this.models.healthCondition.findByPatientId(patientId);

    res.json({ success: true, data: conditions });
  });

  public addHealthCondition = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = healthConditionSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const condition = this.models.healthCondition.create({
      ...data,
      patientId,
      isActive: 1,
    } as any);

    res.status(201).json({ success: true, data: condition, message: '健康状况已添加' });
  });

  public removeHealthCondition = asyncHandler(async (req: Request, res: Response) => {
    const { condId } = req.params;

    const condition = this.models.healthCondition.findById(condId);
    if (!condition) throw new AppError('健康状况记录不存在', 404);

    this.models.healthCondition.update(condId, { isActive: 0 } as any);

    res.json({ success: true, message: '健康状况已移除' });
  });

  // --- Medications ---

  public getMedications = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    this.ensurePatientExists(patientId);

    const medications = this.models.medication.findByPatientId(patientId);

    res.json({ success: true, data: medications });
  });

  public addMedication = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = medicationSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const medication = this.models.medication.create({
      ...data,
      patientId,
      imageUploadedAt: data.packageImage ? new Date().toISOString() : undefined,
      isActive: 1,
    } as any);

    res.status(201).json({ success: true, data: medication, message: '用药记录已添加' });
  });

  public updateMedication = asyncHandler(async (req: Request, res: Response) => {
    const { medId } = req.params;
    const data = medicationSchema.parse(req.body);

    const medication = this.models.medication.findById(medId);
    if (!medication) throw new AppError('用药记录不存在', 404);

    const updated = this.models.medication.update(medId, {
      ...data,
      imageUploadedAt: data.packageImage ? new Date().toISOString() : undefined,
    } as any);

    res.json({ success: true, data: updated, message: '用药记录已更新' });
  });

  public recognizeMedicationImage = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const { imageData } = imagePayloadSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const result = await ocrService.recognizeMedication(imageData);

    res.json({
      success: true,
      data: {
        ...result,
        packageImage: imageData,
      },
      message: '药品包装识别成功',
    });
  });

  public removeMedication = asyncHandler(async (req: Request, res: Response) => {
    const { medId } = req.params;

    const medication = this.models.medication.findById(medId);
    if (!medication) throw new AppError('用药记录不存在', 404);

    this.models.medication.update(medId, { isActive: 0 } as any);

    res.json({ success: true, message: '用药记录已移除' });
  });

  // --- Preferences ---

  public getPreferences = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    this.ensurePatientExists(patientId);

    const pref = this.models.preference.findByPatientId(patientId);
    if (!pref) {
      return res.json({ success: true, data: null });
    }

    const data = {
      ...pref,
      tastePreferences: JSON.parse(pref.tastePreferences || '[]'),
      likedFoods: JSON.parse(pref.likedFoods || '[]'),
      dislikedFoods: JSON.parse(pref.dislikedFoods || '[]'),
    };

    res.json({ success: true, data });
  });

  public updatePreferences = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = preferenceSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const storeData = {
      tastePreferences: typeof data.tastePreferences === 'string' ? data.tastePreferences : JSON.stringify(data.tastePreferences),
      likedFoods: typeof data.likedFoods === 'string' ? data.likedFoods : JSON.stringify(data.likedFoods),
      dislikedFoods: typeof data.dislikedFoods === 'string' ? data.dislikedFoods : JSON.stringify(data.dislikedFoods),
    };

    const existing = this.models.preference.findByPatientId(patientId);

    let result;
    if (existing) {
      result = this.models.preference.update(existing.id, storeData as any);
    } else {
      result = this.models.preference.create({ ...storeData, patientId } as any);
    }

    res.json({ success: true, data: result, message: '饮食偏好已更新' });
  });

  // --- Medical Orders ---

  public getMedicalOrders = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    this.ensurePatientExists(patientId);

    const orders = this.models.medicalOrder.findByPatientId(patientId);

    res.json({ success: true, data: orders });
  });

  public updateMedicalOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const data = medicalOrderSchema.parse(req.body);

    const order = this.models.medicalOrder.findById(orderId);
    if (!order) throw new AppError('医嘱记录不存在', 404);

    const updated = this.models.medicalOrder.update(orderId, {
      ...data,
      orderDate: data.visitDate || new Date().toISOString().split('T')[0],
    } as any);

    res.json({ success: true, data: updated, message: '医嘱已更新' });
  });

  public createMedicalOrder = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = medicalOrderSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const order = this.models.medicalOrder.create({
      patientId,
      content: data.content,
      doctorName: data.doctorName,
      hospitalName: data.hospitalName,
      visitDate: data.visitDate,
      originalImage: data.originalImage,
      rawOcrText: data.rawOcrText,
      orderDate: data.visitDate || new Date().toISOString().split('T')[0],
      isActive: 1,
    } as any);

    res.status(201).json({ success: true, data: order, message: '医嘱已添加' });
  });

  public scanMedicalOrder = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const { imageData } = imagePayloadSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const result = await ocrService.recognizeMedicalOrder(imageData);

    res.status(201).json({
      success: true,
      data: {
        ...result,
        originalImage: imageData,
      },
      message: '纸质医嘱识别完成，请确认后保存',
    });
  });

  public rescanMedicalOrder = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const { orderId } = req.params;
    const { imageData } = imagePayloadSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const order = this.models.medicalOrder.findById(orderId);
    if (!order) throw new AppError('医嘱记录不存在', 404);

    const result = await ocrService.recognizeMedicalOrder(imageData);

    res.json({
      success: true,
      data: {
        ...result,
        id: order.id,
        originalImage: imageData,
      },
      message: '纸质医嘱重新识别完成，请确认后保存',
    });
  });

  // --- Vital Measurements ---

  public getVitalMeasurements = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const { days, type } = vitalQuerySchema.parse(req.query);

    this.ensurePatientExists(patientId);
    this.syncVitalsFromConversationLogs(patientId);

    const records = this.models.vitalMeasurement.findByPatientId(patientId, days, type)
      .map((item) => this.normalizeVitalSummaryItem(item));

    res.json({ success: true, data: records });
  });

  public getLatestVitalMeasurements = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    this.ensurePatientExists(patientId);
    this.syncVitalsFromConversationLogs(patientId);

    const latest = this.models.vitalMeasurement.findLatestByPatientId(patientId);
    const bloodPressure = latest.find((item) => item.metricType === 'blood_pressure');
    const bloodGlucose = latest.find((item) => item.metricType === 'blood_glucose');

    res.json({
      success: true,
      data: {
        latestBloodPressure: this.normalizeVitalSummaryItem(bloodPressure),
        latestBloodGlucose: this.normalizeVitalSummaryItem(bloodGlucose),
        recentCount: latest.length,
      },
    });
  });

  // --- Diet Alerts ---

  public getDietAlerts = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const date = req.query.date as string | undefined;
    this.ensurePatientExists(patientId);

    const alerts = this.models.dietAlert.findByPatientId(patientId, date);

    res.json({ success: true, data: alerts });
  });

  // --- Conversation Logs ---

  public getConversationLogs = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const date = req.query.date as string;
    this.ensurePatientExists(patientId);

    if (!date) throw new AppError('请提供日期参数', 400);

    this.syncVitalsFromConversationLogs(patientId);

    const logs = this.models.conversationLog.findByPatientIdAndDate(patientId, date)
      .map(c => ({ ...c, extra: c.extra ? JSON.parse(c.extra) : undefined }));

    res.json({ success: true, data: logs });
  });

  public getConversationDates = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    this.ensurePatientExists(patientId);

    const dates = this.models.conversationLog.getAvailableDates(patientId);

    res.json({ success: true, data: dates });
  });

  // --- Dashboard ---

  public getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const patient = this.ensurePatientExists(patientId);

    this.syncVitalsFromConversationLogs(patientId);

    const today = new Date().toISOString().split('T')[0];

    const todayMeals = this.models.mealRecord.findByDate(patientId, today);
    const meals = todayMeals.map(m => ({
      ...m,
      foods: JSON.parse(m.foods || '[]'),
    }));

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentMeals = this.models.mealRecord.findByDateRange(patientId, startDate, today);

    const dayMap: Record<string, { totalScore: number; count: number; totalCalories: number }> = {};
    for (const m of recentMeals) {
      if (!dayMap[m.mealDate]) dayMap[m.mealDate] = { totalScore: 0, count: 0, totalCalories: 0 };
      dayMap[m.mealDate].totalScore += m.nutritionScore;
      dayMap[m.mealDate].count += 1;
      dayMap[m.mealDate].totalCalories += m.calories;
    }

    const trendData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        score: Math.round(data.totalScore / data.count),
        calories: data.totalCalories,
      }));

    const alerts = this.models.dietAlert.findByPatientId(patientId, today);

    const todayData = dayMap[today];
    const healthScore = todayData ? Math.round(todayData.totalScore / todayData.count) : 0;

    const conversations = this.models.conversationLog.findByPatientIdAndDate(patientId, today)
      .map(c => ({ ...c, extra: c.extra ? JSON.parse(c.extra) : undefined }));

    const latestVitals = this.models.vitalMeasurement.findLatestByPatientId(patientId);
    const latestBloodPressure = latestVitals.find((item) => item.metricType === 'blood_pressure');
    const latestBloodGlucose = latestVitals.find((item) => item.metricType === 'blood_glucose');

    const scores = trendData.map(t => t.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;

    res.json({
      success: true,
      data: {
        patient,
        healthScore,
        meals,
        trendData,
        alerts,
        conversations: conversations.slice(-6),
        stats: { avgScore, maxScore, minScore },
        vitals: {
          latestBloodPressure: this.normalizeVitalSummaryItem(latestBloodPressure),
          latestBloodGlucose: this.normalizeVitalSummaryItem(latestBloodGlucose),
          recentCount: latestVitals.length,
        },
      },
    });
  });
}

export function createPatientController(models: ReturnType<typeof models>) {
  return new PatientController(models);
}
