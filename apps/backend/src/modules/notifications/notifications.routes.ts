import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/error';
import { prisma } from '../../prisma/client';
import { success } from '../../common/response';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: 消息列表（支持分页和未读筛选）
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/',
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const pageSize = Math.min(100, parseInt((req.query.pageSize as string) || '20', 10));
    const unreadOnly = req.query.unread === 'true';
    const where: any = { userId: req.user.userId };
    if (unreadOnly) where.readAt = null;
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.userId, readAt: null } }),
    ]);
    res.json(success({ items, total, page, pageSize, unreadCount }));
  })
);

/**
 * @swagger
 * /api/v1/notifications/read:
 *   post:
 *     tags: [Notifications]
 *     summary: 标记已读（传 ids 标记指定，不传全部已读）
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/read',
  asyncHandler(async (req: any, res) => {
    const { ids } = z.object({ ids: z.array(z.string()).optional() }).parse(req.body);
    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: req.user.userId },
        data: { readAt: new Date() },
      });
    } else {
      // 全部已读
      await prisma.notification.updateMany({
        where: { userId: req.user.userId, readAt: null },
        data: { readAt: new Date() },
      });
    }
    res.json(success(null, '已标记为已读'));
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req: any, res) => {
    const count = await prisma.notification.count({
      where: { userId: req.user.userId, readAt: null },
    });
    res.json(success({ count }));
  })
);

export default router;
