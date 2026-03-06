/**
 * 医院账号路由
 */

import { Router } from 'express';
import { createHospitalController } from '../controllers/hospitalController';
import { authenticateHospital } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

// 延迟初始化模型
let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createHospitalController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createHospitalController(models);
  }
  return { models, controller };
}

/**
 * @route   POST /api/hospitals/register
 * @desc    医院注册
 * @access  Public
 */
router.post('/register', (req, res, next) => getModels().controller.register(req, res, next));

/**
 * @route   POST /api/hospitals/login
 * @desc    医院登录
 * @access  Public
 */
router.post('/login', (req, res, next) => getModels().controller.login(req, res, next));

/**
 * @route   GET /api/hospitals/:id
 * @desc    获取医院信息
 * @access  Private (Hospital)
 */
router.get('/:id', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.getHospital(req, res, next));

/**
 * @route   PUT /api/hospitals/:id
 * @desc    更新医院信息
 * @access  Private (Hospital)
 */
router.put('/:id', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.updateHospital(req, res, next));

/**
 * @route   GET /api/hospitals/:id/subscription
 * @desc    获取订阅状态
 * @access  Private (Hospital)
 */
router.get('/:id/subscription', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.getSubscription(req, res, next));

/**
 * @route   POST /api/hospitals/:id/upgrade
 * @desc    升级套餐
 * @access  Private (Hospital)
 */
router.post('/:id/upgrade', authenticateHospital[0], authenticateHospital[1], (req, res, next) => getModels().controller.upgradePlan(req, res, next));

export default router;