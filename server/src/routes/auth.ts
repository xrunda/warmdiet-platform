/**
 * 认证路由
 * 提供 REST API 接口：注册、登录、获取用户信息、修改密码、退出登录
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createAuthController } from '../controllers/authController';
import { initModels } from '../models';
import { databaseConfig } from '../config/database';

const router = Router();

let models: ReturnType<typeof initModels>;
let controller: ReturnType<typeof createAuthController>;

function getController() {
  if (!models) {
    models = initModels(databaseConfig.getDatabase());
    controller = createAuthController(models);
  }
  return controller;
}

// 公开路由
router.post('/register', (req, res, next) => getController().register(req, res, next));
router.post('/login', (req, res, next) => getController().login(req, res, next));

// 需要认证的路由
router.get('/profile', authenticate, (req, res, next) => getController().getProfile(req, res, next));
router.put('/change-password', authenticate, (req, res, next) => getController().changePassword(req, res, next));
router.post('/logout', authenticate, (req, res, next) => getController().logout(req, res, next));

export default router;
