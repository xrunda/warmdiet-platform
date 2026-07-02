/**
 * 患者账号控制器
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import type { Models } from '../models';
import { authService } from '../services/authService';
import { buildGlucoseFollowUp } from '../services/glucoseFollowUpService';
import { ocrService } from '../services/ocrService';
import { extractVitalMeasurementsFromText } from '../services/vitalSignParser';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config/env';

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

const createVitalMeasurementSchema = z.object({
  metricType: z.enum(['blood_pressure', 'blood_glucose']),
  systolicValue: z.number().int().min(40).max(260).optional(),
  diastolicValue: z.number().int().min(30).max(180).optional(),
  glucoseValue: z.number().min(1).max(40).optional(),
  glucoseContext: z.enum(['fasting', 'post_meal', 'random', 'before_sleep', 'unknown']).optional(),
  unit: z.string().optional(),
  measuredAt: z.string().optional(),
  measurementDate: z.string().optional(),
  sourceType: z.string().optional(),
  sourceText: z.string().optional(),
  notes: z.string().optional(),
});

const appendConversationLogSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
  timestamp: z.string().optional(),
  logDate: z.string().optional(),
  extra: z.any().optional(),
});

const glucoseFollowUpQuerySchema = z.object({
  glucoseValue: z.coerce.number().min(1).max(40),
  glucoseContext: z.enum(['fasting', 'post_meal', 'random', 'before_sleep', 'unknown']).optional(),
  measuredAt: z.string().optional(),
});

const preferenceSchema = z.object({
  tastePreferences: z.union([z.string(), z.array(z.string())]),
  likedFoods: z.union([z.string(), z.array(z.string())]),
  dislikedFoods: z.union([z.string(), z.array(z.string())]),
});

export class PatientController {
  private models: Models;

  constructor(models: Models) {
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

  private extractGlucoseFollowUpInfo(item: any) {
    if (!item || item.metricType !== 'blood_glucose') return undefined;

    const readSegments = (text: unknown, delimiterPattern: RegExp | string) =>
      typeof text === 'string'
        ? text
            .split(delimiterPattern as any)
            .map((part) => part.trim())
            .filter(Boolean)
        : [];

    const noteSegments = readSegments(item.notes, /[；;]+/g);
    const sourceSegments = readSegments(item.sourceText, /[|；;]+/g);

    const stripTag = (segment: string) => segment
      .replace('[补录]', '')
      .replace('[追问补录]', '')
      .replace(/^补录[:：]\s*/, '')
      .trim();

    const followUpSegments = [...noteSegments, ...sourceSegments]
      .filter((segment) =>
        segment.startsWith('[补录]') ||
        segment.startsWith('[追问补录]') ||
        /服药|吃药|口服|未服|漏服|场景|餐后|饭后|空腹|睡前|随机|分钟|小时|时点|测量时间|降糖药|降压药|胰岛素|二甲双胍/.test(segment)
      )
      .map(stripTag)
      .filter(Boolean);
    const uniqueFollowUpSegments = Array.from(new Set(followUpSegments));
    if (uniqueFollowUpSegments.length > 0) {
      return uniqueFollowUpSegments.join('；');
    }

    const contextLabel =
      item.glucoseContext === 'fasting'
        ? '空腹'
        : item.glucoseContext === 'post_meal'
        ? '餐后'
        : item.glucoseContext === 'before_sleep'
        ? '睡前'
        : item.glucoseContext === 'random'
        ? '随机'
        : '未标注';

    if (item.glucoseContext && item.glucoseContext !== 'unknown' && sourceSegments.length > 1) {
      return stripTag(sourceSegments[sourceSegments.length - 1]);
    }

    if (item.glucoseContext && item.glucoseContext !== 'unknown' && sourceSegments.length > 0) {
      return sourceSegments[sourceSegments.length - 1];
    }

    if (item.glucoseContext && item.glucoseContext !== 'unknown' && noteSegments.length > 0) {
      return noteSegments[noteSegments.length - 1];
    }

    if (
      item.glucoseContext &&
      item.glucoseContext !== 'unknown' &&
      item.createdAt &&
      item.updatedAt &&
      item.createdAt !== item.updatedAt
    ) {
      return `测量场景补录为${contextLabel}`;
    }

    return undefined;
  }

  private buildGlucoseFollowUpFromText(text: string) {
    if (!text) return null;

    const normalized = text.trim();
    if (!normalized) return null;

    const context =
      /餐后|饭后/.test(normalized)
        ? 'post_meal'
        : /空腹/.test(normalized)
        ? 'fasting'
        : /睡前/.test(normalized)
        ? 'before_sleep'
        : /随机/.test(normalized)
        ? 'random'
        : undefined;

    const medicationType = /降糖药/.test(normalized)
      ? '降糖药'
      : /降压药/.test(normalized)
      ? '降压药'
      : '药物';

    const durationMatch = normalized.match(/(?:餐后|饭后)\s*([0-9一二两三四五六七八九十半个\.点]+)\s*(小时|分钟)/);
    const durationText = durationMatch ? `${durationMatch[1]}${durationMatch[2]}` : undefined;

    const explicitMedicationMatch = normalized.match(/(?:服了|已服|服用|吃了|吃过|用了)\s*([^，。；,.!?]{1,24}?)(?:药|片|胶囊|mg|毫克)?(?:[，。；,.!?]|$)/);
    const explicitMedicationRaw = explicitMedicationMatch?.[1]?.trim();
    const explicitMedication = explicitMedicationRaw && !/降糖|降压|药/.test(explicitMedicationRaw)
      ? `${explicitMedicationRaw}药`
      : explicitMedicationRaw
      ? explicitMedicationRaw
      : undefined;

    const medicationNote =
      /未服|没服|没吃药|未吃药|漏服/.test(normalized)
        ? `本次测量前未服${explicitMedication || medicationType}。`
        : /服了|已服|吃了.*药|已吃药/.test(normalized)
        ? `本次测量前已服${explicitMedication || medicationType}。`
        : undefined;

    if (!context && !medicationNote) return null;

    const contextLabel =
      context === 'fasting'
        ? '空腹'
        : context === 'post_meal'
        ? '餐后'
        : context === 'before_sleep'
        ? '睡前'
        : context === 'random'
        ? '随机'
        : undefined;

    const sourceText = [
      contextLabel ? `测量场景补录为${contextLabel}` : undefined,
      durationText ? `测量时间为${durationText}` : undefined,
    ]
      .filter(Boolean)
      .join('，');

    const noteText = [
      contextLabel ? `补录：测量场景为${contextLabel}` : undefined,
      durationText ? `餐后测量时点：${durationText}` : undefined,
      medicationNote,
      explicitMedication ? `补录药物：${explicitMedication}` : undefined,
    ]
      .filter(Boolean)
      .join('；');

    return {
      context,
      sourceText,
      noteText: noteText || undefined,
    };
  }

  private applyGlucoseFollowUpFromConversation(patientId: string, content: string) {
    const followUp = this.buildGlucoseFollowUpFromText(content);
    if (!followUp) return null;

    const pending =
      this.models.vitalMeasurement.findLatestUnknownGlucoseByPatientId(patientId) ||
      this.models.vitalMeasurement.findByPatientId(patientId, 2, 'blood_glucose')[0];
    if (!pending) return null;

    const mergedSourceText = [
      pending.sourceText,
      followUp.sourceText ? `[追问补录] ${followUp.sourceText}` : undefined,
    ]
      .filter(Boolean)
      .join(' | ');
    const mergedNotes = [
      pending.notes,
      followUp.noteText ? `[追问补录] ${followUp.noteText}` : undefined,
    ]
      .filter(Boolean)
      .join('；');

    const updated = this.models.vitalMeasurement.update(pending.id, {
      glucoseContext: (followUp.context || pending.glucoseContext) as any,
      sourceText: mergedSourceText || undefined,
      notes: mergedNotes || undefined,
    } as any);

    return updated;
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

    const followUpInfo = this.extractGlucoseFollowUpInfo(item);
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
      notes: item.notes,
      sourceText: item.sourceText,
      followUpInfo,
      hasFollowUpInfo: Boolean(followUpInfo),
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
          sourceType: config.voiceSourceType,
          sourceLogId: log.id,
          sourceText: log.content,
        } as any);
      }
    }
  }

  private buildDateAndTime(inputTimestamp?: string, inputDate?: string) {
    const now = new Date();
    const rawDate = inputDate?.trim();
    const normalizedDatePart = rawDate
      ? (() => {
          const withT = rawDate.replace(' ', 'T');
          const dateMatch = withT.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) return dateMatch[1];
          const parsed = new Date(withT);
          return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
        })()
      : undefined;

    const rawTime = inputTimestamp?.trim();
    const normalizedTimeRaw = rawTime
      ? (() => {
          const withT = rawTime.replace(' ', 'T');
          const timePart = withT.includes('T') ? withT.split('T')[1] : withT;
          const timeMatch = timePart.match(/^(\d{2}:\d{2})(:\d{2})?/);
          if (timeMatch) return `${timeMatch[1]}${timeMatch[2] || ':00'}`;
          const parsed = new Date(withT);
          if (Number.isNaN(parsed.getTime())) return undefined;
          return `${`${parsed.getHours()}`.padStart(2, '0')}:${`${parsed.getMinutes()}`.padStart(2, '0')}:${`${parsed.getSeconds()}`.padStart(2, '0')}`;
        })()
      : undefined;

    const date = normalizedDatePart || now.toISOString().slice(0, 10);
    const time = normalizedTimeRaw || now.toTimeString().slice(0, 8);
    const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
    return {
      date,
      time: normalizedTime,
      measuredAt: `${date}T${normalizedTime}`,
    };
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

  // --- Timeline (unified: conversations + meals + vitals) ---

  public getTimeline = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 2000);
    const date = req.query.date as string | undefined;
    this.ensurePatientExists(patientId);
    this.syncVitalsFromConversationLogs(patientId);

    type TimelineItem = {
      type: 'conversation' | 'meal' | 'vital';
      id: string;
      sortKey: string; // ISO-ish for sorting
      logDate: string;
      timestamp: string;
      data: any;
    };

    const items: TimelineItem[] = [];

    // 1) Conversation logs
    const convLogs = date
      ? this.models.conversationLog.findByPatientIdAndDate(patientId, date)
      : this.models.conversationLog.findByPatientId(patientId, { limit });
    for (const c of convLogs) {
      items.push({
        type: 'conversation',
        id: `conv_${c.id}`,
        sortKey: `${c.logDate}T${c.timestamp || '00:00'}`,
        logDate: c.logDate,
        timestamp: c.timestamp,
        data: { role: c.role, content: c.content, extra: c.extra ? JSON.parse(c.extra) : undefined },
      });
    }

    // 2) Meal records
    const mealLogs = date
      ? this.models.mealRecord.findByDate(patientId, date)
      : this.models.mealRecord.findByPatientId(patientId, { limit });
    for (const m of mealLogs) {
      const mealLabel = m.mealType === 'breakfast' ? '早餐' : m.mealType === 'lunch' ? '午餐' : m.mealType === 'dinner' ? '晚餐' : '加餐';
      const foods = JSON.parse(m.foods || '[]');
      const foodNames = foods.map((f: any) => f.name || f).join('、');
      items.push({
        type: 'meal',
        id: `meal_${m.id}`,
        sortKey: `${m.mealDate}T${m.mealTime || '00:00'}`,
        logDate: m.mealDate,
        timestamp: m.mealTime,
        data: {
          mealType: m.mealType,
          mealLabel,
          foods,
          foodNames,
          calories: m.calories,
          nutritionScore: m.nutritionScore,
          notes: m.notes,
        },
      });
    }

    // 3) Vital measurements
    const vitals = date
      ? this.models.vitalMeasurement.findByPatientId(patientId, 90, undefined).filter(v => v.measurementDate === date)
      : this.models.vitalMeasurement.findByPatientId(patientId, 90);
    for (const v of vitals) {
      const isPressure = v.metricType === 'blood_pressure';
      const value = isPressure ? `${v.systolicValue}/${v.diastolicValue}` : String(v.glucoseValue);
      const label = isPressure ? '血压' : '血糖';
      const contextLabel = !isPressure
        ? (v.glucoseContext === 'fasting' ? '空腹' : v.glucoseContext === 'post_meal' ? '餐后' : v.glucoseContext === 'before_sleep' ? '睡前' : '')
        : '';
      const followUpInfo = this.extractGlucoseFollowUpInfo(v);
      items.push({
        type: 'vital',
        id: `vital_${v.id}`,
        sortKey: v.measuredAt || `${v.measurementDate}T00:00`,
        logDate: v.measurementDate,
        timestamp: v.measuredAt ? v.measuredAt.split('T')[1]?.slice(0, 5) || '' : '',
        data: {
          metricType: v.metricType,
          label,
          value,
          unit: v.unit,
          contextLabel,
          sourceType: v.sourceType,
          notes: v.notes,
          sourceText: v.sourceText,
          followUpInfo,
          hasFollowUpInfo: Boolean(followUpInfo),
          status: this.normalizeVitalSummaryItem(v)?.status,
        },
      });
    }

    // Sort: newest first
    items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    // Limit
    const result = items.slice(0, limit);

    res.json({ success: true, data: result });
  });

  // --- Conversation Logs ---

  public getConversationLogs = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const date = req.query.date as string | undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000);
    this.ensurePatientExists(patientId);

    this.syncVitalsFromConversationLogs(patientId);

    const logs = (date
      ? this.models.conversationLog.findByPatientIdAndDate(patientId, date)
      : this.models.conversationLog.findByPatientId(patientId, { limit })
    )
      .map(c => ({ ...c, extra: c.extra ? JSON.parse(c.extra) : undefined }));

    res.json({ success: true, data: logs });
  });

  public getConversationDates = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    this.ensurePatientExists(patientId);

    const dates = this.models.conversationLog.getAvailableDates(patientId);

    res.json({ success: true, data: dates });
  });

  public appendConversationLog = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = appendConversationLogSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const dt = this.buildDateAndTime(data.timestamp, data.logDate);

    const created = this.models.conversationLog.create({
      patientId,
      role: data.role,
      content: data.content,
      timestamp: dt.time,
      logDate: dt.date,
      extra: data.extra ? JSON.stringify(data.extra) : undefined,
    } as any);

    const extracted = extractVitalMeasurementsFromText(data.content || '');
    const createdMeasurements: any[] = [];

    for (const measurement of extracted) {
      const existing = this.models.vitalMeasurement.findBySourceLog(measurement.metricType, created.id);
      if (existing) continue;

      const vital = this.models.vitalMeasurement.create({
        patientId,
        metricType: measurement.metricType,
        systolicValue: measurement.systolicValue,
        diastolicValue: measurement.diastolicValue,
        glucoseValue: measurement.glucoseValue,
        glucoseContext: measurement.glucoseContext,
        unit: measurement.unit,
        measuredAt: dt.measuredAt,
        measurementDate: dt.date,
        sourceType: config.voiceSourceType,
        sourceLogId: created.id,
        sourceText: data.content,
      } as any);

      createdMeasurements.push(this.normalizeVitalSummaryItem(vital));
    }

    let followUpUpdated: any = null;
    if (data.role === 'user' && extracted.every((measurement) => measurement.metricType !== 'blood_glucose')) {
      followUpUpdated = this.applyGlucoseFollowUpFromConversation(patientId, data.content || '');
    }

    res.status(201).json({
      success: true,
      data: {
        ...created,
        extra: created.extra ? JSON.parse(created.extra) : undefined,
        extractedVitals: createdMeasurements,
        followUpUpdatedVital: followUpUpdated ? this.normalizeVitalSummaryItem(followUpUpdated) : undefined,
      },
      message: '对话日志已写入',
    });
  });

  // --- Glucose Follow-Up (血糖追问 SOP) ---

  public getGlucoseFollowUp = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const query = glucoseFollowUpQuerySchema.parse(req.query);
    this.ensurePatientExists(patientId);

    // 查询近 14 天血糖记录，用于判断连续异常趋势
    const recentGlucoseRecords = this.models.vitalMeasurement
      .findByPatientId(patientId, 14, 'blood_glucose')
      .slice(0, 20);

    const recentHighCount = recentGlucoseRecords.filter((item) => {
      const value = Number(item.glucoseValue || 0);
      const threshold = item.glucoseContext === 'fasting' ? 7 : item.glucoseContext === 'post_meal' ? 10 : 11.1;
      return value >= threshold;
    }).length;

    const recentLowCount = recentGlucoseRecords.filter((item) => Number(item.glucoseValue || 0) < 3.9).length;

    const result = buildGlucoseFollowUp({
      glucoseValue: query.glucoseValue,
      glucoseContext: query.glucoseContext,
      measuredAt: query.measuredAt,
      recentHighCount,
      recentLowCount,
    });

    res.json({
      success: true,
      data: result,
      message: result.shouldAskFollowUp ? '已生成血糖追问建议' : '当前无需追加追问',
    });
  });

  public createVitalMeasurement = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.params.id;
    const data = createVitalMeasurementSchema.parse(req.body);
    this.ensurePatientExists(patientId);

    const normalizedMeasuredAtInput = data.measuredAt?.replace(' ', 'T');
    const dt = this.buildDateAndTime(
      normalizedMeasuredAtInput?.split('T')[1],
      data.measurementDate || normalizedMeasuredAtInput?.split('T')[0],
    );
    const effectiveMeasuredAt = data.measuredAt || dt.measuredAt;
    const effectiveMeasurementDate = data.measurementDate || dt.date;

    if (data.metricType === 'blood_pressure' && (data.systolicValue == null || data.diastolicValue == null)) {
      throw new AppError('血压记录需提供收缩压和舒张压', 400);
    }

    if (data.metricType === 'blood_glucose' && data.glucoseValue == null) {
      const supplementalRawText = [data.sourceText, data.notes].filter(Boolean).join('；');
      const inferredFollowUp = this.buildGlucoseFollowUpFromText(supplementalRawText || '');
      const inferredContext = inferredFollowUp?.context;
      const effectiveContext =
        data.glucoseContext && data.glucoseContext !== 'unknown'
          ? data.glucoseContext
          : inferredContext;
      const canSupplement = Boolean(
        effectiveContext ||
        (data.sourceText && data.sourceText.trim()) ||
        (data.notes && data.notes.trim()) ||
        inferredFollowUp?.noteText ||
        inferredFollowUp?.sourceText,
      );
      if (!canSupplement) {
        throw new AppError('血糖记录需提供血糖值，或补录追问信息（如餐后多久、服药情况）', 400);
      }

      const pending =
        this.models.vitalMeasurement.findLatestUnknownGlucoseByPatientId(patientId) ||
        this.models.vitalMeasurement.findByPatientId(patientId, 2, 'blood_glucose')[0];
      if (!pending) {
        throw new AppError('未找到可补充的血糖记录，请重新上报完整血糖值', 400);
      }

      const supplementalContextLabel =
        effectiveContext === 'fasting'
          ? '空腹'
          : effectiveContext === 'post_meal'
          ? '餐后'
          : effectiveContext === 'before_sleep'
          ? '睡前'
          : effectiveContext === 'random'
          ? '随机'
          : '未标注';

      const supplementalText =
        (data.sourceText && data.sourceText.trim()) ||
        inferredFollowUp?.sourceText ||
        (effectiveContext ? `测量场景补录为${supplementalContextLabel}` : '补录：已补充追问信息');
      const supplementalNote =
        (data.notes && data.notes.trim()) ||
        inferredFollowUp?.noteText ||
        (effectiveContext ? `补录：测量场景为${supplementalContextLabel}` : '补录：已补充追问信息');

      const mergedSourceText = [pending.sourceText, `[补录] ${supplementalText}`].filter(Boolean).join(' | ');
      const mergedNotes = [pending.notes, `[补录] ${supplementalNote}`].filter(Boolean).join('；');

      const updated = this.models.vitalMeasurement.update(pending.id, {
        glucoseContext: (effectiveContext || pending.glucoseContext) as any,
        sourceText: mergedSourceText || undefined,
        notes: mergedNotes || undefined,
      } as any);

      res.status(201).json({
        success: true,
        data: this.normalizeVitalSummaryItem(updated),
        message: '血糖追问信息已补充',
      });
      return;
    }

    if (data.metricType === 'blood_glucose' && data.glucoseValue != null && data.glucoseContext && data.glucoseContext !== 'unknown') {
      const recentGlucose = this.models.vitalMeasurement.findByPatientId(patientId, 2, 'blood_glucose').slice(0, 12);
      const normalizedMeasuredAt = effectiveMeasuredAt.slice(0, 16);
      const duplicateCandidate = recentGlucose.find((item) => {
        const sameValue = Math.abs(Number(item.glucoseValue || 0) - Number(data.glucoseValue || 0)) < 0.01;
        const sameMinute = (item.measuredAt || '').slice(0, 16) === normalizedMeasuredAt;
        return sameValue && sameMinute && item.glucoseContext === 'unknown';
      });

      if (duplicateCandidate) {
        const contextLabel =
          data.glucoseContext === 'fasting'
            ? '空腹'
            : data.glucoseContext === 'post_meal'
            ? '餐后'
            : data.glucoseContext === 'before_sleep'
            ? '睡前'
            : data.glucoseContext === 'random'
            ? '随机'
            : '未标注';

        const supplementalText = (data.sourceText && data.sourceText.trim()) || `测量场景补录为${contextLabel}`;
        const supplementalNote = (data.notes && data.notes.trim()) || `补录：测量场景为${contextLabel}`;

        const mergedSourceText = [duplicateCandidate.sourceText, `[补录] ${supplementalText}`].filter(Boolean).join(' | ');
        const mergedNotes = [duplicateCandidate.notes, `[补录] ${supplementalNote}`].filter(Boolean).join('；');

        const updatedByDedup = this.models.vitalMeasurement.update(duplicateCandidate.id, {
          glucoseContext: data.glucoseContext,
          sourceText: mergedSourceText || undefined,
          notes: mergedNotes || undefined,
        } as any);

        res.status(201).json({
          success: true,
          data: this.normalizeVitalSummaryItem(updatedByDedup),
          message: '血糖追问信息已合并到原记录',
        });
        return;
      }
    }

    const created = this.models.vitalMeasurement.create({
      patientId,
      metricType: data.metricType,
      systolicValue: data.systolicValue,
      diastolicValue: data.diastolicValue,
      glucoseValue: data.glucoseValue,
      glucoseContext: data.glucoseContext || 'unknown',
      unit: data.unit || (data.metricType === 'blood_pressure' ? 'mmHg' : 'mmol/L'),
      measuredAt: effectiveMeasuredAt,
      measurementDate: effectiveMeasurementDate,
      sourceType: (data.sourceType as any) || config.voiceSourceType,
      sourceText: data.sourceText,
      notes: data.notes,
    } as any);

    res.status(201).json({
      success: true,
      data: this.normalizeVitalSummaryItem(created),
      message: '生命体征记录已写入',
    });
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

export function createPatientController(models: Models) {
  return new PatientController(models);
}
