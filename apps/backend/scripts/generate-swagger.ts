import swaggerJsdoc from 'swagger-jsdoc';
import * as fs from 'fs';
import * as path from 'path';

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
  apis: [path.join(process.cwd(), 'src', 'modules', '**', '*.routes.ts')],
});

const outDir = path.join(__dirname, '..', 'dist', 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2));
console.log(`Generated OpenAPI spec with ${Object.keys(spec.paths || {}).length} paths`);
