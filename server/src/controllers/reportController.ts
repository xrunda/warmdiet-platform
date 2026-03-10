/**
 * 健康报告控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import type { Models } from '../models';
import { AccessLogController } from './accessLogController';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 生成报告验证 Schema
const createReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const tomorrowGuideSchema = z.object({
  mode: z.enum(['set', 'single']).default('set'),
  mealType: z.enum(['早餐', '午餐', '晚餐']).optional(),
  nonce: z.number().optional(),
});

type GuideMealType = '早餐' | '午餐' | '晚餐';

type GuideOption = {
  menu: string;
  reason: string;
  tags: string[];
  excludes?: string[];
};

const GUIDE_LIBRARY: Record<GuideMealType, GuideOption[]> = {
  早餐: [
    { menu: '小米粥 + 蒸蛋 + 温牛奶', reason: '清淡开胃，补充优质蛋白，适合恢复期早晨。', tags: ['protein', 'lowFat', 'soft', 'warm'] },
    { menu: '燕麦牛奶 + 水煮蛋 + 苹果片', reason: '早餐结构更均衡，也能补一点纤维。', tags: ['protein', 'fiber', 'warm'] },
    { menu: '豆浆 + 全麦面包 + 鸡蛋羹', reason: '蛋白和复合碳水一起补，上午更稳。', tags: ['protein', 'fiber', 'lowSalt'] },
    { menu: '南瓜粥 + 豆腐脑 + 半个馒头', reason: '软烂易消化，适合胃口一般的时候。', tags: ['soft', 'lowFat', 'warm'] },
    { menu: '山药粥 + 煮鸡蛋 + 温豆浆', reason: '更偏滋养型，适合需要温和恢复的状态。', tags: ['protein', 'soft', 'warm'] },
  ],
  午餐: [
    { menu: '清蒸鱼 + 米饭半碗 + 清炒西兰花', reason: '优质蛋白和蔬菜一起补，午餐负担轻。', tags: ['protein', 'fiber', 'lowFat'] },
    { menu: '番茄豆腐面 + 菠菜 + 菌菇汤', reason: '通过汤面形式补菜和蛋白，更容易吃下去。', tags: ['protein', 'fiber', 'soft'] },
    { menu: '鸡丝面 + 小白菜 + 南瓜泥', reason: '更温和，适合需要减少刺激的一天。', tags: ['protein', 'soft', 'lowFat'] },
    { menu: '虾仁豆腐 + 软米饭 + 生菜', reason: '蛋白质充足，但整体依旧清爽。', tags: ['protein', 'lowFat', 'lowSalt'] },
    { menu: '鳕鱼粥 + 菜心 + 南瓜块', reason: '如果中午食欲一般，这套会更容易消化。', tags: ['protein', 'soft', 'fiber'] },
  ],
  晚餐: [
    { menu: '南瓜粥 + 凉拌豆腐 + 青菜汤', reason: '晚餐进一步减油，给身体恢复留出空间。', tags: ['lowFat', 'soft', 'fiber'] },
    { menu: '山药粥 + 蒸鸡胸肉 + 油麦菜', reason: '轻负担但不单薄，适合把一天吃回平衡。', tags: ['protein', 'lowFat', 'fiber'] },
    { menu: '蔬菜汤面 + 鸡蛋花', reason: '操作简单，清淡收尾，睡前更舒服。', tags: ['soft', 'warm', 'lowFat'] },
    { menu: '紫菜蛋花汤 + 半个馒头 + 黄瓜', reason: '控制热量，避免晚餐过重。', tags: ['lowFat', 'lowSalt'] },
    { menu: '冬瓜虾皮汤 + 豆腐 + 小米粥', reason: '适合做低脂修复型晚餐。', tags: ['protein', 'lowFat', 'warm'] },
  ],
};

function rotatePick<T>(items: T[], offset: number, count: number): T[] {
  if (items.length === 0) return [];
  const rotated: T[] = [];
  for (let i = 0; i < count; i++) {
    rotated.push(items[(offset + i) % items.length]);
  }
  return rotated;
}

export class ReportController {
  private models: Models;

  constructor(models: Models) {
    this.models = models;
  }

  private ensureReadAccess(req: Request, patientId: string): void {
    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    if (req.user?.type === 'patient') {
      if (req.user.userId !== patientId) {
        throw new AppError('无权访问此资源', 403);
      }
      return;
    }

    if (req.user?.type === 'doctor') {
      if (!this.models.authorization.hasAccess(req.user.userId, patientId, 'health_reports')) {
        throw new AppError('无权访问此资源', 403);
      }
      return;
    }

    if (req.user?.type === 'hospital') {
      const authorizations = this.models.authorization.findActiveByPatientId(patientId);
      const hasHospitalAccess = authorizations.some((auth) => {
        const doctor = this.models.doctor.findById(auth.doctorId);
        const authTypes = Array.isArray((auth as any).authorizationType)
          ? (auth as any).authorizationType
          : (() => {
              try {
                return JSON.parse((auth as any).authorizationType || '[]');
              } catch {
                return [];
              }
            })();

        return doctor?.hospitalId === req.user?.hospitalId && authTypes.includes('health_reports');
      });

      if (!hasHospitalAccess) {
        throw new AppError('无权访问此资源', 403);
      }
    }
  }

  /**
   * 生成健康报告
   */
  public createReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const data = createReportSchema.parse(req.body);

    // 检查患者是否存在
    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    // 获取指定日期范围内的餐食记录
    const meals = this.models.mealRecord.findByDateRange(
      patientId,
      data.startDate,
      data.endDate
    );

    // 获取生命体征（按天）
    const vitalsInWindow = this.models.vitalMeasurement
      .findByPatientId(patientId, 30)
      .filter((v) => (v.measurementDate || '') >= data.startDate && (v.measurementDate || '') <= data.endDate);

    // 获取患者资料 / 医嘱 / 慢病信息（用于 AI 综合判断）
    const profile = this.models.patient.findById(patientId);
    const medicalOrders = this.models.medicalOrder.findByPatientId(patientId).slice(0, 5);
    const healthConditions = this.models.healthCondition.findByPatientId(patientId);
    const preferences = this.models.preference.findByPatientId(patientId);

    // 计算营养分数
    const avgScore = meals.length > 0
      ? meals.reduce((sum, meal) => sum + meal.nutritionScore, 0) / meals.length
      : 0;

    // 生成趋势数据
    const trends = meals.map(meal => ({
      date: meal.mealDate,
      calories: meal.calories,
      nutritionScore: meal.nutritionScore,
    }));

    // 生命体征摘要
    const latestBp = vitalsInWindow
      .filter((v) => v.metricType === 'blood_pressure')
      .sort((a, b) => (b.measuredAt || '').localeCompare(a.measuredAt || ''))[0];
    const latestBg = vitalsInWindow
      .filter((v) => v.metricType === 'blood_glucose')
      .sort((a, b) => (b.measuredAt || '').localeCompare(a.measuredAt || ''))[0];

    const bpRisk = !!latestBp && ((latestBp.systolicValue || 0) >= 140 || (latestBp.diastolicValue || 0) >= 90);
    const bgRisk = !!latestBg && (latestBg.glucoseValue || 0) >= 7;

    // 生成 AI 报告要点（给医生辅助诊疗）
    const recommendations: string[] = [];

    recommendations.push(
      `【AI综合评估】患者${profile?.name || patientId}在 ${data.startDate} 至 ${data.endDate} 期间，共记录餐食 ${meals.length} 条，平均营养分 ${avgScore.toFixed(1)}。`
    );

    recommendations.push(
      `【生命体征】` +
      `${latestBp ? `最近血压 ${latestBp.systolicValue}/${latestBp.diastolicValue} mmHg（${latestBp.measurementDate}）` : '最近无血压数据'}；` +
      `${latestBg ? `最近血糖 ${latestBg.glucoseValue} ${latestBg.unit || 'mmol/L'}（${latestBg.measurementDate}）` : '最近无血糖数据'}。`
    );

    if (medicalOrders.length > 0) {
      const orderDigest = medicalOrders
        .map((o: any) => `${o.orderDate || o.visitDate || ''} ${o.content || ''}`.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join('；');
      recommendations.push(`【医嘱对照】近期待执行医嘱：${orderDigest}`);
    }

    if (healthConditions.length > 0) {
      const condDigest = healthConditions
        .map((c: any) => c.conditionName)
        .filter(Boolean)
        .join('、');
      recommendations.push(`【病史要点】${condDigest}`);
    }

    if (preferences) {
      let disliked: string[] = [];
      try {
        disliked = JSON.parse((preferences as any).dislikedFoods || '[]');
      } catch {
        disliked = [];
      }
      if (disliked.length > 0) {
        recommendations.push(`【饮食偏好】患者忌口/不喜欢：${disliked.slice(0, 6).join('、')}`);
      }
    }

    if (avgScore < 60) {
      recommendations.push('【诊疗建议】建议提高蔬菜与优质蛋白摄入，优先纠正早餐和晚餐结构。');
    } else if (avgScore < 80) {
      recommendations.push('【诊疗建议】建议继续控制油盐与总热量，保持三餐规律记录。');
    } else {
      recommendations.push('【诊疗建议】当前饮食执行度较好，建议维持并继续随访血压血糖波动。');
    }

    if (bpRisk || bgRisk) {
      recommendations.push('【风险提示】当前生命体征存在偏高趋势，建议医生重点复核药物依从性与医嘱执行情况。');
    }

    if (meals.length < 3) {
      recommendations.push('【数据质量】当前有效记录偏少，建议提醒患者补充完整三餐与体征数据，以提高报告可信度。');
    }

    const report = this.models.healthReport.create({
      patientId,
      reportDate: new Date().toISOString(),
      startDate: data.startDate,
      endDate: data.endDate,
      nutritionScore: avgScore,
      trends: JSON.stringify(trends),
      recommendations: JSON.stringify(recommendations),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      },
      message: '健康报告生成成功',
    };

    logger.info(`Health report created: ${patientId}`);
    res.status(201).json(response);
  });

  /**
   * 获取患者的健康报告列表
   */
  public getReports = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;

    this.ensureReadAccess(req, patientId);

    const reports = this.models.healthReport.findByPatientId(patientId);

    const response: ApiResponse = {
      success: true,
      data: reports.map(report => ({
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      })),
    };

    res.json(response);
  });

  /**
   * 获取单份报告
   */
  public getReport = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, reportId } = req.params;

    this.ensureReadAccess(req, patientId);

    const report = this.models.healthReport.findById(reportId);
    if (!report || report.patientId !== patientId) {
      throw new AppError('报告不存在', 404);
    }

    // 如果是医生访问，记录日志
    if (req.user?.type === 'doctor') {
      AccessLogController.logAccess(
        this.models,
        req.user.userId,
        patientId,
        req.user.hospitalId,
        'health_report'
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      },
    };

    res.json(response);
  });

  /**
   * 获取最新报告
   */
  public getLatestReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;

    this.ensureReadAccess(req, patientId);

    const report = this.models.healthReport.findLatest(patientId);

    if (!report) {
      throw new AppError('暂无报告', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...report,
        trends: JSON.parse(report.trends || '[]'),
        recommendations: JSON.parse(report.recommendations || '[]'),
      },
    };

    res.json(response);
  });

  public getTomorrowGuide = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const { mode, mealType, nonce } = tomorrowGuideSchema.parse(req.body || {});

    const patient = this.models.patient.findById(patientId);
    if (!patient) {
      throw new AppError('患者不存在', 404);
    }

    const latestReport = this.models.healthReport.findLatest(patientId);
    const preference = this.models.preference.findByPatientId(patientId);
    const conditions = this.models.healthCondition.findByPatientId(patientId);
    const latestOrder = this.models.medicalOrder.findByPatientId(patientId)[0];
    const latestMeals = this.models.mealRecord.findRecent(patientId, 3);

    const recommendationText = latestReport ? JSON.parse(latestReport.recommendations || '[]').join(' ') : '';
    const dislikedFoods: string[] = preference ? JSON.parse(preference.dislikedFoods || '[]') : [];
    const tastePreferences: string[] = preference ? JSON.parse(preference.tastePreferences || '[]') : [];
    const conditionText = conditions.map((item: any) => item.conditionName).join(' ');
    const orderText = latestOrder?.content || '';
    const lowScoreRecently = latestMeals.some((meal: any) => meal.nutritionScore < 70);

    const needsProtein = /蛋白/.test(recommendationText);
    const needsVeggies = /蔬菜|纤维/.test(recommendationText);
    const needsLowFat =
      /油脂|高脂|清淡|低脂/.test(recommendationText) ||
      /胆囊|高血脂/.test(conditionText + orderText) ||
      lowScoreRecently;
    const needsLowSalt = /高血压|少盐/.test(conditionText + tastePreferences.join(' '));
    const needsSoft = /术后|软烂|恢复/.test(conditionText + orderText + tastePreferences.join(' '));

    const preferenceTags = new Set<string>();
    if (needsProtein) preferenceTags.add('protein');
    if (needsVeggies) preferenceTags.add('fiber');
    if (needsLowFat) preferenceTags.add('lowFat');
    if (needsLowSalt) preferenceTags.add('lowSalt');
    if (needsSoft) preferenceTags.add('soft');
    preferenceTags.add('warm');

    const baseOffset = Math.abs(Number(nonce || Date.now())) % 17;

    const buildMeal = (type: GuideMealType, seedOffset: number) => {
      const ranked = GUIDE_LIBRARY[type]
        .map((option, index) => {
          const tagScore = option.tags.reduce((sum, tag) => sum + (preferenceTags.has(tag) ? 2 : 0), 0);
          const dislikePenalty = dislikedFoods.some((food) => option.menu.includes(food)) ? 5 : 0;
          return {
            ...option,
            sortScore: tagScore - dislikePenalty + ((seedOffset + index) % 3),
          };
        })
        .sort((a, b) => b.sortScore - a.sortScore);

      return ranked[(seedOffset + ranked.length) % ranked.length];
    };

    if (mode === 'single') {
      if (!mealType) {
        throw new AppError('缺少 mealType 参数', 400);
      }

      const suggestion = buildMeal(mealType, baseOffset + mealType.length);
      return res.json({
        success: true,
        data: {
          type: mealType,
          time: mealType === '早餐' ? '08:00' : mealType === '午餐' ? '12:00' : '18:30',
          menu: suggestion.menu,
          reason: suggestion.reason,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const plan: Array<{ type: GuideMealType; time: string; menu: string; reason: string }> = [
      {
        type: '早餐',
        time: '08:00',
        ...buildMeal('早餐', baseOffset + 1),
      },
      {
        type: '午餐',
        time: '12:00',
        ...buildMeal('午餐', baseOffset + 3),
      },
      {
        type: '晚餐',
        time: '18:30',
        ...buildMeal('晚餐', baseOffset + 5),
      },
    ];

    res.json({
      success: true,
      data: {
        plan,
        basis: {
          reportScore: latestReport?.nutritionScore || 0,
          needsProtein,
          needsVeggies,
          needsLowFat,
          needsLowSalt,
          needsSoft,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  });
}

export function createReportController(models: Models) {
  return new ReportController(models);
}