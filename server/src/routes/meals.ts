/**
 * 餐食记录路由
 */

import { Router } from 'express';
import { createMealController } from '../controllers/mealController';
import { authenticatePatient, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

export function createMealRoutes() {
  const router = Router();
  const models = initModels(databaseConfig.getDatabase());
  const controller = createMealController(models);

  router.post('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.createMeal);
  router.get('/patient/:patientId', authenticateDoctor[0], authenticateDoctor[1], controller.getMeals);
  router.get('/patient/:patientId/:mealId', authenticateDoctor[0], authenticateDoctor[1], controller.getMeal);
  router.put('/patient/:patientId/:mealId', authenticatePatient[0], authenticatePatient[1], controller.updateMeal);
  router.delete('/patient/:patientId/:mealId', authenticatePatient[0], authenticatePatient[1], controller.deleteMeal);
  router.get('/patient/:patientId/stats', authenticateDoctor[0], authenticateDoctor[1], controller.getNutritionStats);

  return router;
}

export default createMealRoutes;