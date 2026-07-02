/**
 * AI 会诊路由
 */

import { Router } from 'express';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';
import { authenticateDoctorOrHospitalOrPatient, authenticatePatient } from '../middleware/auth';
import { createAIConsultationController } from '../controllers/aiConsultationController';

const router = Router();

let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createAIConsultationController>;

function getModels() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createAIConsultationController(models);
  }
  return { models, controller };
}

/**
 * GET /api/ai-consultations/patient/:id
 * 获取患者的 AI 会诊报告列表
 * 权限: 患者本人 / 医生（有授权）/ 医院（有授权）
 */
router.get('/patient/:id', authenticateDoctorOrHospitalOrPatient, (req, res, next) => {
  getModels().controller.getReports(req, res, next);
});

/**
 * GET /api/ai-consultations/patient/:id/latest
 * 获取患者最新一份 AI 会诊报告
 * 权限: 患者本人 / 医生（有授权）/ 医院（有授权）
 */
router.get('/patient/:id/latest', authenticateDoctorOrHospitalOrPatient, (req, res, next) => {
  getModels().controller.getLatestReport(req, res, next);
});

/**
 * POST /api/ai-consultations/patient/:id
 * 创建新的 AI 会诊报告（上传检查报告图片/文本）
 * 权限: 患者本人
 */
router.post('/patient/:id', authenticatePatient, (req, res, next) => {
  getModels().controller.createReport(req, res, next);
});

/**
 * POST /api/ai-consultations/:reportId/retry-html
 * 重新生成 HTML 报告（用于 completed 但缺失 htmlReportUrl 的报告）
 * 权限: 患者本人
 */
router.post('/:reportId/retry-html', authenticatePatient, (req, res, next) => {
  getModels().controller.retryHtmlReport(req, res, next);
});

/**
 * PATCH /api/ai-consultations/:reportId
 * 更新报告（如修改标题）
 */
router.put('/:reportId', authenticatePatient, (req, res, next) => {
  getModels().controller.updateReport(req, res, next);
});

/**
 * DELETE /api/ai-consultations/:reportId
 * 删除 AI 会诊报告
 * 权限: 患者本人
 */
router.delete('/:reportId', authenticatePatient, (req, res, next) => {
  getModels().controller.deleteReport(req, res, next);
});

export default router;
