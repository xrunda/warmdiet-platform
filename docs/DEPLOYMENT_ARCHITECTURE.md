# 部署架构

## 前后端分离部署

```
┌─────────────────────────────────────────────────┐
│              用户访问                          │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Vercel     │  │  阿里云 K8s   │
│  (前端)      │  │   (后端)      │
│              │  │              │
│  React + Vite│  │  Express API  │
│              │  │  + SQLite     │
│              │  │              │
│ .vercel.app  │  │  Ingress     │
│              │  │  (域名)       │
└──────────────┘  └──────────────┘
        │                 │
        │                 │
        └────────┬────────┘
                 │
                 ▼
        HTTPS (TLS)
```

## 域名配置方案

### 方案 1: 独立域名

- 前端：`https://warmdiet.example.com`
- 后端：`https://api.warmdiet.example.com`

### 方案 2: 子路径（推荐）

- 前端：`https://warmdiet.example.com`
- 后端：`https://warmdiet.example.com/api`

配置示例：

**前端环境变量**：
```env
VITE_API_URL=https://warmdiet.example.com/api
```

**后端 CORS 配置**：
```typescript
app.use(cors({
  origin: ['https://warmdiet.example.com'],
  credentials: true,
}));
```

---

## 部署步骤总览

### 前端（Vercel）

1. 连接 GitHub 仓库到 Vercel
2. 配置 `VITE_API_URL` 环境变量
3. 自动部署

### 后端（阿里云 K8s）

1. 构建 Docker 镜像
2. 推送到阿里云 ACR
3. 部署到 K8s
4. 配置 Ingress

---

## 环境变量对照表

| 变量 | 开发环境 | 生产环境（Vercel） |
|-----|---------|-------------------|
| `VITE_API_URL` | `http://localhost:3001/api` | `https://warmdiet.example.com/api` |
| `NODE_ENV` | `development` | `production` |
| `JWT_SECRET` | - | （后端 secret.yaml） |

---

## CI/CD 流程

```
GitHub Push
    │
    ├─► Vercel (自动)
    │     - 构建前端
    │     - 部署到 Vercel
    │
    └─► Docker Build + Push (手动/CI)
          - 构建后端镜像
          - 推送到 ACR
          - 更新 K8s Deployment
```

---

*最后更新：2026-03-06*