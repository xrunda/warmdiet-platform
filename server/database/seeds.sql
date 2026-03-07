-- 测试数据种子文件

-- 插入测试医院
INSERT INTO hospital_accounts (
  id, hospital_name, hospital_id, contact_person, contact_phone, contact_email,
  plan_type, subscription_status, max_doctors, subscription_start, subscription_end,
  billing_cycle, created_at, updated_at
) VALUES (
  'hospital_test_001', '北京仁爱医院', '91110000MD0010209', '张三',
  '13800138000', 'test@hospital.com', 'professional', 'active', 20,
  '2026-01-01T00:00:00.000Z', '2027-12-31T23:59:59.999Z', 'yearly',
  datetime('now'), datetime('now')
);

-- 插入测试医生（3名）
INSERT INTO doctor_accounts (
  id, hospital_id, name, license_number, department, account_status,
  can_access_patient_data, email, phone, created_at, updated_at
) VALUES
  ('doctor_test_001', 'hospital_test_001', '李医生', '110110198001011234', '消化内科', 'active', 1, 'doctor1@hospital.com', '13900139000', datetime('now'), datetime('now')),
  ('doctor_test_002', 'hospital_test_001', '王医生', '110110198501021234', '营养科', 'active', 1, 'doctor2@hospital.com', '13900139001', datetime('now'), datetime('now')),
  ('doctor_test_003', 'hospital_test_001', '赵医生', '110110199001031234', '内分泌科', 'active', 1, 'doctor3@hospital.com', '13900139002', datetime('now'), datetime('now'));

-- 插入测试患者（3名）
INSERT INTO patient_accounts (
  id, name, age, gender, phone, email, created_at, updated_at
) VALUES
  ('patient_test_001', '李奶奶', 68, 'female', '13700137000', 'patient1@test.com', datetime('now'), datetime('now')),
  ('patient_test_002', '张大爷', 72, 'male', '13700137001', 'patient2@test.com', datetime('now'), datetime('now')),
  ('patient_test_003', '王阿姨', 65, 'female', '13700137002', 'patient3@test.com', datetime('now'), datetime('now'));

-- 插入测试授权
INSERT INTO doctor_authorizations (
  id, patient_id, doctor_id, authorization_type, authorized_at, expires_at,
  status, scope_data_start, scope_data_end, scope_data_range,
  ip_address, device_id, created_at, updated_at
) VALUES
  ('auth_test_001', 'patient_test_001', 'doctor_test_001', '["meal_records", "health_reports"]', datetime('now'), '2027-12-31T23:59:59.999Z', 'active', '2026-01-01', NULL, 'recent_30d', '127.0.0.1', 'test-device', datetime('now'), datetime('now')),
  ('auth_test_002', 'patient_test_001', 'doctor_test_002', '["meal_records", "health_reports"]', datetime('now'), '2027-12-31T23:59:59.999Z', 'active', '2026-01-01', NULL, 'all', '127.0.0.1', 'test-device', datetime('now'), datetime('now')),
  ('auth_test_003', 'patient_test_002', 'doctor_test_001', '["meal_records"]', datetime('now'), '2026-06-01T23:59:59.999Z', 'active', '2026-01-01', NULL, 'recent_7d', '127.0.0.1', 'test-device', datetime('now'), datetime('now')),
  ('auth_test_004', 'patient_test_003', 'doctor_test_003', '["health_reports"]', datetime('now', '-60 days'), '2026-01-01T00:00:00.000Z', 'expired', '2025-01-01', NULL, 'recent_30d', '127.0.0.1', 'test-device', datetime('now', '-60 days'), datetime('now', '-60 days'));

-- ========== 李奶奶 7天餐食记录 ==========

-- 今天 (2026-03-06)
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_001', 'patient_test_001', 'breakfast', '2026-03-06', '07:30',
   '[{"name":"小米粥","amount":200,"unit":"ml","calories":80,"protein":2.1,"carbs":16.5,"fat":0.6},{"name":"煮鸡蛋","amount":1,"unit":"个","calories":70,"protein":6.3,"carbs":0.6,"fat":5.3},{"name":"牛奶","amount":250,"unit":"ml","calories":150,"protein":8,"carbs":12,"fat":8}]',
   90, 300, '清淡早餐，适合术后恢复，补充了一杯牛奶', datetime('now'), datetime('now')),
  ('meal_002', 'patient_test_001', 'lunch', '2026-03-06', '12:00',
   '[{"name":"面条","amount":200,"unit":"g","calories":220,"protein":7,"carbs":42,"fat":1.5},{"name":"青菜","amount":100,"unit":"g","calories":25,"protein":1.5,"carbs":4,"fat":0.3}]',
   85, 245, '午餐清淡', datetime('now'), datetime('now')),
  ('meal_003', 'patient_test_001', 'dinner', '2026-03-06', '18:30',
   '[{"name":"米饭","amount":150,"unit":"g","calories":200,"protein":4,"carbs":45,"fat":0.5},{"name":"红烧肉","amount":100,"unit":"g","calories":320,"protein":15,"carbs":5,"fat":28}]',
   60, 520, '晚餐红烧肉偏油', datetime('now'), datetime('now'));

-- 昨天 (2026-03-05)
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_004', 'patient_test_001', 'breakfast', '2026-03-05', '07:45',
   '[{"name":"豆浆","amount":250,"unit":"ml","calories":60,"protein":3,"carbs":5,"fat":2},{"name":"馒头","amount":1,"unit":"个","calories":150,"protein":4.5,"carbs":32,"fat":1.2}]',
   80, 210, NULL, datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('meal_005', 'patient_test_001', 'lunch', '2026-03-05', '12:15',
   '[{"name":"米饭","amount":150,"unit":"g","calories":200,"protein":4,"carbs":45,"fat":0.5},{"name":"清蒸鱼","amount":120,"unit":"g","calories":110,"protein":22,"carbs":0,"fat":2.5},{"name":"炒菠菜","amount":100,"unit":"g","calories":35,"protein":2,"carbs":4,"fat":1}]',
   92, 345, '营养搭配优秀', datetime('now', '-1 day'), datetime('now', '-1 day')),
  ('meal_006', 'patient_test_001', 'dinner', '2026-03-05', '18:00',
   '[{"name":"杂粮粥","amount":200,"unit":"ml","calories":90,"protein":3,"carbs":18,"fat":0.8},{"name":"豆腐","amount":100,"unit":"g","calories":80,"protein":8,"carbs":4,"fat":4.5}]',
   88, 170, '清淡晚餐', datetime('now', '-1 day'), datetime('now', '-1 day'));

-- 前天 (2026-03-04)
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_007', 'patient_test_001', 'breakfast', '2026-03-04', '08:00',
   '[{"name":"牛奶","amount":250,"unit":"ml","calories":150,"protein":8,"carbs":12,"fat":8},{"name":"全麦面包","amount":2,"unit":"片","calories":140,"protein":5,"carbs":26,"fat":2}]',
   85, 290, NULL, datetime('now', '-2 days'), datetime('now', '-2 days')),
  ('meal_008', 'patient_test_001', 'lunch', '2026-03-04', '12:00',
   '[{"name":"面条","amount":200,"unit":"g","calories":220,"protein":7,"carbs":42,"fat":1.5},{"name":"鸡胸肉","amount":100,"unit":"g","calories":130,"protein":25,"carbs":0,"fat":3},{"name":"西兰花","amount":80,"unit":"g","calories":25,"protein":2,"carbs":4,"fat":0.3}]',
   90, 375, '高蛋白低脂午餐', datetime('now', '-2 days'), datetime('now', '-2 days')),
  ('meal_009', 'patient_test_001', 'dinner', '2026-03-04', '18:30',
   '[{"name":"小米粥","amount":200,"unit":"ml","calories":80,"protein":2,"carbs":16,"fat":0.6},{"name":"蒸蛋","amount":1,"unit":"碗","calories":80,"protein":6,"carbs":1,"fat":6}]',
   87, 160, NULL, datetime('now', '-2 days'), datetime('now', '-2 days'));

-- 2026-03-03
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_010', 'patient_test_001', 'breakfast', '2026-03-03', '07:30',
   '[{"name":"粥","amount":200,"unit":"ml","calories":80,"protein":2,"carbs":16,"fat":0.5},{"name":"蒸蛋","amount":1,"unit":"碗","calories":80,"protein":6,"carbs":1,"fat":6}]',
   88, 160, NULL, datetime('now', '-3 days'), datetime('now', '-3 days')),
  ('meal_011', 'patient_test_001', 'lunch', '2026-03-03', '12:00',
   '[{"name":"米饭","amount":150,"unit":"g","calories":200,"protein":4,"carbs":45,"fat":0.5},{"name":"豆腐","amount":150,"unit":"g","calories":120,"protein":12,"carbs":6,"fat":7},{"name":"青菜","amount":100,"unit":"g","calories":25,"protein":1.5,"carbs":4,"fat":0.3}]',
   82, 345, NULL, datetime('now', '-3 days'), datetime('now', '-3 days')),
  ('meal_012', 'patient_test_001', 'dinner', '2026-03-03', '18:00',
   '[{"name":"面条","amount":200,"unit":"g","calories":220,"protein":7,"carbs":42,"fat":1.5},{"name":"蔬菜汤","amount":200,"unit":"ml","calories":40,"protein":2,"carbs":6,"fat":1}]',
   78, 260, NULL, datetime('now', '-3 days'), datetime('now', '-3 days'));

-- 2026-03-02
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_013', 'patient_test_001', 'breakfast', '2026-03-02', '08:00',
   '[{"name":"豆浆","amount":250,"unit":"ml","calories":60,"protein":3,"carbs":5,"fat":2},{"name":"馒头","amount":1,"unit":"个","calories":150,"protein":4.5,"carbs":32,"fat":1.2}]',
   75, 210, NULL, datetime('now', '-4 days'), datetime('now', '-4 days')),
  ('meal_014', 'patient_test_001', 'lunch', '2026-03-02', '12:30',
   '[{"name":"米饭","amount":150,"unit":"g","calories":200,"protein":4,"carbs":45,"fat":0.5},{"name":"回锅肉","amount":100,"unit":"g","calories":280,"protein":12,"carbs":3,"fat":24}]',
   58, 480, '回锅肉偏油', datetime('now', '-4 days'), datetime('now', '-4 days')),
  ('meal_015', 'patient_test_001', 'dinner', '2026-03-02', '18:30',
   '[{"name":"粥","amount":200,"unit":"ml","calories":80,"protein":2,"carbs":16,"fat":0.5},{"name":"小菜","amount":80,"unit":"g","calories":30,"protein":1,"carbs":5,"fat":0.5}]',
   80, 110, '清淡晚餐', datetime('now', '-4 days'), datetime('now', '-4 days'));

-- 2026-03-01
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_016', 'patient_test_001', 'breakfast', '2026-03-01', '07:30',
   '[{"name":"小米粥","amount":200,"unit":"ml","calories":80,"protein":2,"carbs":16,"fat":0.5},{"name":"鸡蛋","amount":1,"unit":"个","calories":70,"protein":6,"carbs":0.6,"fat":5}]',
   85, 150, NULL, datetime('now', '-5 days'), datetime('now', '-5 days')),
  ('meal_017', 'patient_test_001', 'lunch', '2026-03-01', '12:00',
   '[{"name":"面条","amount":200,"unit":"g","calories":220,"protein":7,"carbs":42,"fat":1.5},{"name":"鱼片","amount":100,"unit":"g","calories":90,"protein":18,"carbs":0,"fat":2},{"name":"蔬菜","amount":100,"unit":"g","calories":30,"protein":2,"carbs":5,"fat":0.5}]',
   88, 340, NULL, datetime('now', '-5 days'), datetime('now', '-5 days')),
  ('meal_018', 'patient_test_001', 'dinner', '2026-03-01', '18:00',
   '[{"name":"杂粮粥","amount":200,"unit":"ml","calories":90,"protein":3,"carbs":18,"fat":0.8},{"name":"蔬菜","amount":100,"unit":"g","calories":30,"protein":2,"carbs":5,"fat":0.5}]',
   82, 120, NULL, datetime('now', '-5 days'), datetime('now', '-5 days'));

-- 2026-02-28
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_019', 'patient_test_001', 'breakfast', '2026-02-28', '07:45',
   '[{"name":"牛奶","amount":250,"unit":"ml","calories":150,"protein":8,"carbs":12,"fat":8},{"name":"蒸蛋","amount":1,"unit":"碗","calories":80,"protein":6,"carbs":1,"fat":6}]',
   82, 230, NULL, datetime('now', '-6 days'), datetime('now', '-6 days')),
  ('meal_020', 'patient_test_001', 'lunch', '2026-02-28', '12:00',
   '[{"name":"米饭","amount":150,"unit":"g","calories":200,"protein":4,"carbs":45,"fat":0.5},{"name":"清蒸鱼","amount":120,"unit":"g","calories":110,"protein":22,"carbs":0,"fat":2.5},{"name":"番茄蛋汤","amount":200,"unit":"ml","calories":60,"protein":4,"carbs":5,"fat":3}]',
   90, 370, '优秀的午餐搭配', datetime('now', '-6 days'), datetime('now', '-6 days')),
  ('meal_021', 'patient_test_001', 'dinner', '2026-02-28', '18:30',
   '[{"name":"面条","amount":200,"unit":"g","calories":220,"protein":7,"carbs":42,"fat":1.5},{"name":"蔬菜汤","amount":200,"unit":"ml","calories":40,"protein":2,"carbs":6,"fat":1}]',
   80, 260, NULL, datetime('now', '-6 days'), datetime('now', '-6 days'));

-- ========== 张大爷、王阿姨的部分餐食记录 ==========
INSERT INTO meal_records (id, patient_id, meal_type, meal_date, meal_time, foods, nutrition_score, calories, notes, created_at, updated_at) VALUES
  ('meal_p2_001', 'patient_test_002', 'breakfast', '2026-03-06', '08:00',
   '[{"name":"牛奶","amount":250,"unit":"ml","calories":150,"protein":8,"carbs":12,"fat":8},{"name":"全麦面包","amount":2,"unit":"片","calories":180,"protein":6,"carbs":30,"fat":3},{"name":"鸡蛋","amount":2,"unit":"个","calories":140,"protein":12,"carbs":1,"fat":10}]',
   88, 470, '营养搭配合理', datetime('now'), datetime('now')),
  ('meal_p2_002', 'patient_test_002', 'lunch', '2026-03-06', '12:00',
   '[{"name":"米饭","amount":200,"unit":"g","calories":260,"protein":5,"carbs":58,"fat":0.6},{"name":"清蒸鱼","amount":200,"unit":"g","calories":180,"protein":36,"carbs":0,"fat":4},{"name":"炒青菜","amount":200,"unit":"g","calories":60,"protein":3,"carbs":8,"fat":2}]',
   90, 500, '午餐控制得很好', datetime('now'), datetime('now')),
  ('meal_p3_001', 'patient_test_003', 'breakfast', '2026-03-06', '07:30',
   '[{"name":"小米粥","amount":200,"unit":"ml","calories":80,"protein":2,"carbs":16,"fat":0.5},{"name":"凉拌黄瓜","amount":100,"unit":"g","calories":20,"protein":0.5,"carbs":3,"fat":0.3},{"name":"煮鸡蛋","amount":1,"unit":"个","calories":70,"protein":6,"carbs":0.6,"fat":5}]',
   85, 170, '清淡健康', datetime('now'), datetime('now')),
  ('meal_p3_002', 'patient_test_003', 'lunch', '2026-03-06', '11:30',
   '[{"name":"面条","amount":200,"unit":"g","calories":220,"protein":7,"carbs":42,"fat":1.5},{"name":"红烧牛肉","amount":150,"unit":"g","calories":300,"protein":25,"carbs":5,"fat":20}]',
   70, 520, '午餐热量偏高', datetime('now'), datetime('now'));

-- ========== 健康报告 ==========
INSERT INTO health_reports (id, patient_id, report_date, start_date, end_date, nutrition_score, trends, recommendations, created_at) VALUES
  ('report_001', 'patient_test_001', '2026-03-06', '2026-02-28', '2026-03-06', 78.5,
   '[{"date":"2026-02-28","calories":860,"nutritionScore":84},{"date":"2026-03-01","calories":610,"nutritionScore":85},{"date":"2026-03-02","calories":800,"nutritionScore":71},{"date":"2026-03-03","calories":765,"nutritionScore":83},{"date":"2026-03-04","calories":825,"nutritionScore":87},{"date":"2026-03-05","calories":725,"nutritionScore":87},{"date":"2026-03-06","calories":1065,"nutritionScore":78}]',
   '["建议增加蔬菜摄入，每餐至少一份绿叶蔬菜","控制油脂摄入，减少红烧肉等高脂食物","保持规律三餐，早餐不宜过晚","增加优质蛋白摄入，如鱼肉、豆腐","每日饮水不少于1500ml"]',
   datetime('now')),
  ('report_002', 'patient_test_001', '2026-02-28', '2026-02-21', '2026-02-28', 72.0,
   '[{"date":"2026-02-21","calories":780,"nutritionScore":70},{"date":"2026-02-22","calories":820,"nutritionScore":68},{"date":"2026-02-23","calories":900,"nutritionScore":65},{"date":"2026-02-24","calories":750,"nutritionScore":75},{"date":"2026-02-25","calories":680,"nutritionScore":78},{"date":"2026-02-26","calories":720,"nutritionScore":72},{"date":"2026-02-27","calories":810,"nutritionScore":76}]',
   '["术后恢复期注意清淡饮食","蛋白质摄入偏低，需增加","减少油腻食物"]',
   datetime('now', '-7 days')),
  ('report_003', 'patient_test_002', '2026-03-06', '2026-02-28', '2026-03-06', 85.0,
   '[{"date":"2026-02-28","calories":1200,"nutritionScore":82},{"date":"2026-03-01","calories":1100,"nutritionScore":85},{"date":"2026-03-02","calories":1150,"nutritionScore":88},{"date":"2026-03-03","calories":1050,"nutritionScore":84},{"date":"2026-03-04","calories":1200,"nutritionScore":86},{"date":"2026-03-05","calories":1100,"nutritionScore":85},{"date":"2026-03-06","calories":970,"nutritionScore":87}]',
   '["饮食结构良好，继续保持","注意控制总热量，避免过多碳水","适当增加运动量"]',
   datetime('now')),
  ('report_004', 'patient_test_003', '2026-03-06', '2026-02-28', '2026-03-06', 75.0,
   '[{"date":"2026-02-28","calories":650,"nutritionScore":72},{"date":"2026-03-01","calories":700,"nutritionScore":74},{"date":"2026-03-02","calories":680,"nutritionScore":76},{"date":"2026-03-03","calories":720,"nutritionScore":73},{"date":"2026-03-04","calories":690,"nutritionScore":78},{"date":"2026-03-05","calories":710,"nutritionScore":75},{"date":"2026-03-06","calories":690,"nutritionScore":77}]',
   '["饮食偏清淡，蛋白质需要加强","建议每天摄入鸡蛋、鱼肉等优质蛋白","适当增加全谷物摄入"]',
   datetime('now'));

-- ========== 患者健康状况 ==========
INSERT INTO patient_health_conditions (id, patient_id, condition_name, condition_type, diagnosed_date, notes, is_active) VALUES
  ('cond_001', 'patient_test_001', '高血压', 'disease', '2020-06-15', '长期服药控制中', 1),
  ('cond_002', 'patient_test_001', '高血脂', 'disease', '2021-03-20', '需控制饮食', 1),
  ('cond_003', 'patient_test_001', '胆囊切除术', 'surgery', '2024-10-15', '术后恢复中，需低脂饮食', 1),
  ('cond_004', 'patient_test_002', '糖尿病', 'disease', '2018-09-10', 'II型，胰岛素治疗', 1),
  ('cond_005', 'patient_test_002', '高血压', 'disease', '2019-04-22', '服药控制', 1),
  ('cond_006', 'patient_test_003', '高血脂', 'disease', '2022-01-10', '饮食控制', 1);

-- ========== 患者用药记录 ==========
INSERT INTO patient_medications (id, patient_id, name, dosage, frequency, timing, is_active) VALUES
  ('med_001', 'patient_test_001', '氨氯地平（降压药）', '5mg', '每日1次', '早餐后', 1),
  ('med_002', 'patient_test_001', '阿托伐他汀（降脂药）', '20mg', '每日1次', '睡前', 1),
  ('med_003', 'patient_test_002', '二甲双胍', '500mg', '每日2次', '早晚餐后', 1),
  ('med_004', 'patient_test_002', '格列美脲', '2mg', '每日1次', '早餐前', 1),
  ('med_005', 'patient_test_002', '缬沙坦', '80mg', '每日1次', '早餐后', 1);

-- ========== 患者饮食偏好 ==========
INSERT INTO patient_preferences (id, patient_id, taste_preferences, liked_foods, disliked_foods) VALUES
  ('pref_001', 'patient_test_001', '["清淡","少盐","软烂"]', '["小米粥","鸡蛋羹","清蒸鱼","豆腐","面条"]', '["红烧肉","辣椒","油炸食品","冰饮"]'),
  ('pref_002', 'patient_test_002', '["少糖","少油","温热"]', '["杂粮粥","蒸蛋","鱼","豆腐","蔬菜汤"]', '["甜品","油炸食品","酒精","咖啡"]'),
  ('pref_003', 'patient_test_003', '["清淡","少盐"]', '["面条","蔬菜","水果","豆浆"]', '["红肉","辣椒","生冷食物"]');

-- ========== 患者医嘱 ==========
INSERT INTO patient_medical_orders (id, patient_id, content, doctor_name, order_date, is_active) VALUES
  ('order_001', 'patient_test_001', '术后三个月内严禁摄入高脂肪、辛辣刺激性食物。保持少食多餐，每餐七分饱。增加优质蛋白和绿叶蔬菜摄入，每日饮水不少于1500ml。', '王医生', '2024-10-20', 1),
  ('order_002', 'patient_test_002', '严格控制碳水化合物和糖分摄入。每餐主食不超过100g，增加蔬菜和蛋白质比例。定时监测血糖，餐后2小时血糖控制在10mmol/L以下。', '李医生', '2025-01-15', 1),
  ('order_003', 'patient_test_003', '控制总胆固醇摄入，减少动物脂肪。每周至少3次清蒸或煮的烹饪方式，多食用深海鱼和豆制品。', '赵医生', '2025-06-01', 1);

-- ========== 饮食预警 ==========
INSERT INTO diet_alerts (id, patient_id, meal_id, level, title, content, suggestion, alert_date, is_read) VALUES
  ('alert_001', 'patient_test_001', 'meal_003', 'high', '高脂肪摄入预警', '晚餐红烧肉油脂含量偏高，不利于术后恢复', '建议明日饮食清淡，增加蔬菜和优质蛋白摄入，减轻肝胆负担', '2026-03-06', 0),
  ('alert_002', 'patient_test_001', NULL, 'medium', '蔬菜摄入不足', '今日蔬菜摄入量低于推荐标准', '建议每餐至少一份绿叶蔬菜，可做成蔬菜汤方便摄入', '2026-03-06', 0),
  ('alert_003', 'patient_test_001', NULL, 'low', '蛋白质偏低', '今日蛋白质摄入偏低，仅达到推荐量的60%', '建议补充鸡蛋、鱼肉或豆腐等优质蛋白', '2026-03-06', 0),
  ('alert_004', 'patient_test_001', 'meal_014', 'high', '高脂肪摄入预警', '午餐回锅肉油脂含量偏高', '建议减少油腻食物摄入，以清蒸或水煮为主', '2026-03-02', 1),
  ('alert_005', 'patient_test_002', 'meal_p2_001', 'medium', '碳水化合物偏高', '早餐碳水化合物摄入超出糖尿病饮食建议', '建议减少面包用量，增加蛋白质和蔬菜', '2026-03-06', 0);

-- ========== 对话记录（李奶奶，今日） ==========
INSERT INTO conversation_logs (id, patient_id, role, content, timestamp, log_date, extra) VALUES
  ('conv_001', 'patient_test_001', 'user', '小爱，我早上喝了一碗小米粥，还吃了一个煮鸡蛋，又喝了一杯牛奶。', '08:15', '2026-03-06', NULL),
  ('conv_002', 'patient_test_001', 'assistant', '收到，奶奶。早餐：小米粥一碗、煮鸡蛋一个、牛奶一杯，已记录。这顿早餐搭配很清淡，蛋白质也更充足，非常棒！', '08:15', '2026-03-06', NULL),
  ('conv_003', 'patient_test_001', 'user', '中午吃了面条和炒青菜。', '12:30', '2026-03-06', NULL),
  ('conv_004', 'patient_test_001', 'assistant', '午餐：面条一碗、炒青菜，已记录。搭配合理，碳水和蔬菜都有了，不过蛋白质稍微少了一点哦。', '12:30', '2026-03-06', NULL),
  ('conv_005', 'patient_test_001', 'user', '晚上儿子送来了红烧肉，我吃了不少，真香啊。还有半碗米饭。', '19:00', '2026-03-06', NULL),
  ('conv_006', 'patient_test_001', 'assistant', '晚餐：红烧肉（较多）、米饭半碗，已记录。', '19:00', '2026-03-06',
   '{"type":"alert","title":"饮食提醒","text":"奶奶，红烧肉虽然好吃，但是油脂含量较高，加上您术后还在恢复期，建议明天要吃得清淡一些哦，多吃点绿叶蔬菜。"}'),
  ('conv_007', 'patient_test_001', 'user', '小爱，那我明天早上吃点什么好呢？', '19:30', '2026-03-06', NULL),
  ('conv_008', 'patient_test_001', 'assistant', '考虑到今天晚餐油脂较多，明天建议如下：', '19:30', '2026-03-06',
   '{"type":"recommendation","title":"推荐食谱","text":"调理清淡","items":["早餐：小米粥 + 蒸蛋 + 少量青菜","午餐：清蒸鱼 + 豆腐 + 面条","晚餐：杂粮粥 + 蔬菜汤"]}');

-- 昨日对话
INSERT INTO conversation_logs (id, patient_id, role, content, timestamp, log_date, extra) VALUES
  ('conv_009', 'patient_test_001', 'user', '小爱，今天早上喝了豆浆，吃了一个馒头。', '08:00', '2026-03-05', NULL),
  ('conv_010', 'patient_test_001', 'assistant', '收到啦，奶奶。早餐：豆浆一杯、馒头一个，已记录。豆浆补充蛋白质很好哦！', '08:00', '2026-03-05', NULL),
  ('conv_011', 'patient_test_001', 'user', '中午吃了清蒸鱼和米饭，还有炒菠菜。', '12:30', '2026-03-05', NULL),
  ('conv_012', 'patient_test_001', 'assistant', '午餐搭配非常好！清蒸鱼提供优质蛋白，菠菜补充铁和维生素，很适合您的恢复期饮食。', '12:30', '2026-03-05', NULL),
  ('conv_013', 'patient_test_001', 'user', '晚上煮了杂粮粥，配了点豆腐。', '18:30', '2026-03-05', NULL),
  ('conv_014', 'patient_test_001', 'assistant', '太棒了，今天三餐都很健康清淡！杂粮粥帮助消化，豆腐补充蛋白质。今日饮食评分预计能到87分以上，继续保持！', '18:30', '2026-03-05', NULL),
  ('conv_015', 'patient_test_001', 'user', '小爱，我刚量了血压128比76，空腹血糖6.2。', '07:20', '2026-03-06', NULL),
  ('conv_016', 'patient_test_001', 'assistant', '收到，已帮您记下今天早上的血压和血糖。', '07:20', '2026-03-06',
   '{"type":"metric","title":"健康指标已记录","text":"血压 128/76 mmHg，空腹血糖 6.2 mmol/L，已作为附属指标保存。"}'),
  ('conv_017', 'patient_test_001', 'user', '小爱，晚饭后我测了血糖，7.8。', '20:15', '2026-03-04', NULL),
  ('conv_018', 'patient_test_001', 'assistant', '晚饭后血糖 7.8 已记录，继续保持清淡饮食。', '20:15', '2026-03-04',
   '{"type":"metric","title":"健康指标已记录","text":"餐后血糖 7.8 mmol/L，已同步到附属健康指标。"}');

-- ========== 血压血糖附属指标 ==========
INSERT INTO patient_vital_measurements (
  id, patient_id, metric_type, systolic_value, diastolic_value, glucose_value, glucose_context, unit,
  measured_at, measurement_date, source_type, source_log_id, source_text, notes
) VALUES
  ('vital_001', 'patient_test_001', 'blood_pressure', 128, 76, NULL, 'unknown', 'mmHg', '2026-03-06T07:20:00', '2026-03-06', 'xiaoai_voice', 'conv_015', '小爱，我刚量了血压128比76，空腹血糖6.2。', '来自小爱语音'),
  ('vital_002', 'patient_test_001', 'blood_glucose', NULL, NULL, 6.2, 'fasting', 'mmol/L', '2026-03-06T07:20:00', '2026-03-06', 'xiaoai_voice', 'conv_015', '小爱，我刚量了血压128比76，空腹血糖6.2。', '来自小爱语音'),
  ('vital_003', 'patient_test_001', 'blood_glucose', NULL, NULL, 7.8, 'post_meal', 'mmol/L', '2026-03-04T20:15:00', '2026-03-04', 'xiaoai_voice', 'conv_017', '小爱，晚饭后我测了血糖，7.8。', '来自小爱语音');

-- ========== 访问日志 ==========
INSERT INTO access_logs (id, doctor_id, patient_id, hospital_id, data_type, accessed_at) VALUES
  ('log_001', 'doctor_test_001', 'patient_test_001', 'hospital_test_001', 'meal_records', datetime('now', '-2 hours')),
  ('log_002', 'doctor_test_001', 'patient_test_001', 'hospital_test_001', 'health_reports', datetime('now', '-1 hour')),
  ('log_003', 'doctor_test_002', 'patient_test_001', 'hospital_test_001', 'meal_records', datetime('now', '-3 hours')),
  ('log_004', 'doctor_test_001', 'patient_test_002', 'hospital_test_001', 'meal_records', datetime('now', '-5 hours'));
