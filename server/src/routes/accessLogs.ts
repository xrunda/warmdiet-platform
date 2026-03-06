/**
 * 访问日志路由
 */

import { Router } from 'express';
import { createAccessLogController } from '../controllers/accessLogController';
import { authenticateHospital, authenticateDoctor, authenticatePatient } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();
const models = initModels(databaseConfig.getDatabase());
const controller = createAccessLogController(models);

/**
 * @route   GET /api/access-logs/hospital/:hospitalId
 * @desc    获取医院的访问日志
 * @access  Private (Hospital, Doctor)
 */
router.get('/hospital/:hospitalId', authenticateHospital[0], authenticateHospital[1], controller.getHospitalLogs);

/**
 * @route   GET /api/access-logs/doctor/:doctorId
 * @desc    获取医生的访问日志
 * @access  Private (Doctor)
 */
router.get('/doctor/:doctorId', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctorLogs);

/**
 * @route   GET /api/access-logs/patient/:patientId
 * @desc    获取患者的访问日志
 * @access  Private (Patient)
 */
router.get('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.getPatientLogs);

/**
 * @route   GET /api/access-logs/hospital/:hospitalId/stats
 * @desc    获取医院访问统计
 * @access  Private (Hospital)
 */
router.get('/hospital/:hospitalId/stats', authenticateHospital[0], authenticateHospital[1], controller.getHospitalStats);

/**
 * @route   GET /api/access-logs/doctor/:doctorId/stats
 * @desc    获取医生访问统计
 * @access  Private (Doctor)
 */
router.get('/doctor/:doctorId/stats', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctorStats);

export default router;