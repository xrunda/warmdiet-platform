/**
 * 授权管理路由
 */

import { Router } from 'express';
import { createAuthorizationController } from '../controllers/authorizationController';
import { authenticatePatient, authenticateDoctor, authenticateDoctorOrHospital } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

// 延迟初始化模型
let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createAuthorizationController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createAuthorizationController(models);
  }
  return { models, controller };
}

/**
 * @route   POST /api/authorizations
 * @desc    创建授权
 * @access  Private (Patient)
 */
router.post('/', authenticatePatient, (req, res, next) => getModels().controller.createAuthorization(req, res, next));

/**
 * @route   GET /api/patients/:patientId/authorizations
 * @desc    获取患者的授权列表
 * @access  Private (Patient)
 */
router.get('/patient/:patientId', authenticatePatient, (req, res, next) => getModels().controller.getPatientAuthorizations(req, res, next));

/**
 * @route   GET /api/patients/:patientId/authorizations/detailed
 * @desc    获取患者的授权列表（包含医生信息），用于家属端 H5
 * @access  Private (Patient)
 */
router.get(
  '/patient/:patientId/detailed',
  authenticatePatient[0],
  authenticatePatient[1],
  (req, res, next) => getModels().controller.getPatientAuthorizationsDetailed(req, res, next)
);

/**
 * @route   GET /api/doctors/:doctorId/authorizations
 * @desc    获取医生的授权列表
 * @access  Private (Doctor)
 */
router.get('/doctor/:doctorId', authenticateDoctorOrHospital, (req, res, next) => getModels().controller.getDoctorAuthorizations(req, res, next));

/**
 * @route   GET /api/authorizations/:id
 * @desc    获取授权详情
 * @access  Private
 */
router.get('/:id', authenticateDoctor, (req, res, next) => getModels().controller.getAuthorization(req, res, next));

/**
 * @route   PUT /api/authorizations/:id
 * @desc    更新授权
 * @access  Private (Patient)
 */
router.put('/:id', authenticatePatient, (req, res, next) => getModels().controller.createAuthorization(req, res, next));

/**
 * @route   DELETE /api/authorizations/:id
 * @desc    撤销授权
 * @access  Private (Patient)
 */
router.delete('/:id', authenticatePatient, (req, res, next) => getModels().controller.revokeAuthorization(req, res, next));

/**
 * @route   POST /api/authorizations/:id/extend
 * @desc    延长授权
 * @access  Private (Patient)
 */
router.post('/:id/extend', authenticatePatient, (req, res, next) => getModels().controller.extendAuthorization(req, res, next));

/**
 * @route   GET /api/authorizations/verify
 * @desc    验证访问权限
 * @access  Public
 */
router.get('/verify', (req, res, next) => getModels().controller.verifyAccess(req, res, next));

export default router;