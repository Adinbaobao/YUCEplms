import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { ApiError, ErrorCodes, success } from '../../common/response';
import { authenticate, AuthenticatedRequest } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/error';
import { audit } from '../../middlewares/audit';
import {
  SubtaskStatus, DependencyType, TaskStatus, Priority,
} from '@plms/shared';

const router = Router();
router.use(authenticate);

// ============================================
// 更新任务
// ============================================
const taskUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  progress: z.number().min(0).max(100).optional(),
  assigneeId: z.string().nullable().optional(),
  plannedStart: z.string().nullable().optional(),
  plannedEnd: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  actualStart: z.string().nullable().optional(),
  actualEnd: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  parentId: z.string().nullable().optional(),
});

router.patch(
  '/tasks/:id',
  audit('task', 'update'),
  asyncHandler(async (req, res) => {
    const taskId = req.params.id as string;
    const data = taskUpdateSchema.parse(req.body);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(ErrorCodes.TASK_NOT_FOUND, '任务不存在', 404);
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        plannedStart: data.plannedStart !== undefined ? (data.plannedStart ? new Date(data.plannedStart) : null) : undefined,
        plannedEnd: data.plannedEnd !== undefined ? (data.plannedEnd ? new Date(data.plannedEnd) : null) : undefined,
        actualStart: data.actualStart !== undefined ? (data.actualStart ? new Date(data.actualStart) : null) : undefined,
        actualEnd: data.actualEnd !== undefined ? (data.actualEnd ? new Date(data.actualEnd) : null) : undefined,
      },
      include: { assignee: { select: { id: true, fullName: true, avatar: true } } },
    });
    res.json(success(updated, '已更新'));
  })
);

// ============================================
// 删除任务
// ============================================
router.delete(
  '/tasks/:id',
  audit('task', 'delete'),
  asyncHandler(async (req, res) => {
    const taskId = req.params.id as string;
    const children = await prisma.task.count({ where: { parentId: taskId, deletedAt: null } });
    if (children > 0) throw new ApiError(ErrorCodes.BAD_REQUEST, '请先删除子任务', 400);
    await prisma.task.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
    res.json(success(null, '已删除'));
  })
);

// ============================================
// 移动/排序
// ============================================
router.post(
  '/tasks/:id/move',
  asyncHandler(async (req, res) => {
    const { parentId, sortOrder } = z.object({
      parentId: z.string().nullable().optional(),
      sortOrder: z.number().int().optional(),
    }).parse(req.body);
    await prisma.task.update({ where: { id: req.params.id as string }, data: { parentId, sortOrder } });
    res.json(success(null, '已移动'));
  })
);

// ============================================
// 依赖
// ============================================
router.post(
  '/tasks/:id/dependencies',
  asyncHandler(async (req, res) => {
    const taskId = req.params.id as string;
    const { dependsOnId, type } = z.object({
      dependsOnId: z.string(),
      type: z.nativeEnum(DependencyType).default(DependencyType.FS),
    }).parse(req.body);
    if (taskId === dependsOnId) throw new ApiError(ErrorCodes.TASK_DEPENDENCY_CYCLE, '不能依赖自身', 400);
    const dep = await prisma.taskDependency.create({ data: { taskId, dependsOnId, type } });
    res.status(201).json(success(dep, '依赖已添加'));
  })
);

router.delete(
  '/tasks/:id/dependencies/:depId',
  asyncHandler(async (req, res) => {
    await prisma.taskDependency.delete({ where: { id: req.params.depId as string } });
    res.json(success(null, '依赖已移除'));
  })
);

// ============================================
// 进度更新 + 自动重算
// ============================================
router.post(
  '/tasks/:id/progress',
  asyncHandler(async (req, res) => {
    const taskId = req.params.id as string;
    const { progress, actualHours } = z.object({
      progress: z.number().min(0).max(100),
      actualHours: z.number().optional(),
    }).parse(req.body);
    const updateData: any = { progress };
    if (progress === 100) updateData.status = TaskStatus.COMPLETED;
    else if (progress > 0) updateData.status = TaskStatus.IN_PROGRESS;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    await prisma.task.update({ where: { id: taskId }, data: updateData });

    const t = await prisma.task.findUnique({ where: { id: taskId }, select: { parentId: true, projectId: true } });
    if (t?.parentId) await recalcParent(t.parentId);
    if (t?.projectId) await recalcProject(t.projectId);
    res.json(success(null, '进度已更新'));
  })
);

async function recalcParent(pid: string) {
  const children = await prisma.task.findMany({ where: { parentId: pid, deletedAt: null }, select: { progress: true } });
  if (children.length > 0) {
    const avg = Math.round(children.reduce((s, c) => s + c.progress, 0) / children.length);
    await prisma.task.update({ where: { id: pid }, data: { progress: avg } });
  }
}

async function recalcProject(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId, deletedAt: null, isMilestone: false, parentId: null },
    select: { progress: true },
  });
  if (tasks.length > 0) {
    const avg = Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);
    await prisma.project.update({ where: { id: projectId }, data: { progress: avg } });
  }
}

// ============================================
// 子任务创建（流程图核心）
// ============================================
router.post(
  '/tasks/:taskId/subtasks',
  audit('subtask', 'create'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = z.object({ name: z.string().min(1), description: z.string().optional(), ownerId: z.string() }).parse(req.body);
    const subtask = await prisma.subtask.create({
      data: { taskId: req.params.taskId as string, name: data.name, description: data.description, ownerId: data.ownerId, status: SubtaskStatus.UNCLAIMED },
      include: { owner: { select: { id: true, fullName: true, avatar: true } } },
    });
    await prisma.notification.create({
      data: { userId: data.ownerId, type: 'SUBTASK_ASSIGNED', title: '新子任务分配', content: `你被分配了子任务「${data.name}」` },
    });
    res.status(201).json(success(subtask, '子任务已创建'));
  })
);

// ============================================
// 子任务——状态流转（流程图核心）
// ============================================
router.post('/subtasks/:id/claim', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sub = await prisma.subtask.findUnique({ where: { id: req.params.id as string } });
  if (!sub) throw new ApiError(ErrorCodes.SUBTASK_NOT_FOUND, '子任务不存在', 404);
  if (sub.status !== SubtaskStatus.UNCLAIMED) throw new ApiError(ErrorCodes.STATE_MACHINE_INVALID, '只能领取未领取的子任务', 409);
  const updated = await prisma.subtask.update({
    where: { id: sub.id },
    data: { status: SubtaskStatus.CLAIMED, claimedAt: new Date() },
  });
  res.json(success(updated, '已领取'));
}));

router.post('/subtasks/:id/upload', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sub = await prisma.subtask.findUnique({ where: { id: req.params.id as string } });
  if (!sub) throw new ApiError(ErrorCodes.SUBTASK_NOT_FOUND, '子任务不存在', 404);
  if (![SubtaskStatus.CLAIMED, SubtaskStatus.REJECTED].includes(sub.status as SubtaskStatus)) {
    throw new ApiError(ErrorCodes.STATE_MACHINE_INVALID, '当前状态不可上传', 409);
  }
  const { comment } = z.object({ comment: z.string().optional() }).parse(req.body);
  const version = sub.status === SubtaskStatus.REJECTED ? sub.version + 1 : sub.version;
  await prisma.$transaction([
    prisma.subtask.update({ where: { id: sub.id }, data: { status: SubtaskStatus.UPLOADED, version } }),
    prisma.subtaskUpload.create({ data: { subtaskId: sub.id, uploaderId: req.user!.userId, comment, version } }),
  ]);
  res.json(success(null, '已上传'));
}));

router.post('/subtasks/:id/submit-review', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sub = await prisma.subtask.findUnique({ where: { id: req.params.id as string } });
  if (!sub) throw new ApiError(ErrorCodes.SUBTASK_NOT_FOUND, '子任务不存在', 404);
  if (sub.status !== SubtaskStatus.UPLOADED) throw new ApiError(ErrorCodes.STATE_MACHINE_INVALID, '当前状态不可提交审核', 409);
  await prisma.subtask.update({ where: { id: sub.id }, data: { status: SubtaskStatus.UNDER_REVIEW } });
  res.json(success(null, '已提交审核'));
}));

const reviewSchema = z.object({
  decision: z.enum(['PASS', 'REJECT', 'HOLD']),
  comment: z.string().optional(),
});

router.post('/subtasks/:id/review', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sub = await prisma.subtask.findUnique({ where: { id: req.params.id as string } });
  if (!sub) throw new ApiError(ErrorCodes.SUBTASK_NOT_FOUND, '子任务不存在', 404);
  if (sub.status !== SubtaskStatus.UNDER_REVIEW) throw new ApiError(ErrorCodes.STATE_MACHINE_INVALID, '当前状态不可审核', 409);

  const { decision, comment } = reviewSchema.parse(req.body);
  const statusMap = { PASS: SubtaskStatus.APPROVED, REJECT: SubtaskStatus.REJECTED, HOLD: SubtaskStatus.LOCKED };
  await prisma.$transaction([
    prisma.subtask.update({ where: { id: sub.id }, data: { status: statusMap[decision] } }),
    prisma.subtaskReview.create({
      data: { subtaskId: sub.id, reviewerId: req.user!.userId, decision, comment, fromStatus: sub.status, toStatus: statusMap[decision] },
    }),
  ]);
  res.json(success(null, decision === 'PASS' ? '审批通过' : decision === 'REJECT' ? '已驳回' : '已暂定'));
}));

router.post('/subtasks/:id/relock', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sub = await prisma.subtask.findUnique({ where: { id: req.params.id as string } });
  if (!sub) throw new ApiError(ErrorCodes.SUBTASK_NOT_FOUND, '子任务不存在', 404);
  if (sub.status !== SubtaskStatus.LOCKED) throw new ApiError(ErrorCodes.STATE_MACHINE_INVALID, '只能对已锁定任务重新审核', 409);
  await prisma.$transaction([
    prisma.subtask.update({ where: { id: sub.id }, data: { status: SubtaskStatus.UNDER_REVIEW } }),
    prisma.subtaskReview.create({
      data: { subtaskId: sub.id, reviewerId: req.user!.userId, decision: 'RELOCK', fromStatus: SubtaskStatus.LOCKED, toStatus: SubtaskStatus.UNDER_REVIEW },
    }),
  ]);
  res.json(success(null, '已重新审核'));
}));

router.get('/subtasks/:id/history', asyncHandler(async (req, res) => {
  const [reviews, uploads] = await Promise.all([
    prisma.subtaskReview.findMany({
      where: { subtaskId: req.params.id as string },
      include: { reviewer: { select: { id: true, fullName: true } } },
      orderBy: { decidedAt: 'asc' },
    }),
    prisma.subtaskUpload.findMany({
      where: { subtaskId: req.params.id as string },
      include: { uploader: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  res.json(success({ reviews, uploads }));
}));

export default router;
