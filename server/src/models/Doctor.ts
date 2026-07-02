/**
 * 医生账号模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { DoctorAccount } from '../types';

export class DoctorModel extends BaseModel<DoctorAccount> {
  constructor(db: Database.Database) {
    super(db, 'doctor_accounts');
  }

  /**
   * 根据执业证号查找医生
   */
  public findByLicenseNumber(licenseNumber: string): DoctorAccount | undefined {
    return this.findOne({ licenseNumber } as any);
  }

  /**
   * 根据医院 ID 获取医生列表
   */
  public findByHospitalId(hospitalId: string): DoctorAccount[] {
    return this.findMany({ hospitalId } as any);
  }

  /**
   * 获取活跃医生列表
   */
  public findActiveDoctors(): DoctorAccount[] {
    const sql = `
      SELECT * FROM doctor_accounts
      WHERE account_status = 'active'
      AND can_access_patient_data = 1
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

  /**
   * 搜索医生
   */
  public searchDoctors(keyword: string): DoctorAccount[] {
    const sql = `
      SELECT * FROM doctor_accounts
      WHERE name LIKE ?
      OR license_number LIKE ?
      OR department LIKE ?
      AND account_status = 'active'
      ORDER BY name ASC
    `;
    const searchTerm = `%${keyword}%`;
    return this.db.prepare(sql).all(searchTerm, searchTerm, searchTerm).map(row => this.mapToCamelCase(row));
  }

  /**
   * 激活医生账号
   */
  public activateDoctor(doctorId: string): DoctorAccount | undefined {
    return this.update(doctorId, {
      accountStatus: 'active',
      canAccessPatientData: true,
    } as any);
  }

  /**
   * 暂停医生账号
   */
  public suspendDoctor(doctorId: string): DoctorAccount | undefined {
    return this.update(doctorId, {
      accountStatus: 'suspended',
      canAccessPatientData: false,
    } as any);
  }
}