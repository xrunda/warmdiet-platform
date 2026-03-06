/**
 * 患者账号模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { PatientAccount } from '../types';

export class PatientModel extends BaseModel<PatientAccount> {
  constructor(db: Database.Database) {
    super(db, 'patient_accounts');
  }

  /**
   * 根据邮箱查找患者
   */
  public findByEmail(email: string): PatientAccount | undefined {
    return this.findOne({ email } as any);
  }

  /**
   * 搜索患者
   */
  public searchPatients(keyword: string): PatientAccount[] {
    const sql = `
      SELECT * FROM patient_accounts
      WHERE name LIKE ?
      OR email LIKE ?
      OR phone LIKE ?
      ORDER BY name ASC
    `;
    const searchTerm = `%${keyword}%`;
    return this.db.prepare(sql).all(searchTerm, searchTerm, searchTerm).map(row => this.mapToCamelCase(row));
  }
}