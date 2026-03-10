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
VITE_API_URL=http://localhost:4000/api
```

### 一键启动（推荐）

项目提供了一个脚本，可以一次性启动 **后端 + 医院端前端 + 家属端 H5 + MCP 桥接**：

```bash
npm run dev:all
```

该命令会自动：

- 释放端口 `4000 / 4001 / 4100`（`npm run kill-ports`）
- 并行启动：
  - 后端 API：`http://localhost:4000`
  - 医院端前端：`http://localhost:4001`
  - 家属端 H5：`http://localhost:4100`
  - MCP 桥接：`mcp-xiaozhi/mcp_pipe.py server.py`

#### `dev:all` 启动规则（新增）

`npm run dev:all` 内部实际执行：

- `npm run kill-ports`
- 并行运行 `dev` + `dev:server` + `dev:family` + `dev:mcp`

其中 `dev:mcp` 规则：

- 启动目录：`mcp-xiaozhi/`
- 若环境变量和 `.env` 中都没有 `MCP_ENDPOINT`，会直接报错退出（避免“看似启动成功但未桥接”）
- 优先使用 `mcp-xiaozhi/.venv/bin/python`，否则回退到系统 `python`

> 建议在 `mcp-xiaozhi/.env` 中配置：
>
> ```env
> MCP_ENDPOINT=wss://api.xiaozhi.me/mcp/?token=...
> WARMDIET_API_BASE_URL=http://localhost:4000/api
> WARMDIET_PATIENT_TOKEN=...
> WARMDIET_PATIENT_ID=patient_test_001
> VOICE_SOURCE_TYPE=xiaoai_voice
> ```

### MCP 链路日志排障（语音说了但没落库）

当你在小智里说“记一条餐食”，但医生端看不到记录，请按日志顺序定位：

1. **桥接层（mcp_pipe.py）**
   - 关键日志：
     - `[WS->STDIO] method=...`（小智请求已到本地）
     - `[STDIO->WS] response id=... error=False`（本地结果已回传）
   - 若没有 `WS->STDIO`：说明小智没有真正发起工具调用。

2. **工具层（mcp-xiaozhi/server.py）**
   - 关键日志：
     - `[TOOL-IN] record_meal ...`
     - `[TOOL-OK] record_meal ...`
   - 若只有 `TOOL-IN` 没有 `TOOL-OK`，看 `TOOL-ERR` 内容。

3. **后端 API 层（mcp-xiaozhi/client.py）**
   - 关键日志：
     - `[API-REQ] POST /meals/patient/...`
     - `[API-OK] POST /meals/patient/... status=200`
   - 若出现 `[API-ERR]`，按错误信息修复 token/参数/鉴权。

4. **数据库核验（最终）**
   - 可用 sqlite3 直接查 `meal_records` 最新记录，确认是否真正落库。

> 常见根因：
> - 小智“口头回复已记录”，但实际上没触发工具
> - `WARMDIET_PATIENT_ID` 与医生端当前查看患者不一致
> - `WARMDIET_PATIENT_TOKEN` 无权限或过期
> - MCP 传了 `null` 给后端严格字段（例如 `notes`），触发 Zod 校验失败

#### 已修复：`notes` 为 null 导致餐食写入 500

如果日志里出现类似：

```
ZodError: notes expected string, received null
POST /api/meals/patient/:id 500
```

说明是历史参数格式问题。当前版本的 `mcp-xiaozhi/server.py` 已修复：
- 对 `notes/timestamp/logDate/sourceText` 这类可选字段，若为空会直接**不传该字段**，避免传 `null`。

如果你本地还看到这个错误，重启 `dev:all`（确保加载最新代码）即可。

### 分别启动（按需）

- 仅启动医院端前端：

  ```bash
  npm run dev         # 端口 4001
  ```

- 仅启动后端服务：

  ```bash
  npm run dev:server  # 端口 4000
  ```

- 仅启动家属端 H5：

  ```bash
  npm run dev:family  # 端口 4100
  ```

### 构建生产版本

```bash
npm run build
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
