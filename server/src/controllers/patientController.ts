/**
 * 患者账号控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { authService } from '../services/authService';
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

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: patient,
    };

    res.json(response);
  });

  public updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

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

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const conditions = this.models.healthCondition.findByPatientId(patientId);

    res.json({ success: true, data: conditions });
  });

  public addHealthCondition = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = healthConditionSchema.parse(req.body);

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

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

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const medications = this.models.medication.findByPatientId(patientId);

    res.json({ success: true, data: medications });
  });

  public addMedication = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = medicationSchema.parse(req.body);

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const medication = this.models.medication.create({
      ...data,
      patientId,
      isActive: 1,
    } as any);

    res.status(201).json({ success: true, data: medication, message: '用药记录已添加' });
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

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

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

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

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

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const orders = this.models.medicalOrder.findByPatientId(patientId);

    res.json({ success: true, data: orders });
  });

  public updateMedicalOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = this.models.medicalOrder.findById(orderId);
    if (!order) throw new AppError('医嘱记录不存在', 404);

    const updated = this.models.medicalOrder.update(orderId, req.body);

    res.json({ success: true, data: updated, message: '医嘱已更新' });
  });

  // --- Diet Alerts ---

  public getDietAlerts = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const date = req.query.date as string | undefined;

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const alerts = this.models.dietAlert.findByPatientId(patientId, date);

    res.json({ success: true, data: alerts });
  });

  // --- Conversation Logs ---

  public getConversationLogs = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const date = req.query.date as string;

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    if (!date) throw new AppError('请提供日期参数', 400);

    const logs = this.models.conversationLog.findByPatientIdAndDate(patientId, date)
      .map(c => ({ ...c, extra: c.extra ? JSON.parse(c.extra) : undefined }));

    res.json({ success: true, data: logs });
  });

  public getConversationDates = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;

    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

    const dates = this.models.conversationLog.getAvailableDates(patientId);

    res.json({ success: true, data: dates });
  });

  // --- Dashboard ---

  public getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const patient = this.models.patient.findById(patientId);
    if (!patient) throw new AppError('患者不存在', 404);

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
      },
    });
  });
}

export function createPatientController(models: ReturnType<typeof models>) {
  return new PatientController(models);
}
