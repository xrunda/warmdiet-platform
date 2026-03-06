/**
 * 医生账号路由
 */

import { Router } from 'express';
import { createDoctorController } from '../controllers/doctorController';
import { authenticateHospital, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

export function createDoctorRoutes() {
  const router = Router();
  const models = initModels(databaseConfig.getDatabase());
  const controller = createDoctorController(models);

  router.post('/', authenticateHospital[0], authenticateHospital[1], controller.createDoctor);
  router.get('/', authenticateHospital[0], authenticateHospital[1], controller.getDoctors);
  router.get('/search', controller.searchDoctors);
  router.get('/:id', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctor);
  router.put('/:id', authenticateHospital[0], authenticateHospital[1], controller.updateDoctor);
  router.delete('/:id', authenticateHospital[0], authenticateHospital[1], controller.deleteDoctor);
  router.patch('/:id/status', authenticateHospital[0], authenticateHospital[1], controller.toggleDoctorStatus);

  return router;
}

export default createDoctorRoutes;