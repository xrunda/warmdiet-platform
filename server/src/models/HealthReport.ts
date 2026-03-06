/**
 * 健康报告模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { HealthReport } from '../types';

export class HealthReportModel extends BaseModel<HealthReport> {
  constructor(db: Database.Database) {
    super(db, 'health_reports');
  }

  /**
   * 获取患者的健康报告列表
   */
  public findByPatientId(patientId: string): HealthReport[] {
    return this.findMany({ patientId } as any, {
      orderBy: 'report_date',
      orderDirection: 'DESC',
    });
  }

  /**
   * 根据日期范围获取报告
   */
  public findByDateRange(
    patientId: string,
    startDate: string,
    endDate: string
  ): HealthReport[] {
    const sql = `
      SELECT * FROM health_reports
      WHERE patient_id = ?
      AND report_date >= ?
      AND report_date <= ?
      ORDER BY report_date DESC
    `;
    return this.query(sql, [patientId, startDate, endDate]);
  }

  /**
   * 获取最新报告
   */
  public findLatest(patientId: string): HealthReport | undefined {
    const sql = `
      SELECT * FROM health_reports
      WHERE patient_id = ?
      ORDER BY report_date DESC
      LIMIT 1
    `;
    const results = this.query(sql, [patientId]);
    return results[0];
  }
}