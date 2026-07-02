/**
 * 餐食记录模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { MealRecord, MealType } from '../types';

export class MealRecordModel extends BaseModel<MealRecord> {
  constructor(db: Database.Database) {
    super(db, 'meal_records');
  }

  /**
   * 获取患者的餐食记录
   */
  public findByPatientId(patientId: string, options?: { limit?: number; offset?: number }): MealRecord[] {
    let sql = `
      SELECT * FROM meal_records
      WHERE patient_id = ?
      ORDER BY meal_date DESC, meal_time DESC, created_at DESC
    `;

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    return this.query(sql, [patientId]) as MealRecord[];
  }

  /**
   * 根据日期范围查询
   */
  public findByDateRange(
    patientId: string,
    startDate: string,
    endDate: string
  ): MealRecord[] {
    const sql = `
      SELECT * FROM meal_records
      WHERE patient_id = ?
      AND meal_date >= ?
      AND meal_date <= ?
      ORDER BY meal_date DESC, meal_time DESC
    `;
    return this.query(sql, [patientId, startDate, endDate]);
  }

  /**
   * 根据餐食类型查询
   */
  public findByMealType(patientId: string, mealType: MealType): MealRecord[] {
    const sql = `
      SELECT * FROM meal_records
      WHERE patient_id = ?
      AND meal_type = ?
      ORDER BY meal_date DESC, meal_time DESC, created_at DESC
    `;
    return this.query(sql, [patientId, mealType]) as MealRecord[];
  }

  /**
   * 获取最近的餐食记录
   */
  public findRecent(patientId: string, days: number = 7): MealRecord[] {
    const sql = `
      SELECT * FROM meal_records
      WHERE patient_id = ?
      AND datetime(meal_date) >= datetime('now', '-${days} days')
      ORDER BY meal_date DESC, meal_time DESC
    `;
    return this.query(sql, [patientId]);
  }

  /**
   * 获取指定日期的餐食
   */
  public findByDate(patientId: string, date: string): MealRecord[] {
    const sql = `
      SELECT * FROM meal_records
      WHERE patient_id = ?
      AND meal_date = ?
      ORDER BY meal_time ASC
    `;
    return this.query(sql, [patientId, date]);
  }

  /**
   * 统计指定日期范围内的总热量
   */
  public getTotalCalories(patientId: string, startDate: string, endDate: string): number {
    const sql = `
      SELECT SUM(calories) as total
      FROM meal_records
      WHERE patient_id = ?
      AND meal_date >= ?
      AND meal_date <= ?
    `;
    const result = this.db.prepare(sql).get(patientId, startDate, endDate) as any;
    return result.total || 0;
  }

  /**
   * 获取平均营养分数
   */
  public getAverageNutritionScore(patientId: string, days: number = 7): number {
    const sql = `
      SELECT AVG(nutrition_score) as avg_score
      FROM meal_records
      WHERE patient_id = ?
      AND datetime(meal_date) >= datetime('now', '-${days} days')
    `;
    const result = this.db.prepare(sql).get(patientId) as any;
    return result.avg_score || 0;
  }
}