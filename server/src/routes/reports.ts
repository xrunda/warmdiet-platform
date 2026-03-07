/**
 * 健康报告路由
 */

import { Router } from 'express';
import { createReportController } from '../controllers/reportController';
import { authenticatePatient, authenticateDoctorOrHospitalOrPatient } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

// 延迟初始化模型
let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createReportController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createReportController(models);
  }
  return { models, controller };
}

/**
 * @route   POST /api/patients/:patientId/reports
 * @desc    生成健康报告
 * @access  Private (Patient)
 */
router.post('/patient/:patientId', authenticatePatient, (req, res, next) => getModels().controller.createReport(req, res, next));

/**
 * @route   GET /api/patients/:patientId/reports
 * @desc    获取患者的健康报告列表
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId', authenticateDoctorOrHospitalOrPatient, (req, res, next) => getModels().controller.getReports(req, res, next));

/**
 * @route   GET /api/patients/:patientId/reports/latest
 * @desc    获取最新报告
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId/latest', authenticateDoctorOrHospitalOrPatient, (req, res, next) => getModels().controller.getLatestReport(req, res, next));

/**
 * @route   POST /api/patients/:patientId/reports/tomorrow-guide
 * @desc    获取明日用餐指引建议
 * @access  Private (Patient, Doctor)
 */
router.post('/patient/:patientId/tomorrow-guide', authenticateDoctorOrHospitalOrPatient, (req, res, next) => getModels().controller.getTomorrowGuide(req, res, next));

/**
 * @route   GET /api/patients/:patientId/reports/:reportId
 * @desc    获取单份报告
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId/:reportId', authenticateDoctorOrHospitalOrPatient, (req, res, next) => getModels().controller.getReport(req, res, next));

export default router;