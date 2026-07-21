import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/error';
import { prisma } from '../../prisma/client';
import { success } from '../../common/response';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: 工作台核心数据
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [
      activeProjectCount,
      pendingApprovalCount,
      myPendingTasks,
      unreadNotifications,
      upcomingMilestones,
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.projectApplication.count({ where: { status: 'PENDING' } }),
      prisma.subtask.count({
        where: {
          status: { in: ['UNCLAIMED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.notification.count({ where: { readAt: null } }),
      prisma.milestone.findMany({
        where: {
          status: 'PENDING',
          targetDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
        },
        orderBy: { targetDate: 'asc' },
        take: 5,
        include: { project: { select: { id: true, name: true, code: true } } },
      }),
    ]);

    res.json(
      success({
        kpi: {
          activeProjects: activeProjectCount,
          pendingApprovals: pendingApprovalCount,
          myPendingTasks,
          unreadNotifications,
        },
        upcomingMilestones,
      })
    );
  })
);

export default router;
