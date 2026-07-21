import { Router, Request, Response, NextFunction } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const router = Router();

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: '宇测科技 PLMS API',
      version: '1.0.0',
      description: '项目全生命周期管理系统 - RESTful API',
    },
    servers: [
      { url: '/api/v1', description: '当前服务' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: '认证' },
      { name: 'Users', description: '用户管理' },
      { name: 'Roles', description: '角色管理' },
      { name: 'Departments', description: '部门管理' },
      { name: 'Dashboard', description: '工作台' },
      { name: 'Notifications', description: '通知' },
      { name: 'Projects', description: '项目管理' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
});

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(spec, {
    customSiteTitle: '宇测 PLMS API 文档',
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

router.get('/openapi.json', (_req: Request, res: Response, _next: NextFunction) => {
  res.json(spec);
});

export default router;
