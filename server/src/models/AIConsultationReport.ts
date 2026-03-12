import Database from 'better-sqlite3';
import { BaseModel } from './BaseModel';

export interface AIConsultationReport {
  id: string;
  patientId: string;
  title: string;
  sourceType: 'lab' | 'checkup' | 'imaging' | 'mixed';
  sourceFiles: string;
  extractedContent: string;
  modelAnalysis: string;
  consultationSummary: string;
  htmlReportUrl?: string;
  externalTaskId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  riskLevel: 'low' | 'medium' | 'high';
  tags: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export class AIConsultationReportModel extends BaseModel<AIConsultationReport> {
  constructor(db: Database.Database) {
    super(db, 'ai_consultation_reports');
  }

  public findByPatientId(patientId: string): AIConsultationReport[] {
    const sql = `SELECT * FROM ai_consultation_reports WHERE patient_id = ? ORDER BY created_at DESC`;
    return this.query(sql, [patientId]);
  }

  public findLatestByPatientId(patientId: string): AIConsultationReport | undefined {
    const sql = `SELECT * FROM ai_consultation_reports WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`;
    const rows = this.query(sql, [patientId]);
    return rows[0];
  }

  public findByTaskId(taskId: string): AIConsultationReport | undefined {
    const sql = `SELECT * FROM ai_consultation_reports WHERE external_task_id = ? LIMIT 1`;
    const rows = this.query(sql, [taskId]);
    return rows[0];
  }
}