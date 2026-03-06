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
import { dataSanitizer } from './middleware/sanitizer';
import { createHospitalRoutes } from './routes/hospitals';
import { createDoctorRoutes } from './routes/doctors';
import { createAuthorizationRoutes } from './routes/authorizations';
import { createMealRoutes } from './routes/meals';
import { createReportRoutes } from './routes/reports';
import { createAccessLogRoutes } from './routes/accessLogs';

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

  // 数据脱敏中间件（对医生请求自动脱敏）
  app.use(dataSanitizer);

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // API 路由
  app.use('/api/hospitals', createHospitalRoutes());
  app.use('/api/doctors', createDoctorRoutes());
  app.use('/api/authorizations', createAuthorizationRoutes());
  app.use('/api/meals', createMealRoutes());
  app.use('/api/reports', createReportRoutes());
  app.use('/api/access-logs', createAccessLogRoutes());
  // app.use('/api/patients', patientRoutes);

  // 404 处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
}