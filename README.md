# 三餐管家 (WarmDiet)

> 医疗健康管理系统 - 患者日常餐食记录与医生授权管理平台

<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📋 项目简介

"三餐管家"是一个面向老年用户的医疗健康管理应用，帮助患者记录日常餐食，并根据《个人信息保护法》要求，通过医生授权机制让主治医生安全查看患者数据用于随诊健康管理。

## 🎯 核心功能

### 患者端（C端 - 免费）
- 🍽️ **餐食记录管理** - 记录早/午/晚餐，自动生成健康报告
- 📊 **健康分析报告** - 营养评分、饮食趋势分析
- 🗣️ **饮食对话日志** - 语音记录饮食偏好和反馈
- 🔐 **医生授权管理** - 患者明确授权医生查看数据
- ⚙️ **个人设置** - 老人阅读模式、设备绑定、偏好配置

### 医院端（B端 - 付费订阅）
- 👨‍⚕️ **访问患者数据** - 通过患者授权查看餐食记录
- 📈 **随诊健康管理** - 基于数据提供个性化健康建议
- 📋 **数据统计报告** - 批量患者数据分析
- 🔒 **安全审计** - 完整的访问日志和权限管理
- 💬 **专属技术支持** - 7x24 小时技术支持服务

## 💼 商业模式

| 用户类型 | 费用模式 | 核心权益 |
|---------|---------|---------|
| **患者（C端）** | ✅ 完全免费 | 餐食记录、健康报告、授权管理 |
| **医院（B端）** | 💰 付费订阅 | 访问患者数据、数据分析、技术支持 |

### 医院订阅套餐

| 套餐类型 | 医生数量 | 价格 | 核心功能 |
|---------|---------|------|---------|
| **基础版** | 1-5 位 | ¥299/月 | 基础数据访问、月度报告、邮件支持 |
| **专业版** | 6-20 位 | ¥899/月 | 全部数据类型、实时预警、专属支持 |
| **企业版** | 20+ 位 | ¥1999/月起 | 定制化功能、API 接口、数据导出 |

[详细商业模式说明](./docs/BUSINESS_MODEL.md)

## 🛠️ 技术栈

**前端：**
- React 19
- Vite
- TypeScript
- Tailwind CSS

**后端：**
- Express
- SQLite（待实现）

## 📁 项目结构

```
warmdiet-project/
├── src/
│   ├── components/
│   │   ├── AuthorizationManagement.tsx    # 医生授权管理
│   │   ├── AuthorizationCard.tsx          # 授权卡片
│   │   ├── AddAuthorizationModal.tsx      # 添加授权弹窗
│   │   └── AuthorizationDetailModal.tsx   # 授权详情弹窗
│   ├── types.ts                           # 类型定义
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── api/                               # 后端 API
│   ├── models/                            # 数据库模型
│   └── middleware/                        # 中间件
├── docs/
│   ├── doctor-authorization-design.md     # 设计文档
│   ├── AUTHORIZATION_IMPLEMENTATION.md    # 实现说明
│   ├── settings-redesign.md               # 设置页重构
│   └── BUSINESS_MODEL.md                  # 商业模式
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env.local` 文件：

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=file:./data/warmdiet.db  # 后续添加
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

## 📚 文档

- [医生授权功能设计](./doctor-authorization-design.md)
- [授权功能实现说明](./AUTHORIZATION_IMPLEMENTATION.md)
- [设置页面重构](./settings-redesign.md)
- [商业模式说明](./docs/BUSINESS_MODEL.md)

## 🔒 隐私与安全

本项目严格遵循《个人信息保护法》：

- ✅ **患者自主控制授权** - 完全由患者决定授权给谁
- ✅ **明确告知授权范围** - 授权前清晰展示数据类型和时间范围
- ✅ **可随时撤销授权** - 患者可随时撤销，立即生效
- ✅ **完整访问审计日志** - 记录每次医生访问
- ✅ **数据脱敏处理** - 返回给医生的数据自动脱敏

## 📝 待实现功能

- [ ] SQLite 数据存储
- [ ] 权限验证 API
- [ ] 医生搜索 API
- [ ] 授权通知发送
- [ ] 访问日志记录
- [ ] 数据脱敏处理
- [ ] 医院账号管理系统
- [ ] 订阅计费系统
- [ ] 管理后台

## 🎯 开发路线图

### Phase 1: 基础功能（已完成）
- [x] 前端 UI 组件
- [x] 授权管理界面
- [x] 添加授权流程

### Phase 2: 后端实现（进行中）
- [ ] 数据库设计
- [ ] API 接口开发
- [ ] 权限验证逻辑

### Phase 3: 商业化功能（计划中）
- [ ] 医院账号管理
- [ ] 订阅计费系统
- [ ] 管理后台

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**WarmDiet Team** © 2024