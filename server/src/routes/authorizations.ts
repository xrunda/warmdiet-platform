/**
 * 授权管理路由
 */

import { Router } from 'express';
import { createAuthorizationController } from '../controllers/authorizationController';
import { authenticatePatient, authenticateDoctor } from '../middleware/auth';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

export function createAuthorizationRoutes() {
  const router = Router();
  const models = initModels(databaseConfig.getDatabase());
  const controller = createAuthorizationController(models);

  router.post('/', authenticatePatient[0], authenticatePatient[1], controller.createAuthorization);
  router.get('/patient/:patientId', authenticatePatient[0], authenticatePatient[1], controller.getPatientAuthorizations);
  router.get('/doctor/:doctorId', authenticateDoctor[0], authenticateDoctor[1], controller.getDoctorAuthorizations);
  router.get('/:id', authenticateDoctor[0], authenticateDoctor[1], controller.getAuthorization);
  router.put('/:id', authenticatePatient[0], authenticatePatient[1], controller.createAuthorization);
  router.delete('/:id', authenticatePatient[0], authenticatePatient[1], controller.revokeAuthorization);
  router.post('/:id/extend', authenticatePatient[0], authenticatePatient[1], controller.extendAuthorization);
  router.get('/verify', controller.verifyAccess);

  return router;
}

export default createAuthorizationRoutes;