/**
 * 数据库配置和初始化
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './env';

// ES module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseConfig {
  private db: Database.Database | null = null;

  /**
   * 初始化数据库
   */
  public initialize(): Database.Database {
    // 确保数据目录存在
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 创建数据库连接
    this.db = new Database(config.databasePath);

    // 启用外键约束
    this.db.pragma('foreign_keys = ON');

    // 创建表结构
    this.createTables();

    console.log('✅ Database initialized:', config.databasePath);

    return this.db;
  }

  /**
   * 获取数据库实例
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * 创建表结构
   */
  private createTables(): void {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️ Schema file not found:', schemaPath);
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 执行 SQL 脚本
    this.db!.exec(schema);

    console.log('✅ Tables created successfully');
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ Database closed');
    }
  }
}

// 导出单例
export const databaseConfig = new DatabaseConfig();
export const db = databaseConfig.getDatabase.bind(databaseConfig);