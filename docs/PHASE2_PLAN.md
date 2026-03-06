# Phase 2: 后端实现计划

## 📋 概述

实现 WarmDiet 平台的后端系统，包括数据库、API 接口、权限验证和访问日志。

**技术栈**：
- **数据库**: SQLite (better-sqlite3)
- **后端框架**: Express.js
- **身份验证**: JWT
- **数据验证**: Zod
- **API 文档**: Swagger/OpenAPI

---

## 🎯 阶段划分

### 阶段 1: 项目初始化 (当前阶段)
- [ ] 安装依赖
- [ ] 配置 Express 服务器
- [ ] 初始化 SQLite 数据库
- [ ] 创建基础中间件

### 阶段 2: 数据库层开发
- [ ] 数据库连接管理
- [ ] Model 层封装（CRUD 操作）
- [ ] 数据迁移系统
- [ ] 种子数据

### 阶段 3: API 接口开发
- [ ] 医院账号管理 API
- [ ] 医生账号管理 API
- [ ] 患者账号管理 API
- [ ] 授权管理 API
- [ ] 餐食记录 API
- [ ] 健康报告 API
- [ ] 访问日志 API

### 阶段 4: 权限验证系统
- [ ] JWT 认证中间件
- [ ] 医院订阅状态验证
- [ ] 医生授权验证
- [ ] 数据脱敏处理
- [ ] 访问频率限制

### 阶段 5: 测试和文档
- [ ] 单元测试
- [ ] API 集成测试
- [ ] Swagger 文档
- [ ] 部署文档

---

## 📦 依赖安装

```bash
npm install express cors helmet morgan better-sqlite3 jsonwebtoken bcryptjs zod dotenv
npm install -D @types/node @types/express @types/cors @types/better-sqlite3 @types/jsonwebtoken @types/bcryptjs typescript ts-node nodemon
```

---

## 🗄️ 数据库架构

### 表结构（已定义在 `server/database/schema.sql`）

1. **hospital_accounts** - 医院账号
2. **doctor_accounts** - 医生账号
3. **patient_accounts** - 患者账号
4. **doctor_authorizations** - 授权记录
5. **authorization_logs** - 授权日志
6. **meal_records** - 餐食记录
7. **health_reports** - 健康报告
8. **access_logs** - 访问日志

---

## 🔌 API 接口设计

### 1. 医院账号管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/hospitals/register | 医院注册 |
| POST | /api/hospitals/login | 医院登录 |
| GET | /api/hospitals/:id | 获取医院信息 |
| PUT | /api/hospitals/:id | 更新医院信息 |
| POST | /api/hospitals/subscribe | 订阅套餐 |
| GET | /api/hospitals/:id/subscription | 获取订阅状态 |

### 2. 医生账号管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/doctors | 添加医生 |
| GET | /api/doctors | 获取医生列表 |
| GET | /api/doctors/:id | 获取医生信息 |
| PUT | /api/doctors/:id | 更新医生信息 |
| DELETE | /api/doctors/:id | 删除医生 |
| POST | /api/doctors/login | 医生登录 |

### 3. 患者账号管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/patients | 创建患者 |
| GET | /api/patients/:id | 获取患者信息 |
| PUT | /api/patients/:id | 更新患者信息 |
| DELETE | /api/patients/:id | 删除患者 |

### 4. 授权管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/authorizations | 创建授权 |
| GET | /api/patients/:patientId/authorizations | 获取患者的授权列表 |
| GET | /api/doctors/:doctorId/authorizations | 获取医生的授权列表 |
| PUT | /api/authorizations/:id | 更新授权 |
| DELETE | /api/authorizations/:id | 撤销授权 |
| GET | /api/authorizations/:id | 获取授权详情 |

### 5. 餐食记录 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/patients/:patientId/meals | 添加餐食记录 |
| GET | /api/patients/:patientId/meals | 获取餐食记录列表 |
| GET | /api/patients/:patientId/meals/:id | 获取单条餐食记录 |
| PUT | /api/patients/:patientId/meals/:id | 更新餐食记录 |
| DELETE | /api/patients/:patientId/meals/:id | 删除餐食记录 |

### 6. 健康报告 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/patients/:patientId/reports | 生成健康报告 |
| GET | /api/patients/:patientId/reports | 获取健康报告列表 |
| GET | /api/patients/:patientId/reports/:id | 获取单份报告 |

### 7. 访问日志 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/hospitals/:hospitalId/access-logs | 获取医院访问日志 |
| GET | /api/doctors/:doctorId/access-logs | 获取医生访问日志 |
| GET | /api/patients/:patientId/access-logs | 获取患者访问日志 |

---

## 🔐 权限验证逻辑

### 1. 医院订阅状态验证

```typescript
// 验证医院订阅是否有效
function verifyHospitalSubscription(hospitalId: string): {
  valid: boolean;
  reason?: string;
  subscription?: any;
}
```

**验证项**：
- 订阅状态是否为 `active`
- 订阅是否过期
- 医生数量是否超出套餐限制

### 2. 医生授权验证

```typescript
// 验证医生是否有权限访问患者数据
function verifyDoctorAccess(
  doctorId: string,
  patientId: string,
  dataType: string
): {
  allowed: boolean;
  reason?: string;
  authorization?: any;
}
```

**验证项**：
- 医院订阅状态
- 医生账号状态
- 患者授权状态
- 授权是否过期
- 授权类型是否包含请求的数据类型

### 3. 数据脱敏处理

```typescript
// 脱敏患者数据
function sanitizePatientData(data: any, allowedTypes: string[]): any
```

**脱敏规则**：
- 敏感信息（身份证号、住址）始终脱敏
- 根据授权类型返回对应数据
- 医生无法访问非授权数据

---

## 📝 项目结构

```
server/
├── src/
│   ├── index.ts                    # 入口文件
│   ├── app.ts                      # Express 应用配置
│   ├── config/
│   │   ├── database.ts             # 数据库配置
│   │   └── env.ts                  # 环境变量配置
│   ├── models/
│   │   ├── Hospital.ts             # 医院模型
│   │   ├── Doctor.ts               # 医生模型
│   │   ├── Patient.ts              # 患者模型
│   │   ├── Authorization.ts        # 授权模型
│   │   ├── MealRecord.ts           # 餐食记录模型
│   │   ├── HealthReport.ts         # 健康报告模型
│   │   └── AccessLog.ts            # 访问日志模型
│   ├── routes/
│   │   ├── hospitals.ts            # 医院路由
│   │   ├── doctors.ts              # 医生路由
│   │   ├── patients.ts             # 患者路由
│   │   ├── authorizations.ts       # 授权路由
│   │   ├── meals.ts                # 餐食路由
│   │   ├── reports.ts              # 报告路由
│   │   └── accessLogs.ts           # 访问日志路由
│   ├── controllers/
│   │   ├── hospitalController.ts
│   │   ├── doctorController.ts
│   │   ├── patientController.ts
│   │   ├── authorizationController.ts
│   │   ├── mealController.ts
│   │   └── reportController.ts
│   ├── middleware/
│   │   ├── auth.ts                 # JWT 认证
│   │   ├── subscription.ts         # 订阅验证
│   │   ├── authorization.ts        # 授权验证
│   │   ├── sanitizer.ts            # 数据脱敏
│   │   ├── rateLimiter.ts          # 访问频率限制
│   │   ├── errorHandler.ts         # 错误处理
│   │   └── requestLogger.ts        # 请求日志
│   ├── services/
│   │   ├── authService.ts          # 认证服务
│   │   ├── subscriptionService.ts  # 订阅服务
│   │   ├── authorizationService.ts # 授权服务
│   │   └── notificationService.ts  # 通知服务
│   ├── utils/
│   │   ├── db.ts                   # 数据库工具
│   │   ├── logger.ts               # 日志工具
│   │   ├── validator.ts            # 数据验证
│   │   └── crypto.ts               # 加密工具
│   └── types/
│       └── index.ts                # 类型定义
├── database/
│   ├── schema.sql                  # 数据库结构
│   └── seeds/
│       └── data.sql                # 种子数据
└── tsconfig.json
```

---

## 🚀 执行步骤

### Step 1: 项目初始化
1. 安装依赖
2. 创建目录结构
3. 配置 TypeScript
4. 初始化数据库

### Step 2: 数据库层开发
1. 创建数据库连接
2. 实现 Model 层
3. 创建种子数据

### Step 3: API 接口开发（按优先级）
1. 医院账号管理 API
2. 医生账号管理 API
3. 患者账号管理 API
4. 授权管理 API
5. 餐食记录 API
6. 健康报告 API
7. 访问日志 API

### Step 4: 权限验证系统
1. JWT 认证
2. 订阅验证
3. 授权验证
4. 数据脱敏
5. 访问限流

### Step 5: 测试和文档
1. 编写单元测试
2. API 集成测试
3. Swagger 文档
4. 部署文档

---

## 📌 关键注意事项

1. **安全性**
   - 使用 HTTPS
   - 密码加密存储（bcrypt）
   - JWT token 过期时间设置
   - SQL 注入防护（参数化查询）
   - XSS 防护

2. **性能**
   - 数据库索引优化
   - 查询结果分页
   - 连接池管理
   - 缓存策略（后续可加 Redis）

3. **可维护性**
   - 代码分层清晰
   - 错误处理统一
   - 日志记录完善
   - 类型定义完整

4. **合规性**
   - 符合《个人信息保护法》
   - 数据脱敏处理
   - 访问日志审计
   - 用户数据可删除

---

## 📊 进度跟踪

| 阶段 | 状态 | 完成时间 |
|-----|------|---------|
| 阶段 1: 项目初始化 | 🔴 进行中 | - |
| 阶段 2: 数据库层开发 | ⚪ 未开始 | - |
| 阶段 3: API 接口开发 | ⚪ 未开始 | - |
| 阶段 4: 权限验证系统 | ⚪ 未开始 | - |
| 阶段 5: 测试和文档 | ⚪ 未开始 | - |

---

*最后更新：2026-03-06*