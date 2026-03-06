/**
 * 医生账号路由
 */

import { Router } from 'express';
import { createDoctorController } from '../controllers/doctorController';
import { authenticateHospital, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();
const models = initModels(databaseConfig.getDatabase());
const controller = createDoctorController(models);

/**
 * @route   POST /api/doctors
 * @desc    添加医生
 * @access  Private (Hospital)
 */
router.post('/', authenticateHospital[0], authenticateHospital[1], controller.createDoctor);

/**
 * @route   GET /api/doctors
 * @desc    获取医生列表（医院）
 * @access  Private (Hospital)
 */
router.get('/', authenticateHospital[0], authenticateHospital[1], controller.getDoctors);

/**
 * @route   GET /api/doctors/search
 * @desc    搜索医生
 * @access  Public
 */
router.get('/search', controller.searchDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    获取医生信息
 * @access  Private
 */
router.get('/:id', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctor);

/**
 * @route   PUT /api/doctors/:id
 * @desc    更新医生信息
 * @access  Private (Hospital)
 */
router.put('/:id', authenticateHospital[0], authenticateHospital[1], controller.updateDoctor);

/**
 * @route   DELETE /api/doctors/:id
 * @desc    删除医生
 * @access  Private (Hospital)
 */
router.delete('/:id', authenticateHospital[0], authenticateHospital[1], controller.deleteDoctor);

/**
 * @route   PATCH /api/doctors/:id/status
 * @desc    激活/暂停医生账号
 * @access  Private (Hospital)
 */
router.patch('/:id/status', authenticateHospital[0], authenticateHospital[1], controller.toggleDoctorStatus);

export default router;