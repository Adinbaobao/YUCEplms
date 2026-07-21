import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError, ErrorCodes } from '../common/response';
import { logger } from '../common/logger';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: ErrorCodes.NOT_FOUND,
    message: `路由不存在: ${req.method} ${req.path}`,
  });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // ApiError - 业务异常
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: err.data,
    });
    return;
  }

  // Zod 校验错误
  if (err instanceof ZodError) {
    res.status(400).json({
      code: ErrorCodes.VALIDATION_ERROR,
      message: '请求参数校验失败',
      data: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Prisma 已知错误
  if ((err as any).code === 'P2002') {
    res.status(409).json({
      code: ErrorCodes.PROJECT_CODE_DUPLICATE,
      message: '数据已存在（唯一约束冲突）',
      data: (err as any).meta,
    });
    return;
  }
  if ((err as any).code === 'P2025') {
    res.status(404).json({
      code: ErrorCodes.NOT_FOUND,
      message: '记录不存在',
    });
    return;
  }

  // 未知错误
  logger.error({ error: err.message, stack: err.stack }, '未处理异常');
  res.status(500).json({
    code: ErrorCodes.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  });
};

/**
 * 异步 handler 包装，避免 try/catch 重复
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
  ) =>
  (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
