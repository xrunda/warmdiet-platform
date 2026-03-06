#!/usr/bin/env node

/**
 * 初始化数据库并插入测试数据
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/warmdiet.db');
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql');
const SEEDS_PATH = path.join(__dirname, '../database/seeds.sql');

console.log('📦 开始初始化数据库...');

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ 创建数据目录:', dbDir);
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

try {
  // 读取并执行 schema.sql
  console.log('📝 创建表结构...');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('✅ 表结构创建完成');

  // 读取并执行 seeds.sql
  console.log('🌱 插入测试数据...');
  const seeds = fs.readFileSync(SEEDS_PATH, 'utf-8');
  db.exec(seeds);
  console.log('✅ 测试数据插入完成');

  // 验证数据
  console.log('\n📊 数据统计:');

  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospital_accounts').get();
  console.log(`  医院数量: ${hospitalCount.count}`);

  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctor_accounts').get();
  console.log(`  医生数量: ${doctorCount.count}`);

  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patient_accounts').get();
  console.log(`  患者数量: ${patientCount.count}`);

  const authCount = db.prepare('SELECT COUNT(*) as count FROM doctor_authorizations').get();
  console.log(`  授权数量: ${authCount.count}`);

  const mealCount = db.prepare('SELECT COUNT(*) as count FROM meal_records').get();
  console.log(`  餐食记录: ${mealCount.count}`);

  const reportCount = db.prepare('SELECT COUNT(*) as count FROM health_reports').get();
  console.log(`  健康报告: ${reportCount.count}`);

  console.log('\n✅ 数据库初始化完成！');
  console.log(`📍 数据库路径: ${DB_PATH}`);

  // 输出测试账号信息
  console.log('\n🔐 测试账号信息:');
  console.log('\n  医院账号（医院管理后台）:');
  console.log('    统一社会信用代码: 91110000MD0010209');
  console.log('    密码: 任意密码（当前未实现密码验证）');
  console.log('    套餐: 基础版（1-5 医生）');
  console.log('    订阅状态: 活跃');

  console.log('\n  医生账号:');
  console.log('    姓名: 李医生');
  console.log('    执业证号: 110110198001011234');
  console.log('    科室: 消化内科');
  console.log('    状态: 活跃');

  console.log('\n  患者账号:');
  console.log('    姓名: 王大爷');
  console.log('    年龄: 65');
  console.log('    性别: 男');

  console.log('\n  授权记录:');
  console.log('    患者 → 医生: 已授权');
  console.log('    授权类型: 餐食记录、健康报告');
  console.log('    数据范围: 最近30天');

} catch (error) {
  console.error('❌ 初始化失败:', error);
  process.exit(1);
} finally {
  db.close();
}