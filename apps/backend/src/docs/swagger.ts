import { Router, Request, Response, NextFunction } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

const swaggerDefinition = {
  openapi: '3.0.3' as const,
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
        type: 'http' as const,
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
};

// 生产环境：使用预生成的静态 spec；开发环境：动态解析源文件
let spec: any;
const staticSpecPath = path.join(__dirname, '..', 'docs', 'openapi.json');

if (process.env.NODE_ENV === 'production' && fs.existsSync(staticSpecPath)) {
  spec = JSON.parse(fs.readFileSync(staticSpecPath, 'utf-8'));
} else {
  spec = swaggerJsdoc({
    definition: swaggerDefinition,
    apis: [path.join(process.cwd(), 'src', 'modules', '**', '*.routes.ts')],
  });
}

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
