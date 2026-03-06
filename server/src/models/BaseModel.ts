/**
 * 基础模型类
 * 提供通用的 CRUD 操作
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';

export abstract class BaseModel<T> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(db: Database.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * 生成唯一 ID
   */
  protected generateId(): string {
    return `${this.tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建记录
   */
  public create(data: Partial<T>): T {
    const id = this.generateId();
    const now = new Date().toISOString();

    const fields = ['id', 'created_at', 'updated_at', ...Object.keys(data)];
    const values = [id, now, now, ...Object.values(data)];

    const placeholders = values.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

    try {
      this.db.prepare(sql).run(...values);
      logger.debug(`Created record in ${this.tableName}:`, id);
      return this.findById(id) as T;
    } catch (error) {
      logger.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * 根据 ID 查找
   */
  public findById(id: string): T | undefined {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = this.db.prepare(sql).get(id) as any;
    return row ? this.mapToCamelCase(row) : undefined;
  }

  /**
   * 查找所有记录
   */
  public findAll(options?: { limit?: number; offset?: number; orderBy?: string; orderDirection?: 'ASC' | 'DESC' }): T[] {
    let sql = `SELECT * FROM ${this.tableName}`;

    if (options?.orderBy) {
      const direction = options.orderDirection || 'DESC';
      sql += ` ORDER BY ${options.orderBy} ${direction}`;
    }

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const rows = this.db.prepare(sql).all() as any[];
    return rows.map(row => this.mapToCamelCase(row));
  }

  /**
   * 更新记录
   */
  public update(id: string, data: Partial<T>): T | undefined {
    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) {
      return this.findById(id);
    }

    const setClause = fields.map(field => `${this.toSnakeCase(field)} = ?`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = ? WHERE id = ?`;

    try {
      this.db.prepare(sql).run(...values, new Date().toISOString(), id);
      logger.debug(`Updated record in ${this.tableName}:`, id);
      return this.findById(id);
    } catch (error) {
      logger.error(`Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * 删除记录
   */
  public delete(id: string): boolean {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = this.db.prepare(sql).run(id);
    logger.debug(`Deleted record from ${this.tableName}:`, id);
    return result.changes > 0;
  }

  /**
   * 查询一条记录
   */
  public findOne(conditions: Partial<T>): T | undefined {
    const whereClause = Object.keys(conditions)
      .map(key => `${this.toSnakeCase(key)} = ?`)
      .join(' AND ');

    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
    const values = Object.values(conditions);

    const row = this.db.prepare(sql).get(...values) as any;
    return row ? this.mapToCamelCase(row) : undefined;
  }

  /**
   * 查询多条记录
   */
  public findMany(conditions: Partial<T>, options?: { limit?: number; offset?: number }): T[] {
    const whereClause = Object.keys(conditions)
      .map(key => `${this.toSnakeCase(key)} = ?`)
      .join(' AND ');

    let sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const values = Object.values(conditions);
    const rows = this.db.prepare(sql).all(...values) as any[];
    return rows.map(row => this.mapToCamelCase(row));
  }

  /**
   * 统计记录数
   */
  public count(conditions?: Partial<T>): number {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${this.toSnakeCase(key)} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    const values = conditions ? Object.values(conditions) : [];
    const result = this.db.prepare(sql).get(...values) as any;
    return result.count;
  }

  /**
   * 执行自定义查询
   */
  public query(sql: string, params: any[] = []): any[] {
    const rows = this.db.prepare(sql).all(...params);
    return rows.map(row => this.mapToCamelCase(row));
  }

  /**
   * 将数据库字段（snake_case）转换为 JavaScript 对象属性（camelCase）
   */
  protected mapToCamelCase(row: any): any {
    const result: any = {};

    for (const key in row) {
      const camelCaseKey = this.toCamelCase(key);
      result[camelCaseKey] = row[key];
    }

    return result;
  }

  /**
   * 将 camelCase 转换为 snake_case
   */
  protected toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 将 snake_case 转换为 camelCase
   */
  protected toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}