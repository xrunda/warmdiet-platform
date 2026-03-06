-- 三餐管家 - 数据库结构设计

-- 医院账号表
CREATE TABLE IF NOT EXISTS hospital_accounts (
  id TEXT PRIMARY KEY,
  hospital_name TEXT NOT NULL,
  hospital_id TEXT NOT NULL UNIQUE,  -- 统一社会信用代码
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'professional', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK(subscription_status IN ('active', 'suspended', 'expired')),
  max_doctors INTEGER NOT NULL,
  subscription_start TEXT NOT NULL,
  subscription_end TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK(billing_cycle IN ('monthly', 'yearly')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hospital_id ON hospital_accounts(hospital_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON hospital_accounts(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_end ON hospital_accounts(subscription_end);

-- 医生账号表
CREATE TABLE IF NOT EXISTS doctor_accounts (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active', 'suspended')),
  can_access_patient_data INTEGER NOT NULL DEFAULT 1,
  email TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (hospital_id) REFERENCES hospital_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_license ON doctor_accounts(license_number);
CREATE INDEX IF NOT EXISTS idx_doctor_hospital ON doctor_accounts(hospital_id);

-- 患者账号表
CREATE TABLE IF NOT EXISTS patient_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
  phone TEXT,
  email TEXT UNIQUE,
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_patient_email ON patient_accounts(email);

-- 授权记录表
CREATE TABLE IF NOT EXISTS doctor_authorizations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  authorization_type TEXT NOT NULL,  -- JSON array: ["meal_records", "health_reports"]
  authorized_at TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
  scope_data_start TEXT NOT NULL,
  scope_data_end TEXT,
  scope_data_range TEXT NOT NULL CHECK(scope_data_range IN ('recent_7d', 'recent_30d', 'recent_90d', 'all')),
  ip_address TEXT,
  device_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id),
  FOREIGN KEY (doctor_id) REFERENCES doctor_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_auth_patient ON doctor_authorizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_auth_doctor ON doctor_authorizations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_auth_status ON doctor_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_auth_expires ON doctor_authorizations(expires_at);

-- 授权日志表
CREATE TABLE IF NOT EXISTS authorization_logs (
  id TEXT PRIMARY KEY,
  authorization_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('granted', 'revoked', 'extended', 'viewed')),
  operator TEXT NOT NULL CHECK(operator IN ('patient', 'doctor', 'system')),
  operator_id TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  details TEXT,
  FOREIGN KEY (authorization_id) REFERENCES doctor_authorizations(id)
);

CREATE INDEX IF NOT EXISTS idx_logs_auth ON authorization_logs(authorization_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON authorization_logs(timestamp);

-- 餐食记录表
CREATE TABLE IF NOT EXISTS meal_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date TEXT NOT NULL,
  meal_time TEXT NOT NULL,
  foods TEXT NOT NULL,  -- JSON array
  nutrition_score REAL NOT NULL DEFAULT 0,
  calories REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_meal_patient ON meal_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_date ON meal_records(meal_date);

-- 健康报告表
CREATE TABLE IF NOT EXISTS health_reports (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  report_date TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  nutrition_score REAL NOT NULL DEFAULT 0,
  trends TEXT NOT NULL,  -- JSON array
  recommendations TEXT NOT NULL,  -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_report_patient ON health_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_report_date ON health_reports(report_date);

-- 访问记录表（用于计费和审计）
CREATE TABLE IF NOT EXISTS access_logs (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  hospital_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (doctor_id) REFERENCES doctor_accounts(id),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id),
  FOREIGN KEY (hospital_id) REFERENCES hospital_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_access_doctor ON access_logs(doctor_id);
CREATE INDEX IF NOT EXISTS idx_access_patient ON access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_hospital ON access_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_access_timestamp ON access_logs(accessed_at);

-- 患者健康状况表
CREATE TABLE IF NOT EXISTS patient_health_conditions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  condition_name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK(condition_type IN ('disease', 'surgery', 'allergy')),
  diagnosed_date TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_health_cond_patient ON patient_health_conditions(patient_id);

-- 患者用药记录表
CREATE TABLE IF NOT EXISTS patient_medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT NOT NULL,
  package_image TEXT,
  ocr_text TEXT,
  image_uploaded_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_medication_patient ON patient_medications(patient_id);

-- 患者饮食偏好表
CREATE TABLE IF NOT EXISTS patient_preferences (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE,
  taste_preferences TEXT NOT NULL DEFAULT '[]',
  liked_foods TEXT NOT NULL DEFAULT '[]',
  disliked_foods TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_pref_patient ON patient_preferences(patient_id);

-- 患者医嘱表
CREATE TABLE IF NOT EXISTS patient_medical_orders (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  order_date TEXT NOT NULL,
  hospital_name TEXT,
  visit_date TEXT,
  original_image TEXT,
  raw_ocr_text TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_order_patient ON patient_medical_orders(patient_id);

-- 饮食预警表
CREATE TABLE IF NOT EXISTS diet_alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  meal_id TEXT,
  level TEXT NOT NULL CHECK(level IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  alert_date TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id),
  FOREIGN KEY (meal_id) REFERENCES meal_records(id)
);

CREATE INDEX IF NOT EXISTS idx_alert_patient ON diet_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alert_date ON diet_alerts(alert_date);

-- 对话记录表
CREATE TABLE IF NOT EXISTS conversation_logs (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  log_date TEXT NOT NULL,
  extra TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patient_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_conv_patient ON conversation_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_conv_date ON conversation_logs(log_date);
