import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../prisma/client';
import { logger } from '../common/logger';

/**
 * 审计日志中间件 - 记录所有写操作
 */
export const audit = (moduleName: string, action?: string) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // 仅记录写操作
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const act = action || `${req.method} ${req.path}`;
    const userId = req.user?.userId;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    // 在响应完成后记录
    resOnFinish(_res, async () => {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            module: moduleName,
            action: act,
            resourceType: (req as any).resourceType,
            resourceId: (req as any).resourceId,
            after: { body: req.body, params: req.params, query: req.query },
            ip,
            userAgent,
          },
        });
      } catch (err: any) {
        logger.warn({ error: err.message }, '审计日志写入失败');
      }
    });

    next();
  };
};

const resOnFinish = (res: Response, callback: () => void | Promise<void>) => {
  res.on('finish', () => callback());
  res.on('close', () => callback());
};
