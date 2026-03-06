/**
 * 访问日志路由
 */

import { Router } from 'express';
import { createAccessLogController } from '../controllers/accessLogController';
import { authenticateHospital, authenticateDoctor, authenticatePatient } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

export function createAccessLogRoutes() {
  const router = Router();
  const models = initModels(databaseConfig.getDatabase());
  const controller = createAccessLogController(models);

  router.get('/hospital/:hospitalId', authenticateHospital[0], authenticateHospital[1], controller.getHospitalLogs);
  router.get('/doctor/:doctorId', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctorLogs);
  router.get('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.getPatientLogs);
  router.get('/hospital/:hospitalId/stats', authenticateHospital[0], authenticateHospital[1], controller.getHospitalStats);
  router.get('/doctor/:doctorId/stats', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctorStats);

  return router;
}

export default createAccessLogRoutes;