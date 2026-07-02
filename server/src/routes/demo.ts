/**
 * Demo 路由
 * 仅用于本地开发/演示，为家属端 H5 提供一个固定的患者 Token。
 */

import { Router } from 'express';
import { authService } from '../services/authService';
import { ApiResponse } from '../types';

const router = Router();

/**
 * @route   POST /api/demo/patient-token
 * @desc    获取测试患者的 JWT（patient_test_001）
 * @access  Public（仅用于本地开发）
 */
router.post('/patient-token', (req, res) => {
  const token = authService.generateToken({
    userId: 'patient_test_001',
    type: 'patient',
  });

  const response: ApiResponse = {
    success: true,
    data: {
      token,
      patientId: 'patient_test_001',
    },
    message: 'Demo patient token generated',
  };

  res.json(response);
});

export default router;

