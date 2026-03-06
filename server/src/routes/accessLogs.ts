/**
 * 访问日志路由
 */

import { Router } from 'express';
import { createAccessLogController } from '../controllers/accessLogController';
import { authenticateHospital, authenticateDoctor, authenticatePatient } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

// 延迟初始化模型
let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createAccessLogController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createAccessLogController(models);
  }
  return { models, controller };
}

/**
 * @route   GET /api/access-logs/hospital/:hospitalId
 * @desc    获取医院的访问日志
 * @access  Private (Hospital, Doctor)
 */
router.get('/hospital/:hospitalId', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.getHospitalLogs(req, res, next));

/**
 * @route   GET /api/access-logs/doctor/:doctorId
 * @desc    获取医生的访问日志
 * @access  Private (Doctor)
 */
router.get('/doctor/:doctorId', authenticateDoctor[0], authenticateDoctor[1], (req, res, next) => getModels().controller.getDoctorLogs(req, res, next));

/**
 * @route   GET /api/access-logs/patient/:patientId
 * @desc    获取患者的访问日志
 * @access  Private (Patient)
 */
router.get('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.getPatientLogs(req, res, next));

/**
 * @route   GET /api/access-logs/hospital/:hospitalId/stats
 * @desc    获取医院访问统计
 * @access  Private (Hospital)
 */
router.get('/hospital/:hospitalId/stats', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.getHospitalStats(req, res, next));

/**
 * @route   GET /api/access-logs/doctor/:doctorId/stats
 * @desc    获取医生访问统计
 * @access  Private (Doctor)
 */
router.get('/doctor/:doctorId/stats', authenticateDoctor[0], authenticateDoctor[1], (req, res, next) => getModels().controller.getDoctorStats(req, res, next));

export default router;