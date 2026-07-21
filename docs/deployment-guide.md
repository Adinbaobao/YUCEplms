# 宇测科技 PLMS - 部署指南

## 方式 1：Docker Compose 一键启动（推荐）

### 前置条件
- Docker 20.10+
- Docker Compose v2+
- 至少 4GB 可用内存

### 启动步骤

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 修改 .env 中的密钥（生产环境必须）
#    - JWT_SECRET
#    - DB_PASSWORD
#    - OA_HMAC_SECRET

# 3. 一键启动
docker compose up -d

# 4. 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 5. 访问
#    前端：http://localhost
#    API:  http://localhost:3000/api/v1
#    文档：http://localhost:3000/api/v1/docs
#    健康：http://localhost:3000/api/v1/integration/health
#    pgAdmin（开发）：http://localhost:5050 (启动时加 --profile dev)
```

### 数据持久化
- PostgreSQL 数据：`postgres_data` 卷
- 上传文件：`uploads` 卷
- 备份脚本：`./scripts/backup.sh`

### 重置数据
```bash
# 危险：删除所有数据！
docker compose down -v
docker compose up -d
```

## 方式 2：本地开发（需本机 PostgreSQL）

### 前置条件
- Node.js 20+
- PostgreSQL 16+（本地或远程）

### 启动步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置 .env
#    DATABASE_URL 指向本机 PostgreSQL
cp .env.example .env

# 3. 启动 PostgreSQL（任选一种）
#    a) Docker 仅启动数据库：docker compose up -d postgres
#    b) 本机已安装：brew services start postgresql@16

# 4. 初始化数据库
npm run db:migrate
npm run db:seed

# 5. 启动前后端（两个进程）
npm run dev

# 6. 访问
#    前端：http://localhost:5173
#    API:  http://localhost:3000/api/v1
```

## 默认账户

| 角色 | 账号 | 密码 | 权限 |
|------|------|------|------|
| 管理层 | `admin` | `admin123` | 系统全权 |
| 项目经理 | `pm_zhang` | `pm123456` | 项目/任务/审批 |
| 项目经理 | `pm_li` | `pm123456` | 项目/任务/审批 |
| 团队成员 | `dev_wang` | `dev123456` | 任务执行 |
| 团队成员 | `dev_li` | `dev123456` | 任务执行 |
| 测试工程师 | `qa_chen` | `qa123456` | 任务执行 |

> ⚠️ 生产环境请立即修改默认密码！

## 部署到 NAS

### 方案 1：直接 Docker Compose
1. 通过 SSH 或 SMB 登录 NAS
2. 复制项目目录到 NAS
3. 按方式 1 操作

### 方案 2：Portainer 管理
1. NAS 安装 Portainer
2. 导入 `docker-compose.yml`
3. 在 Portainer 中启动

## 常见问题

### Q1: 数据库迁移失败
```bash
# 重置数据库
docker compose exec backend npx prisma migrate reset
```

### Q2: 前端访问后端 404
检查 `nginx/default.conf` 是否正确挂载，且 `backend` 容器已启动。

### Q3: Swagger 文档空白
访问 `http://localhost:3000/api/v1/docs/openapi.json` 应返回 JSON。检查 `swagger-jsdoc` 配置和路由文件注释。

### Q4: 端口冲突
修改 `.env` 中的 `PORT` 和 `docker-compose.yml` 中的 `ports` 映射。

## 性能调优

### 后端
- `pm2` 集群模式（生产环境推荐）
- `nginx` 反向代理 + 负载均衡
- Redis 缓存高频查询（待后续阶段集成）

### 数据库
- 定期 VACUUM ANALYZE
- 关键查询加索引（已在 Prisma schema 中标注）
- 连接池：`DATABASE_URL` 中 `?connection_limit=20`

## 备份与恢复

```bash
# 备份
./scripts/backup.sh

# 恢复
gunzip -c backups/plms_20260101_120000.sql.gz | \
  docker compose exec -T postgres psql -U plms -d plms
```

## 监控建议

- 集成 Prometheus + Grafana
- 关键指标：API 响应时间、数据库连接数、磁盘使用
- 日志：ELK / Loki 收集
