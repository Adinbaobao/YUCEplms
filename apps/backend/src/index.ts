import { createServer } from 'http';
import { config } from './config';
import { createApp } from './app';
import { logger } from './common/logger';
import { prisma } from './prisma/client';

const main = async () => {
  // 启动前检查数据库连接
  try {
    await prisma.$connect();
    logger.info('✅ 数据库连接成功');
  } catch (err: any) {
    logger.error({ error: err.message }, '❌ 数据库连接失败');
    process.exit(1);
  }

  const app = createApp();
  const server = createServer(app);

  server.listen(config.port, () => {
    logger.info(`🚀 PLMS Backend 已启动: http://localhost:${config.port}`);
    logger.info(`📖 API 文档: http://localhost:${config.port}/api/v1/docs`);
    logger.info(`💚 健康检查: http://localhost:${config.port}/api/v1/integration/health`);
  });

  // 优雅关闭
  const shutdown = async (signal: string) => {
    logger.info(`收到 ${signal} 信号，开始关闭...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('服务已关闭');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

main().catch((err) => {
  logger.error({ error: err }, '启动失败');
  process.exit(1);
});
