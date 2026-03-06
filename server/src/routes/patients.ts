/**
 * 患者账号路由
 */

import { Router } from 'express';
import { createPatientController } from '../controllers/patientController';
import { authenticatePatient, authenticateDoctorOrPatient } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createPatientController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createPatientController(models);
  }
  return { models, controller };
}

/**
 * @route   GET /api/patients/:id
 * @desc    获取患者信息
 * @access  Private (Patient / Doctor)
 */
router.get('/:id', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getPatient(req, res, next));

/**
 * @route   PUT /api/patients/:id
 * @desc    更新患者信息
 * @access  Private (Patient)
 */
router.put('/:id', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.updatePatient(req, res, next));

/**
 * @route   GET /api/patients/:id/health-conditions
 * @desc    获取患者健康状况列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/health-conditions', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getHealthConditions(req, res, next));

/**
 * @route   POST /api/patients/:id/health-conditions
 * @desc    添加健康状况
 * @access  Private (Patient)
 */
router.post('/:id/health-conditions', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.addHealthCondition(req, res, next));

/**
 * @route   DELETE /api/patients/:id/health-conditions/:condId
 * @desc    移除健康状况
 * @access  Private (Patient)
 */
router.delete('/:id/health-conditions/:condId', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.removeHealthCondition(req, res, next));

/**
 * @route   GET /api/patients/:id/medications
 * @desc    获取患者用药列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/medications', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getMedications(req, res, next));

/**
 * @route   POST /api/patients/:id/medications
 * @desc    添加用药记录
 * @access  Private (Patient)
 */
router.post('/:id/medications', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.addMedication(req, res, next));

/**
 * @route   DELETE /api/patients/:id/medications/:medId
 * @desc    移除用药记录
 * @access  Private (Patient)
 */
router.delete('/:id/medications/:medId', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.removeMedication(req, res, next));

/**
 * @route   GET /api/patients/:id/preferences
 * @desc    获取患者饮食偏好
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/preferences', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getPreferences(req, res, next));

/**
 * @route   PUT /api/patients/:id/preferences
 * @desc    更新患者饮食偏好
 * @access  Private (Patient)
 */
router.put('/:id/preferences', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.updatePreferences(req, res, next));

/**
 * @route   GET /api/patients/:id/medical-orders
 * @desc    获取患者医嘱列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/medical-orders', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getMedicalOrders(req, res, next));

/**
 * @route   PUT /api/patients/:id/medical-orders/:orderId
 * @desc    更新医嘱
 * @access  Private (Patient)
 */
router.put('/:id/medical-orders/:orderId', authenticatePatient[0], authenticatePatient[1], (req, res, next) => getModels().controller.updateMedicalOrder(req, res, next));

/**
 * @route   GET /api/patients/:id/diet-alerts
 * @desc    获取饮食预警列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/diet-alerts', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getDietAlerts(req, res, next));

/**
 * @route   GET /api/patients/:id/conversation-logs
 * @desc    获取对话记录
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/conversation-logs', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getConversationLogs(req, res, next));

/**
 * @route   GET /api/patients/:id/conversation-logs/dates
 * @desc    获取对话记录可用日期列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/conversation-logs/dates', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getConversationDates(req, res, next));

/**
 * @route   GET /api/patients/:id/dashboard
 * @desc    获取患者仪表盘数据
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/dashboard', authenticateDoctorOrPatient[0], authenticateDoctorOrPatient[1], (req, res, next) => getModels().controller.getDashboard(req, res, next));

export default router;
