const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
};

let hospital: any = {
  id: 'hospital_test_001',
  hospitalName: '北京大学国际医院',
  hospitalId: '91110000MD0010209',
  contactPerson: '张三',
  contactPhone: '13800138000',
  contactEmail: 'test@hospital.com',
  planType: 'professional',
  subscriptionStatus: 'active',
  maxDoctors: 20,
  subscriptionStart: '2026-01-01T00:00:00.000Z',
  subscriptionEnd: '2027-12-31T23:59:59.999Z',
  billingCycle: 'yearly',
  createdAt: '2026-07-02T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
};

let doctors: any[] = [
  { id: 'doctor_test_001', hospitalId: hospital.id, name: '李医生', licenseNumber: '110110198001011234', department: '消化内科', accountStatus: 'active', email: 'doctor1@hospital.com', phone: '13900139000' },
  { id: 'doctor_test_002', hospitalId: hospital.id, name: '王医生', licenseNumber: '110110198501021234', department: '营养科', accountStatus: 'active', email: 'doctor2@hospital.com', phone: '13900139001' },
  { id: 'doctor_test_003', hospitalId: hospital.id, name: '赵医生', licenseNumber: '110110199001031234', department: '内分泌科', accountStatus: 'active', email: 'doctor3@hospital.com', phone: '13900139002' },
];

let patients: any[] = [
  { id: 'patient_test_001', patientId: 'patient_test_001', name: '李奶奶', age: 68, gender: 'female', phone: '13700137000', email: 'patient1@test.com', latestUpdate: '2026-03-06T19:30:00.000Z' },
  { id: 'patient_test_002', patientId: 'patient_test_002', name: '张大爷', age: 72, gender: 'male', phone: '13700137001', email: 'patient2@test.com', latestUpdate: '2026-03-06T12:00:00.000Z' },
  { id: 'patient_test_003', patientId: 'patient_test_003', name: '王阿姨', age: 65, gender: 'female', phone: '13700137002', email: 'patient3@test.com', latestUpdate: '2026-03-06T11:30:00.000Z' },
];

let authorizations: any[] = [
  { id: 'auth_test_001', patientId: 'patient_test_001', patientName: '李奶奶', doctorId: 'doctor_test_001', doctorName: '李医生', authorizationType: ['meal_records', 'health_reports'], status: 'active', scopeDataRange: 'recent_30d', authorizedAt: '2026-03-01T08:00:00.000Z', expiresAt: '2027-12-31T23:59:59.999Z' },
  { id: 'auth_test_002', patientId: 'patient_test_001', patientName: '李奶奶', doctorId: 'doctor_test_002', doctorName: '王医生', authorizationType: ['meal_records', 'health_reports'], status: 'active', scopeDataRange: 'all', authorizedAt: '2026-03-01T08:00:00.000Z', expiresAt: '2027-12-31T23:59:59.999Z' },
  { id: 'auth_test_003', patientId: 'patient_test_002', patientName: '张大爷', doctorId: 'doctor_test_001', doctorName: '李医生', authorizationType: ['meal_records'], status: 'active', scopeDataRange: 'recent_7d', authorizedAt: '2026-03-02T08:00:00.000Z', expiresAt: '2027-12-31T23:59:59.999Z' },
];

let meals: any[] = [
  { id: 'meal_001', patientId: 'patient_test_001', mealType: 'breakfast', mealDate: '2026-03-06', mealTime: '07:30', foods: [{ name: '小米粥', amount: 200, unit: 'ml', calories: 80 }, { name: '煮鸡蛋', amount: 1, unit: '个', calories: 70 }], nutritionScore: 90, calories: 300, notes: '清淡早餐，适合术后恢复' },
  { id: 'meal_002', patientId: 'patient_test_001', mealType: 'lunch', mealDate: '2026-03-06', mealTime: '12:00', foods: [{ name: '面条', amount: 200, unit: 'g', calories: 220 }, { name: '青菜', amount: 100, unit: 'g', calories: 25 }], nutritionScore: 85, calories: 245, notes: '午餐清淡' },
  { id: 'meal_003', patientId: 'patient_test_001', mealType: 'dinner', mealDate: '2026-03-06', mealTime: '18:30', foods: [{ name: '米饭', amount: 150, unit: 'g', calories: 200 }, { name: '红烧肉', amount: 100, unit: 'g', calories: 320 }], nutritionScore: 60, calories: 520, notes: '晚餐油脂偏高' },
  { id: 'meal_p2_001', patientId: 'patient_test_002', mealType: 'breakfast', mealDate: '2026-03-06', mealTime: '08:00', foods: [{ name: '牛奶', amount: 250, unit: 'ml', calories: 150 }], nutritionScore: 88, calories: 470, notes: '营养搭配合理' },
  { id: 'meal_p3_001', patientId: 'patient_test_003', mealType: 'breakfast', mealDate: '2026-03-06', mealTime: '07:30', foods: [{ name: '小米粥', amount: 200, unit: 'ml', calories: 80 }], nutritionScore: 85, calories: 170, notes: '清淡健康' },
];

let reports: any[] = [
  { id: 'report_001', patientId: 'patient_test_001', reportDate: '2026-03-06', startDate: '2026-02-28', endDate: '2026-03-06', nutritionScore: 78.5, summary: '整体饮食较规律，晚餐油脂偏高，建议继续保持低脂、高蛋白、少量多餐。', recommendations: ['减少油腻食物', '增加优质蛋白', '保持蔬菜摄入'] },
  { id: 'report_002', patientId: 'patient_test_002', reportDate: '2026-03-06', startDate: '2026-02-28', endDate: '2026-03-06', nutritionScore: 85, summary: '糖尿病饮食控制较稳定，建议持续监测餐后血糖。', recommendations: ['控制主食量', '餐后监测血糖'] },
];

let vitalMeasurements: any[] = [
  { id: 'vital_001', patientId: 'patient_test_001', measurementDate: '2026-03-06', measurementTime: '08:00', type: 'blood_pressure', systolicValue: 138, diastolicValue: 82, unit: 'mmHg' },
  { id: 'vital_002', patientId: 'patient_test_001', measurementDate: '2026-03-06', measurementTime: '08:10', type: 'blood_glucose', glucoseValue: 6.8, unit: 'mmol/L' },
  { id: 'vital_003', patientId: 'patient_test_002', measurementDate: '2026-03-06', measurementTime: '07:30', type: 'blood_glucose', glucoseValue: 8.2, unit: 'mmol/L' },
];

let healthConditions: any[] = [
  { id: 'cond_001', patientId: 'patient_test_001', conditionName: '高血压', name: '高血压', conditionType: 'disease', type: 'disease', diagnosedDate: '2025-10-01', notes: '长期监测血压', isActive: true, createdAt: '2026-03-01T08:00:00.000Z', updatedAt: '2026-03-01T08:00:00.000Z' },
  { id: 'cond_002', patientId: 'patient_test_001', conditionName: '高血脂', name: '高血脂', conditionType: 'disease', type: 'disease', diagnosedDate: '2025-11-15', notes: '控制油脂摄入', isActive: true, createdAt: '2026-03-01T08:05:00.000Z', updatedAt: '2026-03-01T08:05:00.000Z' },
  { id: 'cond_p2_001', patientId: 'patient_test_002', conditionName: '糖尿病', name: '糖尿病', conditionType: 'disease', type: 'disease', diagnosedDate: '2024-06-01', notes: '关注餐后血糖', isActive: true, createdAt: '2026-03-02T08:00:00.000Z', updatedAt: '2026-03-02T08:00:00.000Z' },
];

let medications: any[] = [
  { id: 'med_001', patientId: 'patient_test_001', name: '氨氯地平', dosage: '5mg', frequency: '每日1次', timing: '早餐后', status: 'active', createdAt: '2026-03-01T08:00:00.000Z', updatedAt: '2026-03-01T08:00:00.000Z' },
  { id: 'med_p2_001', patientId: 'patient_test_002', name: '二甲双胍', dosage: '0.5g', frequency: '每日2次', timing: '餐后', status: 'active', createdAt: '2026-03-02T08:00:00.000Z', updatedAt: '2026-03-02T08:00:00.000Z' },
];

let medicalOrders: any[] = [
  { id: 'order_001', patientId: 'patient_test_001', content: '术后恢复期建议低脂、少量多餐，避免辛辣刺激。', doctorName: '王医生', hospitalName: hospital.hospitalName, visitDate: '2026-03-06', orderDate: '2026-03-06', status: 'active', createdAt: '2026-03-06T09:00:00.000Z', updatedAt: '2026-03-06T09:00:00.000Z' },
];

let preferencesByPatient: Record<string, any> = {
  patient_test_001: { patientId: 'patient_test_001', tastePreferences: ['清淡', '少盐'], likedFoods: ['小米粥', '蒸蛋', '清蒸鱼'], favoriteFoods: ['小米粥', '蒸蛋', '清蒸鱼'], dislikedFoods: ['油炸食品', '辛辣食物'], avoidFoods: ['油炸食品', '辛辣食物'], updatedAt: '2026-03-06T09:00:00.000Z' },
  patient_test_002: { patientId: 'patient_test_002', tastePreferences: ['少糖'], likedFoods: ['杂粮饭'], favoriteFoods: ['杂粮饭'], dislikedFoods: ['甜点'], avoidFoods: ['甜点'], updatedAt: '2026-03-06T09:00:00.000Z' },
};

let aiConsultations: any[] = [
  { id: 'ai_report_001', patientId: 'patient_test_001', title: '饮食风险评估', status: 'completed', riskLevel: 'medium', summary: '饮食结构总体可控，需关注晚餐油脂和餐后血糖波动。', hospitalName: hospital.hospitalName, createdAt: '2026-03-06T20:00:00.000Z', updatedAt: '2026-03-06T20:00:00.000Z' },
];

function ok(data: unknown, message?: string, init: ResponseInit = {}) {
  return Response.json({ success: true, data, message }, { ...init, headers: jsonHeaders });
}

function fail(message: string, status = 400) {
  return Response.json({ success: false, error: message, message }, { status, headers: jsonHeaders });
}

async function readBody(request: Request) {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function patientById(id: string) {
  return patients.find((patient) => patient.id === id || patient.patientId === id) || patients[0];
}

function updatePatientTimestamp(patientId: string, isoTime: string) {
  const patient = patients.find((item) => item.id === patientId || item.patientId === patientId);
  if (patient) patient.latestUpdate = isoTime;
}

function stamp() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function authPayload(patient = patients[0]) {
  return {
    token: `demo-token-${patient.id}`,
    patientId: patient.id,
    name: patient.name,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
  };
}

function authorizationView(auth: any) {
  const doctor = doctors.find((item) => item.id === auth.doctorId) || {};
  const dataRange = auth.scope?.dataRange || auth.scopeDataRange || auth.dataRange || 'recent_30d';
  return {
    ...auth,
    doctorName: auth.doctorName || doctor.name || '测试医生',
    hospital: auth.hospital || hospital.hospitalName,
    department: auth.department || doctor.department || '营养科',
    licenseNumber: auth.licenseNumber || doctor.licenseNumber || 'demo-license',
    authorizationType: Array.isArray(auth.authorizationType) ? auth.authorizationType : ['meal_records'],
    authorizedAt: auth.authorizedAt || auth.createdAt || stamp(),
    scope: {
      startDate: auth.scope?.startDate || auth.scopeDataStart || auth.authorizedAt?.slice(0, 10) || stamp().slice(0, 10),
      endDate: auth.scope?.endDate || auth.scopeDataEnd,
      dataRange,
    },
    scopeDataRange: dataRange,
    accessCount: auth.accessCount || 0,
  };
}

async function handleApi(request: Request, url: URL) {
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders });

  if (path === '/health') {
    return Response.json({ status: 'ok', timestamp: new Date().toISOString(), environment: 'cloudflare-demo' }, { headers: jsonHeaders });
  }

  if (path === '/api/hospitals/login' && method === 'POST') {
    const body = await readBody(request);
    if (body.hospitalId && body.hospitalId !== hospital.hospitalId) return fail('医院账号不存在', 401);
    return ok({ hospital, token: 'demo-hospital-token' }, '登录成功');
  }

  if (path === '/api/hospitals/register' && method === 'POST') {
    const body = await readBody(request);
    hospital = { ...hospital, ...body, id: hospital.id, updatedAt: stamp() };
    return ok({ hospital, token: 'demo-hospital-token' }, '注册成功', { status: 201 });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const body = await readBody(request);
    const patient = patients.find((item) => item.phone === body.phone) || patients[0];
    return ok(authPayload(patient), '登录成功');
  }

  if (path === '/api/auth/register' && method === 'POST') {
    const body = await readBody(request);
    return ok(authPayload({ ...patients[0], ...body, id: 'patient_demo_new', patientId: 'patient_demo_new' } as any), '注册成功', { status: 201 });
  }

  if (path === '/api/auth/profile') return ok(patients[0]);
  if (path === '/api/demo/patient-token' && method === 'POST') return ok(authPayload(patients[0]), '获取测试患者 token 成功');

  if (path === '/api/doctors') {
    if (method === 'POST') {
      const body = await readBody(request);
      const doctor = { id: makeId('doctor_demo'), hospitalId: hospital.id, accountStatus: 'active', ...body, createdAt: stamp(), updatedAt: stamp() };
      doctors = [doctor, ...doctors];
      return ok(doctor, '医生已添加', { status: 201 });
    }
    return ok(doctors);
  }
  if (path.startsWith('/api/doctors/search')) return ok(doctors);

  const doctorMatch = path.match(/^\/api\/doctors\/([^/]+)(?:\/status)?$/);
  if (doctorMatch) {
    const doctor = doctors.find((item) => item.id === doctorMatch[1]);
    if (!doctor) return fail('医生不存在', 404);
    if (path.endsWith('/status') && method === 'PATCH') {
      const body = await readBody(request);
      Object.assign(doctor, { accountStatus: body.status || doctor.accountStatus, updatedAt: stamp() });
      return ok(doctor, '医生状态已更新');
    }
    if (method === 'PUT') {
      Object.assign(doctor, await readBody(request), { updatedAt: stamp() });
      return ok(doctor, '医生信息已更新');
    }
    if (method === 'DELETE') {
      doctors = doctors.filter((item) => item.id !== doctor.id);
      return ok({ id: doctor.id }, '医生已删除');
    }
    return ok(doctor);
  }

  const hospitalSubscriptionMatch = path.match(/^\/api\/hospitals\/([^/]+)\/subscription$/);
  if (hospitalSubscriptionMatch) {
    return ok({ ...hospital, currentDoctorCount: doctors.length, doctorRemaining: hospital.maxDoctors - doctors.length, isValid: true, totalPatients: patients.length, activeAuthorizations: authorizations.length, totalMeals: meals.length });
  }

  const hospitalStatsMatch = path.match(/^\/api\/hospitals\/([^/]+)\/stats$/);
  if (hospitalStatsMatch) {
    return ok({ totalDoctors: doctors.length, totalPatients: patients.length, activeAuthorizations: authorizations.length, totalMeals: meals.length, totalMealRecords: meals.length, totalAccessLogs: 24 });
  }

  const hospitalMatch = path.match(/^\/api\/hospitals\/([^/]+)$/);
  if (hospitalMatch) {
    if (method === 'PUT') {
      hospital = { ...hospital, ...await readBody(request), id: hospital.id, updatedAt: stamp() };
      return ok(hospital, '医院信息已更新');
    }
    return ok(hospital);
  }

  const doctorAuthMatch = path.match(/^\/api\/authorizations\/doctor\/([^/]+)$/);
  if (doctorAuthMatch) return ok(authorizations.filter((auth) => auth.doctorId === doctorAuthMatch[1]).map(authorizationView));

  const patientAuthMatch = path.match(/^\/api\/(?:authorizations\/patient\/([^/]+)|patients\/([^/]+)\/authorizations)(?:\/detailed)?$/);
  if (patientAuthMatch) {
    const patientId = patientAuthMatch[1] || patientAuthMatch[2];
    return ok(authorizations.filter((auth) => auth.patientId === patientId).map(authorizationView));
  }

  if (path === '/api/authorizations' && method === 'POST') {
    const body = await readBody(request);
    const patient = patientById(String(body.patientId || 'patient_test_001'));
    const doctor = doctors.find((item) => item.id === body.doctorId) || doctors[0];
    const now = stamp();
    const expiresInDays = Number(body.expiresInDays || 365);
    const authorization = {
      id: makeId('auth_demo'),
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      authorizationType: body.authorizationType || ['meal_records', 'health_reports'],
      status: 'active',
      scopeDataRange: body.scopeDataRange || body.dataRange || 'recent_30d',
      scopeDataStart: body.scopeDataStart || now.slice(0, 10),
      authorizedAt: now,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + expiresInDays * 86400000).toISOString(),
    };
    authorizations = [authorization, ...authorizations];
    return ok(authorizationView(authorization), '授权已创建', { status: 201 });
  }

  const authorizationActionMatch = path.match(/^\/api\/authorizations\/([^/]+)(?:\/extend)?$/);
  if (authorizationActionMatch) {
    const authorization = authorizations.find((item) => item.id === authorizationActionMatch[1]);
    if (!authorization) return fail('授权不存在', 404);
    if (path.endsWith('/extend') && method === 'POST') {
      const body = await readBody(request);
      const days = Number(body.days || 30);
      authorization.expiresAt = new Date(new Date(authorization.expiresAt || Date.now()).getTime() + days * 86400000).toISOString();
      authorization.updatedAt = stamp();
      return ok(authorizationView(authorization), '授权已延期');
    }
    if (method === 'DELETE') {
      authorization.status = 'revoked';
      authorization.updatedAt = stamp();
      return ok(authorizationView(authorization), '授权已撤销');
    }
  }

  const mealsMatch = path.match(/^\/api\/meals\/patient\/([^/]+)(?:\/stats)?$/);
  if (mealsMatch) {
    const patientId = mealsMatch[1];

    if (method === 'POST' && !path.endsWith('/stats')) {
      const body = await readBody(request);
      const now = new Date();
      const meal = {
        id: `meal_demo_${now.getTime()}`,
        patientId,
        mealType: body.mealType || 'lunch',
        mealDate: body.mealDate || now.toISOString().slice(0, 10),
        mealTime: body.mealTime || now.toTimeString().slice(0, 5),
        foods: Array.isArray(body.foods) ? body.foods : [],
        nutritionScore: Number(body.nutritionScore || 75),
        calories: Number(body.calories || 0),
        notes: typeof body.notes === 'string' ? body.notes : '家属端手动补录',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        sourceType: 'family_manual',
      };

      meals = [meal, ...meals];
      updatePatientTimestamp(patientId, now.toISOString());
      return ok(meal, '餐食记录已补录');
    }

    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const patientMeals = meals.filter((meal) => {
      if (meal.patientId !== mealsMatch[1]) return false;
      if (startDate && meal.mealDate < startDate) return false;
      if (endDate && meal.mealDate > endDate) return false;
      return true;
    });
    if (path.endsWith('/stats')) {
      return ok({ totalMeals: patientMeals.length, averageScore: 81, totalCalories: patientMeals.reduce((sum, meal) => sum + meal.calories, 0) });
    }
    return ok(patientMeals);
  }

  const mealItemMatch = path.match(/^\/api\/meals\/patient\/([^/]+)\/([^/]+)$/);
  if (mealItemMatch) {
    const [patientId, mealId] = [mealItemMatch[1], mealItemMatch[2]];
    const meal = meals.find((item) => item.patientId === patientId && item.id === mealId);
    if (!meal) return fail('餐食记录不存在', 404);
    if (method === 'DELETE') {
      meals = meals.filter((item) => !(item.patientId === patientId && item.id === mealId));
      updatePatientTimestamp(patientId, stamp());
      return ok({ id: mealId }, '餐食记录已删除');
    }
    if (method === 'PUT' || method === 'PATCH') {
      Object.assign(meal, await readBody(request), { updatedAt: stamp() });
      updatePatientTimestamp(patientId, meal.updatedAt);
      return ok(meal, '餐食记录已更新');
    }
    return ok(meal);
  }

  const reportsMatch = path.match(/^\/api\/reports\/patient\/([^/]+)(?:\/(latest|tomorrow-guide))?$/);
  if (reportsMatch) {
    const patientReports = reports.filter((report) => report.patientId === reportsMatch[1]);
    if (method === 'POST' && !reportsMatch[2]) {
      const body = await readBody(request);
      const now = stamp();
      const report = { id: makeId('report_demo'), patientId: reportsMatch[1], reportDate: now.slice(0, 10), nutritionScore: 82, summary: 'Demo 报告已生成，饮食整体稳定，建议继续控制油脂并保持优质蛋白摄入。', recommendations: ['减少油腻食物', '增加蔬菜摄入', '保持规律记录'], ...body, createdAt: now, updatedAt: now };
      reports = [report, ...reports];
      return ok(report, '健康报告已生成', { status: 201 });
    }
    if (reportsMatch[2] === 'latest') return ok(patientReports[0] || null);
    if (reportsMatch[2] === 'tomorrow-guide') return ok({ guide: '明日建议清淡饮食，早餐小米粥配鸡蛋，午餐清蒸鱼配蔬菜，晚餐豆腐蔬菜汤。' });
    return ok(patientReports);
  }

  const aiMatch = path.match(/^\/api\/ai-consultations\/patient\/([^/]+)(?:\/latest)?$/);
  if (aiMatch) {
    if (method === 'POST' && !path.endsWith('/latest')) {
      const body = await readBody(request);
      const now = stamp();
      const consultation = { id: makeId('ai_demo'), patientId: aiMatch[1], title: body.title || 'AI 健康咨询', status: 'completed', riskLevel: 'low', summary: 'Demo 咨询已生成，可用于验证报告流转。', hospitalName: hospital.hospitalName, createdAt: now, updatedAt: now };
      aiConsultations = [consultation, ...aiConsultations];
      return ok(consultation, 'AI 咨询已创建', { status: 201 });
    }
    const list = aiConsultations.filter((item) => item.patientId === aiMatch[1]);
    if (path.endsWith('/latest')) return ok(list[0] || null);
    return ok(list);
  }

  const aiItemMatch = path.match(/^\/api\/ai-consultations\/([^/]+)(?:\/retry-html)?$/);
  if (aiItemMatch) {
    const item = aiConsultations.find((consultation) => consultation.id === aiItemMatch[1]);
    if (!item) return fail('AI 咨询不存在', 404);
    if (path.endsWith('/retry-html') && method === 'POST') return ok({ ...item, htmlReady: true }, 'HTML 已重新生成');
    if (method === 'PUT') {
      Object.assign(item, await readBody(request), { updatedAt: stamp() });
      return ok(item, 'AI 咨询已更新');
    }
    if (method === 'DELETE') {
      aiConsultations = aiConsultations.filter((consultation) => consultation.id !== item.id);
      return ok({ id: item.id }, 'AI 咨询已删除');
    }
  }

  if (path === '/api/patients') {
    if (method === 'POST') {
      const body = await readBody(request);
      const now = stamp();
      const patient = { id: makeId('patient_demo'), patientId: '', name: '新患者', age: 60, gender: 'female', latestUpdate: now, ...body, createdAt: now, updatedAt: now };
      patient.patientId = patient.id;
      patients = [patient, ...patients];
      return ok(patient, '患者已创建', { status: 201 });
    }
    return ok(patients);
  }

  if (path.startsWith('/api/patients/search')) return ok(patients);

  const patientMatch = path.match(/^\/api\/patients\/([^/]+)(?:\/(.+))?$/);
  if (patientMatch) {
    const patient = patientById(patientMatch[1]);
    const subPath = patientMatch[2] || '';
    if (!subPath) {
      if (method === 'PUT' || method === 'PATCH') {
        Object.assign(patient, await readBody(request), { updatedAt: stamp(), latestUpdate: stamp() });
        return ok(patient, '患者信息已更新');
      }
      if (method === 'DELETE') {
        patients = patients.filter((item) => item.id !== patient.id);
        return ok({ id: patient.id }, '患者已删除');
      }
      return ok(patient);
    }
    if (subPath === 'dashboard') {
      const patientMeals = meals.filter((meal) => meal.patientId === patient.id);
      const latestMeals = patientMeals.slice(0, 6);
      return ok({
        patient,
        meals: latestMeals,
        latestMeals,
        latestReport: reports.find((report) => report.patientId === patient.id),
        latestVitals: vitalMeasurements.filter((item) => item.patientId === patient.id),
        healthScore: 82,
        alerts: [{ id: 'alert_001', level: 'medium', title: '饮食提醒', content: '晚餐油脂建议继续控制', suggestion: '明天优先选择清蒸、炖煮类菜品。' }],
        stats: { avgScore: 82, maxScore: 90, minScore: 60 },
        trendData: patientMeals.slice(0, 7).map((meal) => ({ date: meal.mealDate, score: meal.nutritionScore || 75 })),
        vitals: {
          latestBloodPressure: vitalMeasurements.find((item) => item.patientId === patient.id && item.type === 'blood_pressure'),
          latestBloodGlucose: vitalMeasurements.find((item) => item.patientId === patient.id && item.type === 'blood_glucose'),
        },
        conversations: [],
      });
    }
    if (subPath.startsWith('vital-measurements/latest')) return ok(vitalMeasurements.filter((item) => item.patientId === patient.id).slice(0, 2));
    if (subPath.startsWith('vital-measurements')) return ok(vitalMeasurements.filter((item) => item.patientId === patient.id));

    const healthConditionItemMatch = subPath.match(/^health-conditions\/([^/]+)$/);
    if (subPath === 'health-conditions') {
      if (method === 'POST') {
        const body = await readBody(request);
        const now = stamp();
        const conditionName = String(body.conditionName || body.name || '未命名健康状况');
        const conditionType = String(body.conditionType || body.type || 'other');
        const condition = { id: makeId('cond'), patientId: patient.id, ...body, conditionName, name: conditionName, conditionType, type: conditionType, isActive: true, createdAt: now, updatedAt: now };
        healthConditions = [condition, ...healthConditions];
        updatePatientTimestamp(patient.id, now);
        return ok(condition, '健康档案已保存', { status: 201 });
      }
      return ok(healthConditions.filter((item) => item.patientId === patient.id && item.isActive !== false));
    }
    if (healthConditionItemMatch) {
      const condition = healthConditions.find((item) => item.patientId === patient.id && item.id === healthConditionItemMatch[1]);
      if (!condition) return fail('健康档案不存在', 404);
      if (method === 'DELETE') {
        healthConditions = healthConditions.filter((item) => !(item.patientId === patient.id && item.id === condition.id));
        updatePatientTimestamp(patient.id, stamp());
        return ok({ id: condition.id }, '健康档案已删除');
      }
      if (method === 'PUT' || method === 'PATCH') {
        const body = await readBody(request);
        const conditionName = String(body.conditionName || body.name || condition.conditionName || condition.name);
        const conditionType = String(body.conditionType || body.type || condition.conditionType || condition.type);
        Object.assign(condition, body, { conditionName, name: conditionName, conditionType, type: conditionType, updatedAt: stamp() });
        updatePatientTimestamp(patient.id, condition.updatedAt);
        return ok(condition, '健康档案已更新');
      }
      return ok(condition);
    }

    const medicationItemMatch = subPath.match(/^medications\/([^/]+)$/);
    if (subPath === 'medications') {
      if (method === 'POST') {
        const body = await readBody(request);
        const now = stamp();
        const medication = { id: makeId('med'), patientId: patient.id, status: 'active', ...body, createdAt: now, updatedAt: now };
        medications = [medication, ...medications];
        updatePatientTimestamp(patient.id, now);
        return ok(medication, '用药已保存', { status: 201 });
      }
      return ok(medications.filter((item) => item.patientId === patient.id));
    }
    if (subPath === 'medications/recognize-image' && method === 'POST') {
      return ok({ name: '氨氯地平', dosage: '5mg', frequency: '每日1次', timing: '早餐后', ocrText: 'Demo OCR：氨氯地平片 5mg' }, '药品识别完成');
    }
    if (medicationItemMatch) {
      const medication = medications.find((item) => item.patientId === patient.id && item.id === medicationItemMatch[1]);
      if (!medication) return fail('用药记录不存在', 404);
      if (method === 'DELETE') {
        medications = medications.filter((item) => !(item.patientId === patient.id && item.id === medication.id));
        updatePatientTimestamp(patient.id, stamp());
        return ok({ id: medication.id }, '用药已删除');
      }
      if (method === 'PUT' || method === 'PATCH') {
        Object.assign(medication, await readBody(request), { updatedAt: stamp() });
        updatePatientTimestamp(patient.id, medication.updatedAt);
        return ok(medication, '用药已更新');
      }
      return ok(medication);
    }

    const medicalOrderScanMatch = subPath.match(/^medical-orders\/([^/]+)\/scan$/);
    const medicalOrderItemMatch = subPath.match(/^medical-orders\/([^/]+)$/);
    if (subPath === 'medical-orders') {
      if (method === 'POST') {
        const body = await readBody(request);
        const now = stamp();
        const order = { id: makeId('order'), patientId: patient.id, doctorName: '王医生', hospitalName: hospital.hospitalName, orderDate: now.slice(0, 10), status: 'active', ...body, createdAt: now, updatedAt: now };
        medicalOrders = [order, ...medicalOrders];
        updatePatientTimestamp(patient.id, now);
        return ok(order, '医嘱已保存', { status: 201 });
      }
      return ok(medicalOrders.filter((item) => item.patientId === patient.id));
    }
    if (subPath === 'medical-orders/scan' && method === 'POST') {
      return ok({ content: 'Demo OCR：低脂少盐饮食，少量多餐，按时复诊。', doctorName: '王医生', hospitalName: hospital.hospitalName, visitDate: stamp().slice(0, 10), rawOcrText: '低脂少盐饮食，少量多餐' }, '医嘱识别完成');
    }
    if (medicalOrderScanMatch && method === 'PUT') {
      const order = medicalOrders.find((item) => item.patientId === patient.id && item.id === medicalOrderScanMatch[1]);
      if (!order) return fail('医嘱不存在', 404);
      Object.assign(order, { rawOcrText: 'Demo OCR：医嘱已重新识别', updatedAt: stamp() });
      return ok(order, '医嘱识别已更新');
    }
    if (medicalOrderItemMatch) {
      const order = medicalOrders.find((item) => item.patientId === patient.id && item.id === medicalOrderItemMatch[1]);
      if (!order) return fail('医嘱不存在', 404);
      if (method === 'DELETE') {
        medicalOrders = medicalOrders.filter((item) => !(item.patientId === patient.id && item.id === order.id));
        updatePatientTimestamp(patient.id, stamp());
        return ok({ id: order.id }, '医嘱已删除');
      }
      if (method === 'PUT' || method === 'PATCH') {
        Object.assign(order, await readBody(request), { updatedAt: stamp() });
        updatePatientTimestamp(patient.id, order.updatedAt);
        return ok(order, '医嘱已更新');
      }
      return ok(order);
    }

    if (subPath === 'preferences') {
      if (method === 'PUT' || method === 'PATCH') {
        const body = await readBody(request);
        const likedFoods = Array.isArray(body.likedFoods) ? body.likedFoods : body.favoriteFoods || [];
        const dislikedFoods = Array.isArray(body.dislikedFoods) ? body.dislikedFoods : body.avoidFoods || [];
        preferencesByPatient[patient.id] = { patientId: patient.id, ...body, likedFoods, favoriteFoods: likedFoods, dislikedFoods, avoidFoods: dislikedFoods, updatedAt: stamp() };
        updatePatientTimestamp(patient.id, preferencesByPatient[patient.id].updatedAt);
        return ok(preferencesByPatient[patient.id], '饮食偏好已保存');
      }
      return ok(preferencesByPatient[patient.id] || { patientId: patient.id, tastePreferences: [], likedFoods: [], favoriteFoods: [], dislikedFoods: [], avoidFoods: [] });
    }
    if (subPath === 'diet-alerts') return ok([{ id: 'alert_001', level: 'high', title: '高脂肪摄入预警', message: '晚餐红烧肉油脂偏高。' }]);
    if (subPath === 'timeline') return ok([{ date: '2026-03-06', type: 'meal', title: '晚餐记录', content: '红烧肉和米饭，营养评分 60。' }]);
    if (subPath === 'conversation-logs' || subPath === 'conversation-logs/dates') return ok([]);
    if (subPath === 'glucose-follow-up') return ok({ message: '建议餐后 2 小时复测血糖，并记录主食摄入。' });
  }

  return fail(`路径 ${method} ${path} 不存在`, 404);
}

export default {
  fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
      return handleApi(request, url);
    }

    return new Response(null, { status: 404 });
  },
};
