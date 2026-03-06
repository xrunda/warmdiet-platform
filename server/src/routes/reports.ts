/**
 * 健康报告路由
 */

import { Router } from 'express';
import { createReportController } from '../controllers/reportController';
import { authenticatePatient, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

export function createReportRoutes() {
  const router = Router();
  const models = initModels(databaseConfig.getDatabase());
  const controller = createReportController(models);

  router.post('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.createReport);
  router.get('/patient/:patientId', authenticateDoctor[0], authenticateDoctor[1], controller.getReports);
  router.get('/patient/:patientId/latest', authenticateDoctor[0], authenticateDoctor[1], controller.getLatestReport);
  router.get('/patient/:patientId/:reportId', authenticateDoctor[0], authenticateDoctor[1], controller.getReport);

  return router;
}

export default createReportRoutes;