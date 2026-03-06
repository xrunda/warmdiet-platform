/**
 * 医院账号路由
 */

import { Router } from 'express';
import { createHospitalController } from '../controllers/hospitalController';
import { authenticateHospital } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

export function createHospitalRoutes() {
  const router = Router();
  const models = initModels(databaseConfig.getDatabase());
  const controller = createHospitalController(models);

// POST /api/hospitals/login
  router.post('/login', controller.login);

  // GET /api/hospitals/:id
  router.get('/:id', authenticateHospital[0], authenticateHospital[1], controller.getHospital);

  // PUT /api/hospitals/:id
  router.put('/:id', authenticateHospital[0], authenticateHospital[1], controller.updateHospital);

  // GET /api/hospitals/:id/subscription
  router.get('/:id/subscription', authenticateHospital[0], authenticateHospital[1], controller.getSubscription);

  // POST /api/hospitals/:id/upgrade
  router.post('/:id/upgrade', authenticateHospital[0], authenticateHospital[1], controller.upgradePlan);

  return router;
}

export default createHospitalRoutes;