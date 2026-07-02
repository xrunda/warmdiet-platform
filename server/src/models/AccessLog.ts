/**
 * 访问日志模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { AccessLog } from '../types';

export class AccessLogModel extends BaseModel<AccessLog> {
  constructor(db: Database.Database) {
    super(db, 'access_logs');
  }

  /**
   * 记录访问日志
   */
  public logAccess(data: Omit<AccessLog, 'id' | 'accessedAt'>): AccessLog {
    return this.create({
      ...data,
      accessedAt: new Date().toISOString(),
    });
  }

  /**
   * 获取医院的访问日志
   */
  public findByHospitalId(
    hospitalId: string,
    options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ): AccessLog[] {
    let sql = `SELECT * FROM access_logs WHERE hospital_id = ?`;

    const params: any[] = [hospitalId];

    if (options?.startDate) {
      sql += ` AND accessed_at >= ?`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      sql += ` AND accessed_at <= ?`;
      params.push(options.endDate);
    }

    sql += ` ORDER BY accessed_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    return this.db.prepare(sql).all(...params).map(row => this.mapToCamelCase(row));
  }

  /**
   * 获取医生的访问日志
   */
  public findByDoctorId(
    doctorId: string,
    options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ): AccessLog[] {
    let sql = `SELECT * FROM access_logs WHERE doctor_id = ?`;

    const params: any[] = [doctorId];

    if (options?.startDate) {
      sql += ` AND accessed_at >= ?`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      sql += ` AND accessed_at <= ?`;
      params.push(options.endDate);
    }

    sql += ` ORDER BY accessed_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    return this.db.prepare(sql).all(...params).map(row => this.mapToCamelCase(row));
  }

  /**
   * 获取患者的访问日志
   */
  public findByPatientId(
    patientId: string,
    options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ): AccessLog[] {
    let sql = `SELECT * FROM access_logs WHERE patient_id = ?`;

    const params: any[] = [patientId];

    if (options?.startDate) {
      sql += ` AND accessed_at >= ?`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      sql += ` AND accessed_at <= ?`;
      params.push(options.endDate);
    }

    sql += ` ORDER BY accessed_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    return this.db.prepare(sql).all(...params).map(row => this.mapToCamelCase(row));
  }

  /**
   * 统计访问次数（医院）
   */
  public countByHospitalId(hospitalId: string, startDate?: string, endDate?: string): number {
    let sql = `SELECT COUNT(*) as count FROM access_logs WHERE hospital_id = ?`;

    const params: any[] = [hospitalId];

    if (startDate) {
      sql += ` AND accessed_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND accessed_at <= ?`;
      params.push(endDate);
    }

    const result = this.db.prepare(sql).get(...params) as any;
    return result.count;
  }

  /**
   * 统计访问次数（医生）
   */
  public countByDoctorId(doctorId: string, startDate?: string, endDate?: string): number {
    let sql = `SELECT COUNT(*) as count FROM access_logs WHERE doctor_id = ?`;

    const params: any[] = [doctorId];

    if (startDate) {
      sql += ` AND accessed_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND accessed_at <= ?`;
      params.push(endDate);
    }

    const result = this.db.prepare(sql).get(...params) as any;
    return result.count;
  }

  /**
   * 获取访问统计（按日期）
   */
  public getDailyStats(hospitalId: string, days: number = 30): Array<{ date: string; count: number }> {
    const sql = `
      SELECT
        DATE(accessed_at) as date,
        COUNT(*) as count
      FROM access_logs
      WHERE hospital_id = ?
      AND datetime(accessed_at) >= datetime('now', '-${days} days')
      GROUP BY DATE(accessed_at)
      ORDER BY date DESC
    `;

    return this.db.prepare(sql).all(hospitalId).map((row: any) => ({
      date: row.date,
      count: row.count,
    }));
  }

  /**
   * 获取数据类型分布
   */
  public getDataTypeDistribution(hospitalId: string): Array<{ dataType: string; count: number }> {
    const sql = `
      SELECT
        data_type as dataType,
        COUNT(*) as count
      FROM access_logs
      WHERE hospital_id = ?
      AND datetime(accessed_at) >= datetime('now', '-30 days')
      GROUP BY data_type
      ORDER BY count DESC
    `;

    return this.db.prepare(sql).all(hospitalId).map((row: any) => ({
      dataType: row.dataType,
      count: row.count,
    }));
  }

  /**
   * 获取热门患者（访问次数最多）
   */
  public getTopPatients(hospitalId: string, limit: number = 10): Array<{ patientId: string; accessCount: number }> {
    const sql = `
      SELECT
        patient_id as patientId,
        COUNT(*) as accessCount
      FROM access_logs
      WHERE hospital_id = ?
      AND datetime(accessed_at) >= datetime('now', '-30 days')
      GROUP BY patient_id
      ORDER BY accessCount DESC
      LIMIT ?
    `;

    return this.db.prepare(sql).all(hospitalId, limit).map((row: any) => ({
      patientId: row.patientId,
      accessCount: row.accessCount,
    }));
  }
}