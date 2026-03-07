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
router.get('/:id', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getPatient(req, res, next));

/**
 * @route   PUT /api/patients/:id
 * @desc    更新患者信息
 * @access  Private (Patient)
 */
router.put('/:id', authenticatePatient, (req, res, next) => getModels().controller.updatePatient(req, res, next));

/**
 * @route   GET /api/patients/:id/health-conditions
 * @desc    获取患者健康状况列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/health-conditions', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getHealthConditions(req, res, next));

/**
 * @route   POST /api/patients/:id/health-conditions
 * @desc    添加健康状况
 * @access  Private (Patient)
 */
router.post('/:id/health-conditions', authenticatePatient, (req, res, next) => getModels().controller.addHealthCondition(req, res, next));

/**
 * @route   DELETE /api/patients/:id/health-conditions/:condId
 * @desc    移除健康状况
 * @access  Private (Patient)
 */
router.delete('/:id/health-conditions/:condId', authenticatePatient, (req, res, next) => getModels().controller.removeHealthCondition(req, res, next));

/**
 * @route   GET /api/patients/:id/medications
 * @desc    获取患者用药列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/medications', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getMedications(req, res, next));

/**
 * @route   POST /api/patients/:id/medications
 * @desc    添加用药记录
 * @access  Private (Patient)
 */
router.post('/:id/medications', authenticatePatient, (req, res, next) => getModels().controller.addMedication(req, res, next));

/**
 * @route   POST /api/patients/:id/medications/recognize-image
 * @desc    识别药品包装图片
 * @access  Private (Patient)
 */
router.post('/:id/medications/recognize-image', authenticatePatient, (req, res, next) => getModels().controller.recognizeMedicationImage(req, res, next));

/**
 * @route   PUT /api/patients/:id/medications/:medId
 * @desc    更新用药记录
 * @access  Private (Patient)
 */
router.put('/:id/medications/:medId', authenticatePatient, (req, res, next) => getModels().controller.updateMedication(req, res, next));

/**
 * @route   DELETE /api/patients/:id/medications/:medId
 * @desc    移除用药记录
 * @access  Private (Patient)
 */
router.delete('/:id/medications/:medId', authenticatePatient, (req, res, next) => getModels().controller.removeMedication(req, res, next));

/**
 * @route   GET /api/patients/:id/preferences
 * @desc    获取患者饮食偏好
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/preferences', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getPreferences(req, res, next));

/**
 * @route   PUT /api/patients/:id/preferences
 * @desc    更新患者饮食偏好
 * @access  Private (Patient)
 */
router.put('/:id/preferences', authenticatePatient, (req, res, next) => getModels().controller.updatePreferences(req, res, next));

/**
 * @route   GET /api/patients/:id/medical-orders
 * @desc    获取患者医嘱列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/medical-orders', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getMedicalOrders(req, res, next));

/**
 * @route   POST /api/patients/:id/medical-orders
 * @desc    新增医嘱
 * @access  Private (Patient)
 */
router.post('/:id/medical-orders', authenticatePatient, (req, res, next) => getModels().controller.createMedicalOrder(req, res, next));

/**
 * @route   POST /api/patients/:id/medical-orders/scan
 * @desc    扫描纸质医嘱并生成记录
 * @access  Private (Patient)
 */
router.post('/:id/medical-orders/scan', authenticatePatient, (req, res, next) => getModels().controller.scanMedicalOrder(req, res, next));

/**
 * @route   PUT /api/patients/:id/medical-orders/:orderId
 * @desc    更新医嘱
 * @access  Private (Patient)
 */
router.put('/:id/medical-orders/:orderId', authenticatePatient, (req, res, next) => getModels().controller.updateMedicalOrder(req, res, next));

/**
 * @route   PUT /api/patients/:id/medical-orders/:orderId/scan
 * @desc    重新扫描纸质医嘱并更新记录
 * @access  Private (Patient)
 */
router.put('/:id/medical-orders/:orderId/scan', authenticatePatient, (req, res, next) => getModels().controller.rescanMedicalOrder(req, res, next));

/**
 * @route   GET /api/patients/:id/diet-alerts
 * @desc    获取饮食预警列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/diet-alerts', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getDietAlerts(req, res, next));

/**
 * @route   GET /api/patients/:id/vital-measurements/latest
 * @desc    获取患者最新血压血糖摘要
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/vital-measurements/latest', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getLatestVitalMeasurements(req, res, next));

/**
 * @route   GET /api/patients/:id/vital-measurements
 * @desc    获取患者血压血糖记录
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/vital-measurements', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getVitalMeasurements(req, res, next));

/**
 * @route   GET /api/patients/:id/conversation-logs
 * @desc    获取对话记录
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/conversation-logs', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getConversationLogs(req, res, next));

/**
 * @route   GET /api/patients/:id/conversation-logs/dates
 * @desc    获取对话记录可用日期列表
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/conversation-logs/dates', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getConversationDates(req, res, next));

/**
 * @route   GET /api/patients/:id/dashboard
 * @desc    获取患者仪表盘数据
 * @access  Private (Patient / Doctor)
 */
router.get('/:id/dashboard', authenticateDoctorOrPatient, (req, res, next) => getModels().controller.getDashboard(req, res, next));

export default router;
