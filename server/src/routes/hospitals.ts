/**
 * 医院账号路由
 */

import { Router } from 'express';
import { createHospitalController } from '../controllers/hospitalController';
import { authenticateHospital } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();
const models = initModels(databaseConfig.getDatabase());
const controller = createHospitalController(models);

/**
 * @route   POST /api/hospitals/register
 * @desc    医院注册
 * @access  Public
 */
router.post('/register', controller.register);

/**
 * @route   POST /api/hospitals/login
 * @desc    医院登录
 * @access  Public
 */
router.post('/login', controller.login);

/**
 * @route   GET /api/hospitals/:id
 * @desc    获取医院信息
 * @access  Private (Hospital)
 */
router.get('/:id', authenticateHospital[0], authenticateHospital[1], controller.getHospital);

/**
 * @route   PUT /api/hospitals/:id
 * @desc    更新医院信息
 * @access  Private (Hospital)
 */
router.put('/:id', authenticateHospital[0], authenticateHospital[1], controller.updateHospital);

/**
 * @route   GET /api/hospitals/:id/subscription
 * @desc    获取订阅状态
 * @access  Private (Hospital)
 */
router.get('/:id/subscription', authenticateHospital[0], authenticateHospital[1], controller.getSubscription);

/**
 * @route   POST /api/hospitals/:id/upgrade
 * @desc    升级套餐
 * @access  Private (Hospital)
 */
router.post('/:id/upgrade', authenticateHospital[0], authenticateHospital[1], controller.upgradePlan);

export default router;