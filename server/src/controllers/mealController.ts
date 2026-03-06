/**
 * 餐食记录控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { models } from '../models';
import { AccessLogController } from './accessLogController';
import { ApiResponse, MealType } from '../types';
import { logger } from '../utils/logger';

// 创建餐食记录验证 Schema
const createMealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealDate: z.string(),
  mealTime: z.string(),
  foods: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  })),
  nutritionScore: z.number().min(0).max(100),
  calories: z.number(),
  notes: z.string().optional(),
});

export class MealController {
  private models: ReturnType<typeof models>;

  constructor(models: ReturnType<typeof models>) {
    this.models = models;
  }

  /**
   * 添加餐食记录
   */
  public createMeal = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const data = createMealSchema.parse(req.body);

    // 检查患者是否存在
    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    const meal = this.models.mealRecord.create({
      ...data,
      patientId,
      foods: JSON.stringify(data.foods),
    });

    const response: ApiResponse = {
      success: true,
      data: meal,
      message: '餐食记录添加成功',
    };

    logger.info(`Meal record created: ${patientId} - ${data.mealType}`);
    res.status(201).json(response);
  });

  /**
   * 获取患者的餐食记录
   */
  public getMeals = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const { page, limit, startDate, endDate } = req.query;

    let meals;

    if (startDate && endDate) {
      meals = this.models.mealRecord.findByDateRange(
        patientId,
        startDate as string,
        endDate as string
      );
    } else {
      const offset = page && limit ? ((Number(page) - 1) * Number(limit)) : undefined;
      meals = this.models.mealRecord.findByPatientId(patientId, {
        limit: limit ? Number(limit) : undefined,
        offset,
      });
    }

    // 如果是医生访问，记录日志
    if (req.user?.type === 'doctor') {
      AccessLogController.logAccess(
        this.models,
        req.user.userId,
        patientId,
        req.user.hospitalId,
        'meal_records'
      );
    }

    const response: ApiResponse = {
      success: true,
      data: meals.map(meal => ({
        ...meal,
        foods: JSON.parse(meal.foods || '[]'),
      })),
    };

    res.json(response);
  });

  /**
   * 获取单条餐食记录
   */
  public getMeal = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, mealId } = req.params;

    const meal = this.models.mealRecord.findById(mealId);
    if (!meal || meal.patientId !== patientId) {
      throw new AppError('餐食记录不存在', 404);
    }

    // 如果是医生访问，记录日志
    if (req.user?.type === 'doctor') {
      AccessLogController.logAccess(
        this.models,
        req.user.userId,
        patientId,
        req.user.hospitalId,
        'meal_record'
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...meal,
        foods: JSON.parse(meal.foods || '[]'),
      },
    };

    res.json(response);
  });

  /**
   * 更新餐食记录
   */
  public updateMeal = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, mealId } = req.params;

    const meal = this.models.mealRecord.findById(mealId);
    if (!meal || meal.patientId !== patientId) {
      throw new AppError('餐食记录不存在', 404);
    }

    let updateData = { ...req.body };

    // 如果更新 foods，需要序列化为 JSON
    if (updateData.foods) {
      updateData.foods = JSON.stringify(updateData.foods);
    }

    const updated = this.models.mealRecord.update(mealId, updateData);

    const response: ApiResponse = {
      success: true,
      data: {
        ...updated,
        foods: JSON.parse(updated.foods || '[]'),
      },
      message: '更新成功',
    };

    res.json(response);
  });

  /**
   * 删除餐食记录
   */
  public deleteMeal = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, mealId } = req.params;

    const meal = this.models.mealRecord.findById(mealId);
    if (!meal || meal.patientId !== patientId) {
      throw new AppError('餐食记录不存在', 404);
    }

    this.models.mealRecord.delete(mealId);

    const response: ApiResponse = {
      success: true,
      message: '删除成功',
    };

    logger.info(`Meal record deleted: ${mealId}`);
    res.json(response);
  });

  /**
   * 获取营养统计
   */
  public getNutritionStats = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const { days } = req.query;

    const daysNum = days ? Number(days) : 7;

    const totalCalories = this.models.mealRecord.getTotalCalories(
      patientId,
      new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const avgScore = this.models.mealRecord.getAverageNutritionScore(patientId, daysNum);

    const response: ApiResponse = {
      success: true,
      data: {
        periodDays: daysNum,
        totalCalories,
        averageDailyCalories: totalCalories / daysNum,
        averageNutritionScore: avgScore,
      },
    };

    res.json(response);
  });
}

export function createMealController(models: ReturnType<typeof models>) {
  return new MealController(models);
}