/**
 * 医院账号模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { HospitalAccount, PlanType, SubscriptionStatus, BillingCycle } from '../types';

export class HospitalModel extends BaseModel<HospitalAccount> {
  constructor(db: Database.Database) {
    super(db, 'hospital_accounts');
  }

  /**
   * 根据统一社会信用代码查找医院
   */
  public findByHospitalId(hospitalId: string): HospitalAccount | undefined {
    return this.findOne({ hospitalId } as any);
  }

  /**
   * 获取订阅状态为活跃的医院列表
   */
  public findActiveSubscriptions(): HospitalAccount[] {
    const sql = `
      SELECT * FROM hospital_accounts
      WHERE subscription_status = 'active'
      AND datetime(subscription_end) > datetime('now')
      ORDER BY subscription_end DESC
    `;
    return this.query(sql);
  }

  /**
   * 获取即将过期的医院（7天内）
   */
  public findExpiringSoon(): HospitalAccount[] {
    const sql = `
      SELECT * FROM hospital_accounts
      WHERE subscription_status = 'active'
      AND datetime(subscription_end) > datetime('now')
      AND datetime(subscription_end) <= datetime('now', '+7 days')
      ORDER BY subscription_end ASC
    `;
    return this.query(sql);
  }

  /**
   * 检查医院订阅是否有效
   */
  public isSubscriptionValid(hospitalId: string): boolean {
    const hospital = this.findByHospitalId(hospitalId);

    if (!hospital) {
      return false;
    }

    if (hospital.subscriptionStatus !== 'active') {
      return false;
    }

    const expiryDate = new Date(hospital.subscriptionEnd);
    return expiryDate > new Date();
  }

  /**
   * 获取医院下的医生数量
   */
  public getDoctorCount(hospitalId: string): number {
    const sql = `
      SELECT COUNT(*) as count
      FROM doctor_accounts
      WHERE hospital_id = ?
      AND account_status = 'active'
    `;
    const result = this.db.prepare(sql).get(hospitalId) as any;
    return result.count;
  }

  /**
   * 更新订阅状态
   */
  public updateSubscriptionStatus(hospitalId: string, status: SubscriptionStatus): HospitalAccount | undefined {
    const hospital = this.findByHospitalId(hospitalId);

    if (!hospital) {
      return undefined;
    }

    return this.update(hospital.id, {
      subscriptionStatus: status,
    } as any);
  }

  /**
   * 延长订阅时间
   */
  public extendSubscription(hospitalId: string, days: number): HospitalAccount | undefined {
    const hospital = this.findByHospitalId(hospitalId);

    if (!hospital) {
      return undefined;
    }

    const currentEnd = new Date(hospital.subscriptionEnd);
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    return this.update(hospital.id, {
      subscriptionEnd: newEnd.toISOString(),
    } as any);
  }

  /**
   * 升级/降级套餐
   */
  public changePlan(hospitalId: string, planType: PlanType, maxDoctors: number): HospitalAccount | undefined {
    const hospital = this.findByHospitalId(hospitalId);

    if (!hospital) {
      return undefined;
    }

    return this.update(hospital.id, {
      planType,
      maxDoctors,
    } as any);
  }
}