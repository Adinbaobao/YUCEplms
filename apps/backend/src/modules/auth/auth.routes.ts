import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { ApiError, ErrorCodes, success } from '../../common/response';
import {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  AuthenticatedRequest,
} from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/error';
import { audit } from '../../middlewares/audit';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少 6 位'),
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 用户登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: admin123 }
 *     responses:
 *       200: { description: 登录成功，返回 access/refresh token }
 *       401: { description: 用户名或密码错误 }
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        department: true,
        userRoles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!user) {
      throw new ApiError(ErrorCodes.INVALID_CREDENTIALS, '用户名或密码错误', 401);
    }
    if (user.status !== 'ACTIVE') {
      throw new ApiError(ErrorCodes.USER_DISABLED, '账户已停用', 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(ErrorCodes.INVALID_CREDENTIALS, '用户名或密码错误', 401);
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => permissions.add(rp.permission.code));
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      roles,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json(
      success({
        accessToken,
        refreshToken,
        expiresIn: 900, // 15min
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatar: user.avatar,
          status: user.status,
          roles,
          permissions: Array.from(permissions),
          department: user.department
            ? { id: user.department.id, name: user.department.name }
            : undefined,
        },
      }, '登录成功')
    );
  })
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: 刷新 access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(ErrorCodes.USER_DISABLED, '用户不可用', 401);
    }
    const roles = user.userRoles.map((ur) => ur.role.code);
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      roles,
    });
    res.json(success({ accessToken, expiresIn: 900 }, '刷新成功'));
  })
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 获取当前用户信息
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        department: true,
        userRoles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, '用户不存在', 404);
    }
    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => permissions.add(rp.permission.code));
    });
    res.json(
      success({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        roles,
        permissions: Array.from(permissions),
        department: user.department
          ? { id: user.department.id, name: user.department.name }
          : undefined,
      })
    );
  })
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: 修改自己的密码
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/change-password',
  authenticate,
  audit('auth'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { oldPassword, newPassword } = z
      .object({
        oldPassword: z.string().min(6),
        newPassword: z.string().min(8, '新密码至少 8 位'),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new ApiError(ErrorCodes.NOT_FOUND, '用户不存在', 404);

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new ApiError(ErrorCodes.INVALID_CREDENTIALS, '原密码错误', 400);

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.json(success(null, '密码修改成功'));
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (_req, res) => {
    // 简化：客户端删除 token 即可；生产环境应维护黑名单
    res.json(success(null, '已登出'));
  })
);

export default router;
