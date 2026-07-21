import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ApiError, ErrorCodes } from '../common/response';
import { Role } from '@plms/shared';

/**
 * 系统级角色守卫
 * 使用：router.get('/users', requireRole(Role.ADMIN), handler)
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(ErrorCodes.UNAUTHORIZED, '未认证', 401));
    }
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r as Role));
    if (!hasRole) {
      return next(new ApiError(ErrorCodes.FORBIDDEN, '权限不足', 403));
    }
    next();
  };
};

/**
 * 系统级权限码守卫
 * 使用：router.get('/users', requirePermission('user:read'), handler)
 */
export const requirePermission = (...required: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(ErrorCodes.UNAUTHORIZED, '未认证', 401));
      }
      const userId = req.user.userId;
      const userRoles = await (
        await import('../prisma/client')
      ).prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      const permCodes = new Set<string>();
      userRoles.forEach((ur) => {
        ur.role.permissions.forEach((rp) => {
          permCodes.add(rp.permission.code);
        });
      });

      const missing = required.filter((p) => !permCodes.has(p));
      if (missing.length > 0) {
        return next(
          new ApiError(ErrorCodes.FORBIDDEN, `缺少权限: ${missing.join(', ')}`, 403)
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * 项目级角色守卫
 * 使用：router.post('/projects/:id/tasks', requireProjectRole('PM', 'OWNER'), handler)
 */
export const requireProjectRole = (...allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(ErrorCodes.UNAUTHORIZED, '未认证', 401));
      }
      const projectId = req.params.id as string;
      if (!projectId) {
        return next(new ApiError(ErrorCodes.BAD_REQUEST, '缺少项目 ID', 400));
      }
      const { prisma } = await import('../prisma/client');
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.userId } },
      });
      if (!member) {
        return next(new ApiError(ErrorCodes.NOT_PROJECT_MEMBER, '不是项目成员', 403));
      }
      if (!allowedRoles.includes(member.projectRole)) {
        return next(
          new ApiError(ErrorCodes.FORBIDDEN, `项目角色不足，需要: ${allowedRoles.join('/')}`, 403)
        );
      }
      // 注入项目成员信息
      (req as any).projectMember = member;
      next();
    } catch (err) {
      next(err);
    }
  };
};
