import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { logger } from './common/logger';

// 模块路由
import authRoutes from './modules/auth/auth.routes';
import { userRouter, deptRouter, roleRouter } from './modules/users/users.routes';
import projectRoutes from './modules/projects/projects.routes';
import taskRoutes from './modules/tasks/tasks.routes';
import dashboardRoutes from './modules/statistics/dashboard.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import swaggerRouter from './docs/swagger';

export const createApp = (): Application => {
  const app = express();

  // 安全
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.cors.origin, credentials: true }));

  // 限流
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: { code: 1007, message: '请求过于频繁，请稍后再试' },
  });
  app.use('/api/', limiter);

  // 基础
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  // 静态资源（uploads）
  app.use(
    '/uploads',
    express.static(config.upload.dir, { maxAge: '7d', etag: true })
  );

  // 健康检查
  app.get('/api/v1/integration/health', (_req: Request, res: Response) => {
    res.json({
      code: 0,
      message: 'OK',
      data: {
        status: 'healthy',
        env: config.env,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // 业务路由
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/departments', deptRouter);
  app.use('/api/v1/roles', roleRouter);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  // API 文档（必须在 /api/v1 通配路由前面）
  app.use('/api/v1/docs', swaggerRouter);
  app.get('/api/v1/docs.json', (_req, res) => {
    res.sendFile(path.join(__dirname, '../docs/openapi.json'));
  });

  // 通配任务路由（/api/v1/*，必须在 docs 之后）
  app.use('/api/v1', taskRoutes);

  // 错误处理
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
logger.info(`PLMS Backend initialized in ${config.env} mode`);
