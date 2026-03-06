/**
 * Express 应用配置
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { getLoggerMiddleware } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // 安全中间件
  app.use(helmet());

  // CORS 配置
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));

  // 请求解析
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 日志中间件
  app.use(getLoggerMiddleware());

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // API 路由（待添加）
  // app.use('/api/hospitals', hospitalRoutes);
  // app.use('/api/doctors', doctorRoutes);
  // app.use('/api/patients', patientRoutes);
  // app.use('/api/authorizations', authorizationRoutes);
  // app.use('/api/meals', mealRoutes);
  // app.use('/api/reports', reportRoutes);
  // app.use('/api/access-logs', accessLogRoutes);

  // 404 处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
}