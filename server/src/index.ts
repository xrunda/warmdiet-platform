/**
 * 服务器入口文件
 */

import { createApp } from './app';
import { databaseConfig } from './config/database';
import { config } from './config/env';
import { logger } from './utils/logger';

// 初始化数据库
databaseConfig.initialize();

// 创建 Express 应用
const app = createApp();

// 启动服务器
const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`);
  logger.info(`📡 Environment: ${config.nodeEnv}`);
  logger.info(`🏥 Health check: http://localhost:${config.port}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    databaseConfig.close();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    databaseConfig.close();
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;