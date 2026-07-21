# 🚀 宇测科技 PLMS - Docker 验证指南

## 前提条件
- ✅ Docker 已安装（docker --version + docker compose version 确认）
- 项目目录：`plms/`

## 一键启动（3 分钟）

```bash
# 进入项目目录
cd plms

# 1. 确保有 .env（已存在则跳过）
cp .env.example .env

# 2. 构建 + 启动所有服务（首次构建约 3-5 分钟）
docker compose up -d --build

# 3. 查看启动日志
docker compose logs -f backend
```

看到以下输出表示启动成功：
```
🚀 PLMS Backend 已启动: http://localhost:3000
```

## 访问地址

| 服务 | 地址 |
|------|------|
| **前端系统** | http://localhost |
| **API 文档（Swagger）** | http://localhost:3000/api/v1/docs |
| **健康检查** | http://localhost:3000/api/v1/integration/health |
| **pgAdmin**（数据库管理） | http://localhost:5050（需 `--profile dev`） |

## 登录验证

打开 http://localhost，使用以下账号：

| 角色 | 账号 | 密码 |
|------|------|------|
| 👑 管理层 | `admin` | `admin123` |
| 📋 项目经理 | `pm_zhang` | `pm123456` |
| 👷 团队成员 | `dev_li` | `dev123456` |

## 验证清单

- [ ] 登录页正常显示（蓝橙渐变色 UI）
- [ ] admin 登录后看到工作台（KPI 卡片 + 项目列表 + 流程图预览）
- [ ] 侧边栏 4 个菜单：工作台 / 项目列表 / 子任务收件箱 / 消息中心
- [ ] 顶栏通知铃铛 + 用户头像下拉
- [ ] Swagger 文档可访问：http://localhost:3000/api/v1/docs
- [ ] 健康检查返回 OK

## 常用命令

```bash
# 查看实时日志
docker compose logs -f backend
docker compose logs -f frontend

# 重启服务
docker compose restart backend

# 停止所有
docker compose down

# 完全清理（⚠️ 删除所有数据）
docker compose down -v

# 进入数据库
docker compose exec postgres psql -U plms -d plms

# 重新构建某个服务
docker compose build --no-cache backend
docker compose up -d --force-recreate backend

# 查看容器状态
docker compose ps
```

## 如果遇到问题

### 端口冲突
修改 `docker-compose.yml` 中的 `ports` 映射：
```yaml
backend:
  ports:
    - "3001:3000"  # 改为 3001
frontend:
  ports:
    - "8080:80"    # 改为 8080
```

### 数据库迁移失败
```bash
docker compose exec backend npx prisma migrate reset --force
# 注意：这会清空所有数据！
```

### 构建失败
```bash
# 清理缓存重试
docker compose down
docker system prune -f
docker compose up -d --build
```
