/**
 * 环境变量配置
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 依次加载环境变量，本地配置优先
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env.local'), override: true });

export const config = {
  // 服务器配置（开发环境默认使用 4000，避免与本地工具端口冲突）
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '../../data/warmdiet.db'),

  // JWT 配置
  jwtSecret: process.env.JWT_SECRET || 'warmdiet-jwt-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS 配置
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // 加密配置
  saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),

  // API 密钥
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterAppName: process.env.OPENROUTER_APP_NAME || 'WarmDiet Platform OCR',
  openRouterAppUrl: process.env.OPENROUTER_APP_URL || 'http://localhost:4100',

  // 日志级别
  logLevel: process.env.LOG_LEVEL || 'info',
};