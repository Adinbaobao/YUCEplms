# ============================================
# 多阶段构建：builder + nginx
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 复制依赖清单
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# 2. 安装依赖
RUN npm install --legacy-peer-deps

# 3. 复制源码
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

# 4. 构建 shared 包 + 前端
RUN npm run build:shared
RUN cd apps/frontend && npm run build

# ============================================
# Runtime: nginx 提供静态文件
# ============================================
FROM nginx:1.27-alpine AS runtime

# 前端构建产物
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Nginx 配置（用于反向代理 /api 到后端）
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
