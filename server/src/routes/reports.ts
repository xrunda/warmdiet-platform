/**
 * 健康报告路由
 */

import { Router } from 'express';
import { createReportController } from '../controllers/reportController';
import { authenticatePatient, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();
const models = initModels(databaseConfig.getDatabase());
const controller = createReportController(models);

/**
 * @route   POST /api/patients/:patientId/reports
 * @desc    生成健康报告
 * @access  Private (Patient)
 */
router.post('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.createReport);

/**
 * @route   GET /api/patients/:patientId/reports
 * @desc    获取患者的健康报告列表
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId', authenticateDoctor[0], authenticateDoctor[1], controller.getReports);

/**
 * @route   GET /api/patients/:patientId/reports/latest
 * @desc    获取最新报告
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId/latest', authenticateDoctor[0], authenticateDoctor[1], controller.getLatestReport);

/**
 * @route   GET /api/patients/:patientId/reports/:reportId
 * @desc    获取单份报告
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId/:reportId', authenticateDoctor[0], authenticateDoctor[1], controller.getReport);

export default router;