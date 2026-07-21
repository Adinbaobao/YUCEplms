import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError, ErrorCodes } from '../common/response';
import { prisma } from '../prisma/client';

export interface AuthPayload {
  userId: string;
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

/**
 * 验证 Access Token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, '未提供认证令牌', 401);
    }

    const token = authHeader.substring(7);
    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(ErrorCodes.TOKEN_EXPIRED, '令牌已过期', 401);
      }
      throw new ApiError(ErrorCodes.TOKEN_INVALID, '令牌无效', 401);
    }

    // 验证用户仍存在且启用
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new ApiError(ErrorCodes.USER_DISABLED, '用户不存在', 401);
    }
    if (user.status !== 'ACTIVE') {
      throw new ApiError(ErrorCodes.USER_DISABLED, '用户已停用', 401);
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * 生成 Access Token
 */
export const generateAccessToken = (payload: Omit<AuthPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
};

/**
 * 生成 Refresh Token（7天）
 */
export const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

/**
 * 验证 Refresh Token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    return jwt.verify(token, config.jwt.secret) as { userId: string };
  } catch {
    throw new ApiError(ErrorCodes.TOKEN_INVALID, '刷新令牌无效或已过期', 401);
  }
};
