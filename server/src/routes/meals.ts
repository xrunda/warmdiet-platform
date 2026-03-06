/**
 * 餐食记录路由
 */

import { Router } from 'express';
import { createMealController } from '../controllers/mealController';
import { authenticatePatient, authenticateDoctor, authenticateHospital } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();
const models = initModels(databaseConfig.getDatabase());
const controller = createMealController(models);

/**
 * @route   POST /api/patients/:patientId/meals
 * @desc    添加餐食记录
 * @access  Private (Patient)
 */
router.post('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.createMeal);

/**
 * @route   GET /api/patients/:patientId/meals
 * @desc    获取患者的餐食记录
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId', authenticateDoctor[0], authenticateDoctor[1], controller.getMeals);

/**
 * @route   GET /api/patients/:patientId/meals/:mealId
 * @desc    获取单条餐食记录
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId/:mealId', authenticateDoctor[0], authenticateDoctor[1], controller.getMeal);

/**
 * @route   PUT /api/patients/:patientId/meals/:mealId
 * @desc    更新餐食记录
 * @access  Private (Patient)
 */
router.put('/patient/:patientId/:mealId', authenticatePatient[0], authenticatePatient[1], controller.updateMeal);

/**
 * @route   DELETE /api/patients/:patientId/meals/:mealId
 * @desc    删除餐食记录
 * @access  Private (Patient)
 */
router.delete('/patient/:patientId/:mealId', authenticatePatient[0], authenticatePatient[1], controller.deleteMeal);

/**
 * @route   GET /api/patients/:patientId/meals/stats
 * @desc    获取营养统计
 * @access  Private (Patient, Doctor)
 */
router.get('/patient/:patientId/stats', authenticateDoctor[0], authenticateDoctor[1], controller.getNutritionStats);

export default router;