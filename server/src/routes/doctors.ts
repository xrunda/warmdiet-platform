/**
 * 医生账号路由
 */

import { Router } from 'express';
import { createDoctorController } from '../controllers/doctorController';
import { authenticateHospital, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

// 延迟初始化模型
let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createDoctorController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createDoctorController(models);
  }
  return { models, controller };
}

/**
 * @route   POST /api/doctors
 * @desc    添加医生
 * @access  Private (Hospital)
 */
router.post('/', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.createDoctor(req, res, next));

/**
 * @route   GET /api/doctors
 * @desc    获取医生列表（医院）
 * @access  Private (Hospital)
 */
router.get('/', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.getDoctors(req, res, next));

/**
 * @route   GET /api/doctors/search
 * @desc    搜索医生
 * @access  Public
 */
router.get('/search', (req, res, next) => getModels().controller.searchDoctors(req, res, next));

/**
 * @route   GET /api/doctors/:id
 * @desc    获取医生信息
 * @access  Private
 */
router.get('/:id', authenticateDoctor[0], authenticateDoctor[1], (req, res, next) => getModels().controller.getDoctor(req, res, next));

/**
 * @route   PUT /api/doctors/:id
 * @desc    更新医生信息
 * @access  Private (Hospital)
 */
router.put('/:id', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.updateDoctor(req, res, next));

/**
 * @route   DELETE /api/doctors/:id
 * @desc    删除医生
 * @access  Private (Hospital)
 */
router.delete('/:id', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.deleteDoctor(req, res, next));

/**
 * @route   PATCH /api/doctors/:id/status
 * @desc    激活/暂停医生账号
 * @access  Private (Hospital)
 */
router.patch('/:id/status', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.toggleDoctorStatus(req, res, next));

export default router;