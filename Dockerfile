FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS family-h5-builder

WORKDIR /app/family-h5

COPY family-h5/package*.json ./
RUN npm ci

COPY family-h5/. .
RUN npm run build

FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends make g++ ca-certificates tzdata \
  && ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo Asia/Shanghai > /etc/timezone \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm install tsx \
  && npm cache clean --force

COPY server ./server
COPY start.sh ./
COPY --from=frontend-builder /app/dist/client ./public
COPY --from=family-h5-builder /app/family-h5/dist ./public/family

RUN chmod +x start.sh \
  && mkdir -p /data \
  && chown -R node:node /data /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/data/warmdiet.db
ENV TZ=Asia/Shanghai

VOLUME ["/data"]
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["./start.sh"]
