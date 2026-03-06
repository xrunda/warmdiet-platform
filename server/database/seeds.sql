-- 测试数据种子文件

-- 插入测试医院
INSERT INTO hospital_accounts (
  id,
  hospital_name,
  hospital_id,
  contact_person,
  contact_phone,
  contact_email,
  plan_type,
  subscription_status,
  max_doctors,
  subscription_start,
  subscription_end,
  billing_cycle,
  created_at,
  updated_at
) VALUES (
  'hospital_test_001',
  '测试医院',
  '91110000MD0010209',
  '张三',
  '13800138000',
  'test@hospital.com',
  'basic',
  'active',
  5,
  '2026-01-01T00:00:00.000Z',
  '2027-12-31T23:59:59.999Z',
  'yearly',
  datetime('now'),
  datetime('now')
);

-- 插入测试医生
INSERT INTO doctor_accounts (
  id,
  hospital_id,
  name,
  license_number,
  department,
  account_status,
  can_access_patient_data,
  email,
  phone,
  created_at,
  updated_at
) VALUES (
  'doctor_test_001',
  'hospital_test_001',
  '李医生',
  '110110198001011234',
  '消化内科',
  'active',
  1,
  'doctor@hospital.com',
  '13900139000',
  datetime('now'),
  datetime('now')
);

-- 插入测试患者
INSERT INTO patient_accounts (
  id,
  name,
  age,
  gender,
  phone,
  email,
  created_at,
  updated_at
) VALUES (
  'patient_test_001',
  '王大爷',
  65,
  'male',
  '13700137000',
  'patient@test.com',
  datetime('now'),
  datetime('now')
);

-- 插入测试授权
INSERT INTO doctor_authorizations (
  id,
  patient_id,
  doctor_id,
  authorization_type,
  authorized_at,
  expires_at,
  status,
  scope_data_start,
  scope_data_end,
  scope_data_range,
  ip_address,
  device_id,
  created_at,
  updated_at
) VALUES (
  'auth_test_001',
  'patient_test_001',
  'doctor_test_001',
  '["meal_records", "health_reports"]',
  datetime('now'),
  '2027-12-31T23:59:59.999Z',
  'active',
  '2026-01-01',
  NULL,
  'recent_30d',
  '127.0.0.1',
  'test-device',
  datetime('now'),
  datetime('now')
);

-- 插入测试餐食记录
INSERT INTO meal_records (
  id,
  patient_id,
  meal_type,
  meal_date,
  meal_time,
  foods,
  nutrition_score,
  calories,
  notes,
  created_at,
  updated_at
) VALUES (
  'meal_test_001',
  'patient_test_001',
  'breakfast',
  '2026-03-06',
  '07:30',
  '[{"name":"小米粥","amount":200,"unit":"ml","calories":80,"protein":2.1,"carbs":16.5,"fat":0.6},{"name":"煮鸡蛋","amount":1,"unit":"个","calories":70,"protein":6.3,"carbs":0.6,"fat":5.3},{"name":"馒头","amount":1,"unit":"个","calories":150,"protein":4.5,"carbs":32,"fat":1.2}]',
  75,
  300,
  '清淡早餐',
  datetime('now'),
  datetime('now')
);

INSERT INTO meal_records (
  id,
  patient_id,
  meal_type,
  meal_date,
  meal_time,
  foods,
  nutrition_score,
  calories,
  notes,
  created_at,
  updated_at
) VALUES (
  'meal_test_002',
  'patient_test_001',
  'lunch',
  '2026-03-06',
  '12:00',
  '[{"name":"红烧肉","amount":100,"unit":"g","calories":320,"protein":15,"carbs":5,"fat":28},{"name":"米饭","amount":150,"unit":"g","calories":200,"protein":4,"carbs":45,"fat":0.5},{"name":"青菜","amount":100,"unit":"g","calories":30,"protein":2,"carbs":5,"fat":0.5}]',
  60,
  550,
  '午餐丰盛',
  datetime('now'),
  datetime('now')
);

-- 插入测试健康报告
INSERT INTO health_reports (
  id,
  patient_id,
  report_date,
  start_date,
  end_date,
  nutrition_score,
  trends,
  recommendations,
  created_at
) VALUES (
  'report_test_001',
  'patient_test_001',
  '2026-03-06',
  '2026-02-06',
  '2026-03-06',
  67.5,
  '[{"date":"2026-03-01","calories":520,"nutritionScore":70},{"date":"2026-03-02","calories":580,"nutritionScore":65},{"date":"2026-03-06","calories":850,"nutritionScore":67.5}]',
  '["建议增加蔬菜摄入","控制油盐摄入","保持规律饮食"]',
  datetime('now')
);