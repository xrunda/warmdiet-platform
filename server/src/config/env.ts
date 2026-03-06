/**
 * 环境变量配置
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3001', 10),
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

  // 日志级别
  logLevel: process.env.LOG_LEVEL || 'info',
};