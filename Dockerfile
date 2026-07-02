FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && mkdir -p /app/server/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/server/data/warmdiet.db

EXPOSE 3001

CMD ["npm", "run", "start:container"]
