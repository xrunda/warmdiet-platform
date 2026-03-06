# 三餐管家 (WarmDiet)

> 医疗健康管理系统 - 患者日常餐食记录与医生授权管理平台

<div style="text-align: center; width: 100%;">
  <!-- 核心：设置 max-width:100% 自适应容器，height:auto 保持等比 -->
  <img 
    width="2752" 
    height="1536" 
    alt="GHBanner" 
    src="unnamed.png" 
    style="max-width: 100%; height: auto; display: inline-block;"
  />
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

创建 `.env.local` 文件（参考 `.env.local.example`）：

```env
VITE_API_URL=http://localhost:3001/api
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

---

## 🌐 部署

### 前端部署到 Vercel

详细文档请查看：[docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)

#### 快速部署（3 步）

1. **连接 GitHub 仓库**
   - 登录 [Vercel](https://vercel.com)
   - 导入 `xrunda/warmdiet-platform` 仓库

2. **配置环境变量**
   - `VITE_API_URL`: 你的后端 API 地址

3. **点击 Deploy**

部署完成后，Vercel 会提供一个 URL（如 `https://warmdiet-frontend.vercel.app`）。

#### 自动部署

推送代码到 GitHub，Vercel 会自动触发部署：

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

---

## 🚢 后端部署到阿里云 K8s

### 前置要求

- 阿里云容器服务 ACK（Kubernetes）
- 阿里云容器镜像服务 ACR
- 域名（可选）

### 快速部署

#### 1. 构建并推送 Docker 镜像

```bash
# 登录阿里云容器镜像服务
docker login --username=your_username registry.cn-hangzhou.aliyuncs.com

# 构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:latest .

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:latest
```

#### 2. 配置 K8s 资源

修改 `k8s/secret.yaml` 中的密钥：

```yaml
stringData:
  JWT_SECRET: "your-random-jwt-secret"  # 必须修改
  GEMINI_API_KEY: "your-gemini-api-key" # 可选
```

#### 3. 部署到 K8s

```bash
# 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 创建配置和密钥
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 部署应用
kubectl apply -f k8s/deployment.yaml

# 配置存储
kubectl apply -f k8s/pvc.yaml

# 配置 Ingress（域名访问）
kubectl apply -f k8s/ingress.yaml

# 配置自动扩缩容
kubectl apply -f k8s/hpa.yaml
```

#### 4. 验证部署

```bash
# 查看部署状态
kubectl get deployment -n warmdiet

# 查看 Pod 状态
kubectl get pods -n warmdiet

# 查看服务
kubectl get svc -n warmdiet

# 查看日志
kubectl logs -f -n warmdiet -l app=warmdiet
```

#### 5. 更新应用

```bash
# 重新构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:v2 .
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:v2

# 更新 Deployment 中的镜像版本
kubectl set image deployment/warmdiet warmdiet=registry.cn-hangzhou.aliyuncs.com/your-namespace/warmdiet:v2 -n warmdiet

# 或者更新 deployment.yaml 后重新 apply
kubectl apply -f k8s/deployment.yaml
```

### K8s 资源说明

| 文件 | 说明 |
|-----|------|
| `namespace.yaml` | 创建命名空间 |
| `configmap.yaml` | 环境配置 |
| `secret.yaml` | 敏感信息（密钥） |
| `deployment.yaml` | Deployment + Service |
| `pvc.yaml` | 持久化存储 |
| `ingress.yaml` | 域名访问配置 |
| `hpa.yaml` | 自动扩缩容配置 |

### 监控和日志

```bash
# 查看 Pod 日志
kubectl logs -f -n warmdiet -l app=warmdiet

# 进入 Pod
kubectl exec -it -n warmdiet <pod-name> -- sh

# 查看资源使用
kubectl top pods -n warmdiet
kubectl top nodes

# 查看事件
kubectl get events -n warmdiet --sort-by='.lastTimestamp'
```

### 故障排查

```bash
# Pod 状态异常
kubectl describe pod <pod-name> -n warmdiet

# 服务无法访问
kubectl describe svc warmdiet-service -n warmdiet
kubectl get endpoints warmdiet-service -n warmdiet

# Ingress 问题
kubectl describe ingress warmdiet-ingress -n warmdiet

# 查看所有资源
kubectl get all -n warmdiet
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

**WarmDiet Team** © 2026
