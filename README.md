# 宇测科技 - 项目全生命周期管理系统（PLMS）

> 宇测科技内部使用的企业级项目管理平台，覆盖项目从立项、规划、执行、监控到结项的完整生命周期。

## 技术栈

- **前端**：Vue 3 + Vite + TypeScript + Element Plus + Pinia + Vue Router + Axios
- **后端**：Node.js + Express + TypeScript + Prisma ORM
- **数据库**：PostgreSQL 16
- **认证**：JWT (Access + Refresh Token) + RBAC
- **甘特图**：Frappe Gantt
- **实时通信**：WebSocket
- **API 文档**：Swagger UI / OpenAPI 3.0
- **部署**：Docker Compose

## 核心功能

1. **项目立项管理** - 申请、审批、编号自动生成
2. **任务与进度管理** - WBS 分解、甘特图、里程碑
3. **资源与团队管理** - 人员分配、负载分析
4. **文档管理** - 上传、版本、权限
5. **风险与问题管理** - 5x5 风险矩阵
6. **成本与预算管理** - 预算、实际成本、超支预警
7. **项目结项** - 报告、经验教训、归档
8. **数据统计与报表** - 仪表盘、Excel 导出

## 快速开始

### 方式 1：Docker 一键启动（推荐）

```bash
cp .env.example .env
docker compose up -d
```

访问：
- 前端：http://localhost
- API 文档：http://localhost:3000/docs
- pgAdmin：http://localhost:5050 （profile=dev 启动）

### 方式 2：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动 PostgreSQL（需本机或远程已安装）
#    或 docker compose up -d postgres

# 3. 初始化数据库
npm run db:migrate
npm run db:seed

# 4. 启动前后端
npm run dev
```

默认账户：
| 角色 | 账号 | 密码 |
|------|------|------|
| 管理层 (ADMIN) | `admin` | `admin123` |
| 项目经理 (PM) | `pm_zhang` | `pm123456` |
| 团队成员 (MEMBER) | `dev_li` | `dev123456` |

## 项目结构

```
plms/
├── apps/
│   ├── backend/        # Express + Prisma 后端
│   └── frontend/       # Vue 3 + Element Plus 前端
├── packages/
│   └── shared/         # 共享 TS 类型与枚举
├── nginx/              # Nginx 配置
├── docs/               # 文档
└── docker-compose.yml  # 一键启动
```

## 角色权限

| 角色 | 权限 |
|------|------|
| **ADMIN**（管理层） | 系统全权、立项审批、结项审批、用户管理、报表 |
| **PM**（项目经理） | 项目创建/编辑、任务分配、子任务审批、团队管理 |
| **MEMBER**（团队成员） | 任务执行、子任务领取/上传、文档查看 |

详细设计见 `C:\Users\Win10\.workbuddy\plans\toasty-nebula-turing.md`

## 文档

- 详细实施计划：`C:\Users\Win10\.workbuddy\plans\toasty-nebula-turing.md`
- API 文档：启动后访问 `http://localhost:3000/docs`
- 数据库 ER 图：`docs/er/`
- 状态机图：`docs/state-machines/`

## License

UNLICENSED - 宇测科技内部使用
