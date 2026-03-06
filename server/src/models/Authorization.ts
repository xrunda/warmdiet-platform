/**
 * 授权记录模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { DoctorAuthorization, AuthorizationStatus } from '../types';

export class AuthorizationModel extends BaseModel<DoctorAuthorization> {
  constructor(db: Database.Database) {
    super(db, 'doctor_authorizations');
  }

  /**
   * 获取患者的授权列表
   */
  public findByPatientId(patientId: string): DoctorAuthorization[] {
    return this.findMany({ patientId } as any, { orderBy: 'authorized_at', orderDirection: 'DESC' });
  }

  /**
   * 获取医生的授权列表
   */
  public findByDoctorId(doctorId: string): DoctorAuthorization[] {
    return this.findMany({ doctorId } as any, { orderBy: 'authorized_at', orderDirection: 'DESC' });
  }

  /**
   * 获取有效的授权列表
   */
  public findActiveByPatientId(patientId: string): DoctorAuthorization[] {
    const sql = `
      SELECT * FROM doctor_authorizations
      WHERE patient_id = ?
      AND status = 'active'
      AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
      ORDER BY authorized_at DESC
    `;
    return this.query(sql, [patientId]);
  }

  /**
   * 获取有效的授权列表（医生）
   */
  public findActiveByDoctorId(doctorId: string): DoctorAuthorization[] {
    const sql = `
      SELECT * FROM doctor_authorizations
      WHERE doctor_id = ?
      AND status = 'active'
      AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
      ORDER BY authorized_at DESC
    `;
    return this.query(sql, [doctorId]);
  }

  /**
   * 检查授权是否有效
   */
  public isAuthorizationValid(authorizationId: string): boolean {
    const auth = this.findById(authorizationId);

    if (!auth) {
      return false;
    }

    if (auth.status !== 'active') {
      return false;
    }

    if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * 检查医生是否有权访问患者数据
   */
  public hasAccess(doctorId: string, patientId: string, dataType: string): boolean {
    const sql = `
      SELECT * FROM doctor_authorizations
      WHERE doctor_id = ?
      AND patient_id = ?
      AND status = 'active'
      AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
      AND json_extract(authorization_type, '$') LIKE ?
      LIMIT 1
    `;
    const result = this.db.prepare(sql).get(doctorId, patientId, `%${dataType}%`);
    return !!result;
  }

  /**
   * 撤销授权
   */
  public revoke(authorizationId: string): DoctorAuthorization | undefined {
    return this.update(authorizationId, {
      status: 'revoked' as AuthorizationStatus,
    } as any);
  }

  /**
   * 更新最后访问时间
   */
  public updateLastAccessed(authorizationId: string): DoctorAuthorization | undefined {
    return this.update(authorizationId, {
      lastAccessedAt: new Date().toISOString(),
    } as any);
  }

  /**
   * 增加访问次数
   */
  public incrementAccessCount(authorizationId: string): DoctorAuthorization | undefined {
    const auth = this.findById(authorizationId);
    if (!auth) {
      return undefined;
    }

    return this.update(authorizationId, {
      accessCount: (auth.accessCount || 0) + 1,
    } as any);
  }

  /**
   * 获取即将过期的授权（7天内）
   */
  public findExpiringSoon(): DoctorAuthorization[] {
    const sql = `
      SELECT * FROM doctor_authorizations
      WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND datetime(expires_at) > datetime('now')
      AND datetime(expires_at) <= datetime('now', '+7 days')
      ORDER BY expires_at ASC
    `;
    return this.query(sql);
  }

  /**
   * 延长授权
   */
  public extend(authorizationId: string, days: number): DoctorAuthorization | undefined {
    const auth = this.findById(authorizationId);
    if (!auth || auth.expiresAt) {
      return undefined;
    }

    const currentEnd = new Date(auth.expiresAt);
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    return this.update(authorizationId, {
      expiresAt: newEnd.toISOString(),
    } as any);
  }
}