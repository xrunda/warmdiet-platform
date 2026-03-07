/**
 * 模型导出
 */

import Database from 'better-sqlite3';
import { HospitalModel } from './Hospital';
import { DoctorModel } from './Doctor';
import { PatientModel } from './Patient';
import { AuthorizationModel } from './Authorization';
import { MealRecordModel } from './MealRecord';
import { HealthReportModel } from './HealthReport';
import { AccessLogModel } from './AccessLog';
import {
  PatientHealthConditionModel,
  PatientMedicationModel,
  PatientPreferenceModel,
  PatientMedicalOrderModel,
  PatientVitalMeasurementModel,
  DietAlertModel,
  ConversationLogModel,
} from './PatientProfile';

export function initModels(db: Database.Database) {
  return {
    hospital: new HospitalModel(db),
    doctor: new DoctorModel(db),
    patient: new PatientModel(db),
    authorization: new AuthorizationModel(db),
    mealRecord: new MealRecordModel(db),
    healthReport: new HealthReportModel(db),
    accessLog: new AccessLogModel(db),
    healthCondition: new PatientHealthConditionModel(db),
    medication: new PatientMedicationModel(db),
    preference: new PatientPreferenceModel(db),
    medicalOrder: new PatientMedicalOrderModel(db),
    vitalMeasurement: new PatientVitalMeasurementModel(db),
    dietAlert: new DietAlertModel(db),
    conversationLog: new ConversationLogModel(db),
  };
}

export type Models = ReturnType<typeof initModels>;

export {
  HospitalModel,
  DoctorModel,
  PatientModel,
  AuthorizationModel,
  MealRecordModel,
  HealthReportModel,
  AccessLogModel,
  PatientHealthConditionModel,
  PatientMedicationModel,
  PatientPreferenceModel,
  PatientMedicalOrderModel,
  PatientVitalMeasurementModel,
  DietAlertModel,
  ConversationLogModel,
};
