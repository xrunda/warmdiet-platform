# 阶段 1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 阶段 2: 构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server ./server
COPY tsconfig.json ./

# 编译 TypeScript
RUN npx tsc --project tsconfig.json

# 阶段 3: 生产镜像（包含前后端）
FROM node:18-alpine AS production

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# 复制编译后的后端代码
COPY --from=backend-builder /app/dist ./server/dist
COPY --from=backend-builder /app/server ./server

# 复制构建后的前端
COPY --from=frontend-builder /app/dist ./public

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 启动应用
CMD ["node", "server/dist/index.js"]