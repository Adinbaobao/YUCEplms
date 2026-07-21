import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { ApiError, ErrorCodes, success } from '../../common/response';
import { authenticate, AuthenticatedRequest } from '../../middlewares/auth';
import { requireRole, requirePermission } from '../../middlewares/rbac';
import { asyncHandler } from '../../middlewares/error';
import { audit } from '../../middlewares/audit';
import { Role, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@plms/shared';

const router = Router();

// 所有用户接口都需要登录
router.use(authenticate);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: 用户列表（仅 ADMIN）
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt((req.query.pageSize as string) || String(DEFAULT_PAGE_SIZE), 10))
    );
    const keyword = (req.query.keyword as string) || '';
    const status = req.query.status as string | undefined;

    const where: any = { deletedAt: null };
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          userRoles: { include: { role: { select: { id: true, code: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json(
      success({
        items: items.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          avatar: u.avatar,
          status: u.status,
          lastLoginAt: u.lastLoginAt,
          department: u.department,
          roles: u.userRoles.map((ur) => ur.role),
          createdAt: u.createdAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  })
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: 创建用户（仅 ADMIN）
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/',
  requireRole(Role.ADMIN),
  audit('user'),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        fullName: z.string().min(1),
        phone: z.string().optional(),
        password: z.string().min(8),
        departmentId: z.string().optional(),
        roleIds: z.array(z.string()).min(1, '至少分配一个角色'),
      })
      .parse(req.body);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });
    if (exists) throw new ApiError(ErrorCodes.USER_EXISTS, '用户名或邮箱已存在', 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        departmentId: data.departmentId,
        userRoles: {
          create: data.roleIds.map((roleId) => ({ roleId })),
        },
      },
      include: { userRoles: { include: { role: true } } },
    });
    res.status(201).json(success({ id: user.id }, '用户创建成功'));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string, deletedAt: null },
      include: {
        department: true,
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    if (!user) throw new ApiError(ErrorCodes.NOT_FOUND, '用户不存在', 404);
    res.json(success(user));
  })
);

router.patch(
  '/:id',
  requireRole(Role.ADMIN),
  audit('user'),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        email: z.string().email().optional(),
        fullName: z.string().min(1).optional(),
        phone: z.string().optional(),
        avatar: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
        departmentId: z.string().optional(),
      })
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(success({ id: user.id }, '更新成功'));
  })
);

router.post(
  '/:id/reset-password',
  requireRole(Role.ADMIN),
  audit('user'),
  asyncHandler(async (req, res) => {
    const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(req.body);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.params.id as string },
      data: { passwordHash },
    });
    res.json(success(null, '密码已重置'));
  })
);

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     tags: [Departments]
 *     summary: 部门列表（树形）
 *     security: [{ bearerAuth: [] }]
 */
const deptRouter = Router();
deptRouter.use(authenticate);

deptRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const depts = await prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    // 构造树形
    const map = new Map(depts.map((d) => [d.id, { ...d, children: [] as any[] }]));
    const tree: any[] = [];
    depts.forEach((d) => {
      const node = map.get(d.id);
      if (d.parentId && map.has(d.parentId)) {
        map.get(d.parentId)!.children.push(node);
      } else {
        tree.push(node);
      }
    });
    res.json(success(tree));
  })
);

deptRouter.post(
  '/',
  requireRole(Role.ADMIN),
  audit('department'),
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        name: z.string().min(1),
        code: z.string().min(1),
        parentId: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(req.body);
    const dept = await prisma.department.create({ data });
    res.status(201).json(success(dept, '部门创建成功'));
  })
);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: 角色列表
 *     security: [{ bearerAuth: [] }]
 */
const roleRouter = Router();
roleRouter.use(authenticate);
roleRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { permissions: { include: { permission: true } } },
    });
    res.json(success(roles));
  })
);

export { router as userRouter, deptRouter, roleRouter };
