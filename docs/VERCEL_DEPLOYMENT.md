# WarmDiet 前端部署到 Vercel

## 📋 概述

将 WarmDiet 前端（React + Vite）部署到 Vercel，后端部署到阿里云 K8s。

## 🚀 快速部署

### 方法 1: 通过 Vercel Dashboard（推荐）

#### 1. 连接 GitHub 仓库

1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 选择 GitHub 仓库：`xrunda/warmdiet-platform`

#### 2. 配置构建设置

| 设置 | 值 |
|-----|---|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

#### 3. 配置环境变量

在 "Environment Variables" 中添加：

| 变量名 | 值 | 说明 |
|-------|---|------|
| `VITE_API_URL` | `https://your-k8s-api.example.com/api` | 后端 API 地址 |

**注意**：API 地址应该是你的阿里云 K8s 集群的 Ingress 地址。

#### 4. 部署

点击 "Deploy" 按钮，等待部署完成。

部署完成后，Vercel 会提供一个类似 `https://warmdiet-frontend.vercel.app` 的 URL。

---

### 方法 2: 使用 Vercel CLI

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署项目

```bash
# 在项目根目录
cd /app/working/warmdiet-project

# 首次部署
vercel

# 生产环境部署
vercel --prod
```

#### 4. 配置环境变量

```bash
vercel env add VITE_API_URL
```

输入后端 API 地址。

---

## 🔧 环境变量配置

### 开发环境

创建 `.env.local` 文件：

```env
VITE_API_URL=http://localhost:3001/api
```

### 生产环境（Vercel）

在 Vercel Dashboard 中配置：

```env
VITE_API_URL=https://your-k8s-api.example.com/api
```

### 如何获取后端 API 地址

在阿里云 K8s 集群中：

```bash
# 查看 Ingress
kubectl get ingress -n warmdiet

# 输出示例：
# NAME                  CLASS   HOSTS                      ADDRESS
# warmdiet-ingress      nginx   warmdiet.example.com       47.100.100.100
```

将 `https://warmdiet.example.com` 作为 `VITE_API_URL`。

---

## 📋 域名配置

### 使用 Vercel 域名

部署完成后，默认会提供一个 `.vercel.app` 域名。

### 使用自定义域名

1. 在 Vercel Dashboard 中选择项目
2. 进入 "Settings" → "Domains"
3. 添加你的域名
4. 配置 DNS 记录（Vercel 会提供）

---

## 🔄 自动部署

### Git 推送自动部署

当推送代码到 GitHub 时，Vercel 会自动触发部署：

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

### 分支预览

每次推送到非 `main` 分支，Vercel 会创建一个预览部署，方便测试。

---

## ⚙️ 高级配置

### 1. 自定义域名路径

如果前端和后端共享域名，使用路径区分：

```env
VITE_API_URL=https://warmdiet.example.com/api
```

前端：`https://warmdiet.example.com`
后端 API：`https://warmdiet.example.com/api/...`

### 2. CORS 配置

后端需要允许前端域名的跨域请求。

修改 `server/src/app.ts`：

```typescript
app.use(cors({
  origin: [
    'https://warmdiet-frontend.vercel.app',
    'https://your-custom-domain.com',
  ],
  credentials: true,
}));
```

### 3. 优化构建

在 `vercel.json` 中配置缓存策略：

```json
{
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    }
  ]
}
```

---

## 📊 监控和日志

### Vercel Dashboard

1. 登录 [Vercel](https://vercel.com)
2. 选择项目
3. 查看 "Deployments" 标签页

### 实时日志

```bash
vercel logs
```

### Analytics

Vercel 提供免费的 Analytics 功能，可以查看：
- 访问量
- 性能指标
- 用户分布

---

## 🆘 故障排查

### 1. 构建失败

查看构建日志：

```bash
vercel logs --build
```

常见原因：
- 依赖安装失败 → 检查 `package.json`
- TypeScript 错误 → 运行 `npm run lint` 检查
- 环境变量缺失 → 检查 Vercel Dashboard 配置

### 2. 运行时错误

查看实时日志：

```bash
vercel logs --follow
```

常见原因：
- API 请求失败 → 检查 `VITE_API_URL` 是否正确
- CORS 错误 → 检查后端 CORS 配置
- 路由错误 → 检查 Vercel Routes 配置

### 3. 页面白屏

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页的请求状态

---

## 🚀 CI/CD 集成

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📚 参考文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vite 部署到 Vercel](https://vitejs.dev/guide/deployment/vercel)

---

## 🆘 技术支持

如有问题：
1. 查看 [Vercel Dashboard](https://vercel.com/dashboard)
2. 查看 [故障排查](#故障排查) 章节
3. 提交 Issue 到 GitHub 仓库

---

*最后更新：2026-03-06*