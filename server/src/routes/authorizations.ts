/**
 * 授权管理路由
 */

import { Router } from 'express';
import { createAuthorizationController } from '../controllers/authorizationController';
import { authenticatePatient, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();
const models = initModels(databaseConfig.getDatabase());
const controller = createAuthorizationController(models);

/**
 * @route   POST /api/authorizations
 * @desc    创建授权
 * @access  Private (Patient)
 */
router.post('/', authenticatePatient[0], authenticatePatient[1], controller.createAuthorization);

/**
 * @route   GET /api/patients/:patientId/authorizations
 * @desc    获取患者的授权列表
 * @access  Private (Patient)
 */
router.get('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.getPatientAuthorizations);

/**
 * @route   GET /api/doctors/:doctorId/authorizations
 * @desc    获取医生的授权列表
 * @access  Private (Doctor)
 */
router.get('/doctor/:doctorId', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctorAuthorizations);

/**
 * @route   GET /api/authorizations/:id
 * @desc    获取授权详情
 * @access  Private
 */
router.get('/:id', authenticateDoctor[0], authenticateDoctor[1], controller.getAuthorization);

/**
 * @route   PUT /api/authorizations/:id
 * @desc    更新授权
 * @access  Private (Patient)
 */
router.put('/:id', authenticatePatient[0], authenticatePatient[1], controller.createAuthorization);

/**
 * @route   DELETE /api/authorizations/:id
 * @desc    撤销授权
 * @access  Private (Patient)
 */
router.delete('/:id', authenticatePatient[0], authenticatePatient[1], controller.revokeAuthorization);

/**
 * @route   POST /api/authorizations/:id/extend
 * @desc    延长授权
 * @access  Private (Patient)
 */
router.post('/:id/extend', authenticatePatient[0], authenticatePatient[1], controller.extendAuthorization);

/**
 * @route   GET /api/authorizations/verify
 * @desc    验证访问权限
 * @access  Public
 */
router.get('/verify', controller.verifyAccess);

export default router;