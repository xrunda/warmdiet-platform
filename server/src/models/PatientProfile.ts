/**
 * 患者档案相关模型
 */

import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';
import { PatientHealthCondition, PatientMedication, PatientPreference, PatientMedicalOrder, PatientVitalMeasurement, DietAlert, ConversationLog } from '../types';

export class PatientHealthConditionModel extends BaseModel<PatientHealthCondition> {
  constructor(db: Database.Database) {
    super(db, 'patient_health_conditions');
  }

  public findByPatientId(patientId: string): PatientHealthCondition[] {
    const sql = `SELECT * FROM patient_health_conditions WHERE patient_id = ? AND is_active = 1 ORDER BY created_at DESC`;
    return this.query(sql, [patientId]);
  }
}

export class PatientMedicationModel extends BaseModel<PatientMedication> {
  constructor(db: Database.Database) {
    super(db, 'patient_medications');
  }

  public findByPatientId(patientId: string): PatientMedication[] {
    const sql = `SELECT * FROM patient_medications WHERE patient_id = ? AND is_active = 1 ORDER BY created_at DESC`;
    return this.query(sql, [patientId]);
  }
}

export class PatientPreferenceModel extends BaseModel<PatientPreference> {
  constructor(db: Database.Database) {
    super(db, 'patient_preferences');
  }

  public findByPatientId(patientId: string): PatientPreference | undefined {
    const sql = `SELECT * FROM patient_preferences WHERE patient_id = ? LIMIT 1`;
    const rows = this.query(sql, [patientId]);
    return rows[0];
  }
}

export class PatientMedicalOrderModel extends BaseModel<PatientMedicalOrder> {
  constructor(db: Database.Database) {
    super(db, 'patient_medical_orders');
  }

  public findByPatientId(patientId: string): PatientMedicalOrder[] {
    const sql = `SELECT * FROM patient_medical_orders WHERE patient_id = ? AND is_active = 1 ORDER BY order_date DESC`;
    return this.query(sql, [patientId]);
  }
}

export class PatientVitalMeasurementModel extends BaseModel<PatientVitalMeasurement> {
  constructor(db: Database.Database) {
    super(db, 'patient_vital_measurements');
  }

  public findByPatientId(patientId: string, days = 7, metricType?: string): PatientVitalMeasurement[] {
    const params: any[] = [patientId];
    let sql = `
      SELECT * FROM patient_vital_measurements
      WHERE patient_id = ?
      AND measurement_date >= date('now', ?)
    `;

    params.push(`-${days} days`);

    if (metricType) {
      sql += ' AND metric_type = ?';
      params.push(metricType);
    }

    sql += ' ORDER BY measured_at DESC, created_at DESC';
    return this.query(sql, params);
  }

  public findLatestByPatientId(patientId: string): PatientVitalMeasurement[] {
    const sql = `
      SELECT * FROM patient_vital_measurements
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY metric_type ORDER BY measured_at DESC, created_at DESC) AS rn
          FROM patient_vital_measurements
          WHERE patient_id = ?
        )
        WHERE rn = 1
      )
      ORDER BY measured_at DESC
    `;
    return this.query(sql, [patientId]);
  }

  public findBySourceLog(metricType: string, sourceLogId: string): PatientVitalMeasurement | undefined {
    return this.findOne({ metricType: metricType as any, sourceLogId } as any);
  }
}

export class DietAlertModel extends BaseModel<DietAlert> {
  constructor(db: Database.Database) {
    super(db, 'diet_alerts');
  }

  public findByPatientId(patientId: string, date?: string): DietAlert[] {
    if (date) {
      const sql = `SELECT * FROM diet_alerts WHERE patient_id = ? AND alert_date = ? ORDER BY created_at DESC`;
      return this.query(sql, [patientId, date]);
    }
    const sql = `SELECT * FROM diet_alerts WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20`;
    return this.query(sql, [patientId]);
  }
}

export class ConversationLogModel extends BaseModel<ConversationLog> {
  constructor(db: Database.Database) {
    super(db, 'conversation_logs');
  }

  public findByPatientIdAndDate(patientId: string, date: string): ConversationLog[] {
    const sql = `SELECT * FROM conversation_logs WHERE patient_id = ? AND log_date = ? ORDER BY timestamp ASC`;
    return this.query(sql, [patientId, date]);
  }

  public getAvailableDates(patientId: string): string[] {
    const sql = `SELECT DISTINCT log_date FROM conversation_logs WHERE patient_id = ? ORDER BY log_date DESC LIMIT 30`;
    const rows = this.db.prepare(sql).all(patientId) as any[];
    return rows.map(r => r.log_date);
  }

  public findRecentUserLogs(patientId: string, limit = 60): ConversationLog[] {
    const sql = `
      SELECT * FROM conversation_logs
      WHERE patient_id = ? AND role = 'user'
      ORDER BY log_date DESC, timestamp DESC
      LIMIT ?
    `;
    return this.query(sql, [patientId, limit]);
  }
}
