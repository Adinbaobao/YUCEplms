# ============================================
# 多阶段构建：builder + runtime
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 复制依赖清单（利用 Docker 层缓存）
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# 2. 安装依赖
RUN npm install --legacy-peer-deps

# 3. 复制全部源码
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

# 4. 构建 shared 包（产出 dist/）
RUN npm run build:shared

# 5. 生成 Prisma Client + 编译后端
#    prisma generate 在 build 脚本中执行
RUN cd apps/backend && npm run build

# ============================================
# Runtime 阶段：只保留运行时必需文件
# ============================================
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini curl openssl

WORKDIR /app

ENV NODE_ENV=production

# 后端构建产物
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# 后端依赖（含 Prisma Client）
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# Prisma schema 和迁移文件（供 migrate deploy）
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# 共享包构建产物
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# 根级依赖（workspace 共享）
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 上传目录
RUN mkdir -p /app/uploads

WORKDIR /app/apps/backend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/integration/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
