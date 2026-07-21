import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { ApiError, ErrorCodes, success } from '../../common/response';
import { authenticate, AuthenticatedRequest } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { asyncHandler } from '../../middlewares/error';
import { audit } from '../../middlewares/audit';
import {
  SubtaskStatus, ReviewDecision, DependencyType, TaskStatus, Priority, ProjectStatus, ApplicationStatus, Role,
} from '@plms/shared';

const router = Router();
router.use(authenticate);

// ============================================
// 工具函数：项目编号生成
// ============================================
const generateProjectCode = async (deptCode: string): Promise<string> => {
  const year = new Date().getFullYear();
  const key = `PROJECT_${year}_${deptCode.toUpperCase()}`;

  const seq = await prisma.$transaction(async (tx) => {
    let ns = await tx.numberSequence.findUnique({ where: { key_year: { key, year } } });
    if (!ns) {
      ns = await tx.numberSequence.create({ data: { key, year, current: 1 } });
    } else {
      ns = await tx.numberSequence.update({
        where: { key_year: { key, year } },
        data: { current: { increment: 1 } },
      });
    }
    return ns.current;
  });

  return `YC-${year}-${deptCode.toUpperCase()}-${String(seq).padStart(4, '0')}`;
};

// ============================================
// 项目列表
// ============================================
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = Math.max(1, +(req.query.page || 1));
    const pageSize = Math.min(100, +(req.query.pageSize || 20));
    const keyword = (req.query.keyword as string) || '';
    const status = req.query.status as string | undefined;
    const mine = req.query.mine === 'true';

    const where: any = { deletedAt: null };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (mine) {
      where.members = { some: { userId: req.user!.userId } };
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, fullName: true, avatar: true } },
          department: { select: { id: true, name: true } },
          members: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    res.json(success({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }));
  })
);

// ============================================
// WBS 任务树（必须在 /:id 前面）
// ============================================
router.get(
  '/:projectId/wbs',
  asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.projectId as string, deletedAt: null },
      include: {
        assignee: { select: { id: true, fullName: true, avatar: true } },
        owner: { select: { id: true, fullName: true, avatar: true } },
        subtasks: { include: { owner: { select: { id: true, fullName: true, avatar: true } } } },
        dependencies: { include: { dependsOn: { select: { id: true, name: true, progress: true, status: true } } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    // 构造树形
    const nodeMap = new Map<string, any>();
    const tree: any[] = [];
    tasks.forEach((t) => nodeMap.set(t.id, { ...t, children: [] }));
    tasks.forEach((t) => {
      const node = nodeMap.get(t.id)!;
      if (t.parentId && nodeMap.has(t.parentId)) {
        nodeMap.get(t.parentId)!.children.push(node);
      } else {
        tree.push(node);
      }
    });
    res.json(success(tree));
  })
);

// ============================================
// 甘特图数据（必须在 /:id 前面）
// ============================================
router.get(
  '/:projectId/gantt',
  asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.projectId as string, deletedAt: null },
      include: {
        assignee: { select: { id: true, fullName: true } },
        dependencies: { select: { dependsOnId: true, type: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    const ganttTasks = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.plannedStart?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
      end: t.plannedEnd?.toISOString().slice(0, 10) || (t.plannedStart ? new Date(t.plannedStart.getTime() + 7 * 864e5).toISOString().slice(0, 10) : new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)),
      progress: t.progress,
      dependencies: t.dependencies.map((d) => d.dependsOnId),
      custom_class: t.isMilestone ? 'milestone' : '',
      assignee: t.assignee?.fullName || '',
      status: t.status,
    }));
    res.json(success(ganttTasks));
  })
);

// ============================================
// 创建任务（必须在 /:id 前面）
// ============================================
const taskCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  estimatedHours: z.number().optional(),
  isMilestone: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.post(
  '/:projectId/tasks',
  audit('task', 'create'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = taskCreateSchema.parse(req.body);
    const projectId = req.params.projectId as string;
    const task = await prisma.task.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        assigneeId: data.assigneeId,
        ownerId: req.user!.userId,
        priority: data.priority || Priority.MEDIUM,
        plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
        plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
        estimatedHours: data.estimatedHours,
        isMilestone: data.isMilestone || false,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        assignee: { select: { id: true, fullName: true, avatar: true } },
      },
    });
    if (data.isMilestone && data.plannedEnd) {
      await prisma.milestone.create({
        data: { projectId, taskId: task.id, name: data.name, targetDate: new Date(data.plannedEnd) },
      });
    }
    res.status(201).json(success(task, '任务已创建'));
  })
);

// ============================================
// 里程碑（必须在 /:id 前面）
// ============================================
router.get(
  '/:projectId/milestones',
  asyncHandler(async (req, res) => {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.projectId as string },
      include: { task: { select: { id: true, name: true, progress: true } } },
      orderBy: { targetDate: 'asc' },
    });
    res.json(success(milestones));
  })
);

router.post(
  '/:projectId/milestones',
  asyncHandler(async (req, res) => {
    const data = z.object({ name: z.string().min(1), targetDate: z.string(), taskId: z.string().optional() }).parse(req.body);
    const ms = await prisma.milestone.create({
      data: { projectId: req.params.projectId as string, name: data.name, targetDate: new Date(data.targetDate), taskId: data.taskId },
    });
    res.status(201).json(success(ms, '里程碑已创建'));
  })
);

// ============================================
// 项目详情
// ============================================
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id as string, deletedAt: null },
      include: {
        owner: { select: { id: true, fullName: true, avatar: true } },
        department: true,
        application: { include: { approvals: true } },
        members: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
        milestones: { orderBy: { targetDate: 'asc' } },
        _count: { select: { tasks: true, documents: true, risks: true, issues: true } },
      },
    });
    if (!project) throw new ApiError(ErrorCodes.PROJECT_NOT_FOUND, '项目不存在', 404);
    res.json(success(project));
  })
);

// ============================================
// 立项申请 —— 创建草稿
// ============================================
const createAppSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  expectedBudget: z.number().min(0).default(0),
  expectedStart: z.string().optional(),
  expectedEnd: z.string().optional(),
  departmentId: z.string().optional(),
  memberUserIds: z.array(z.string()).optional(),
});

router.post(
  '/applications',
  audit('project', 'create_application'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const data = createAppSchema.parse(req.body);
    const department = data.departmentId
      ? await prisma.department.findUnique({ where: { id: data.departmentId } })
      : null;
    const code = await generateProjectCode(department?.code || 'XX');

    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          code,
          name: data.name,
          description: data.description,
          priority: data.priority,
          status: ProjectStatus.DRAFT,
          budget: data.expectedBudget,
          plannedStart: data.expectedStart ? new Date(data.expectedStart) : undefined,
          plannedEnd: data.expectedEnd ? new Date(data.expectedEnd) : undefined,
          ownerId: req.user!.userId,
          departmentId: data.departmentId,
        },
      });
      // 创建立项申请
      await tx.projectApplication.create({
        data: {
          projectId: p.id,
          applicantId: req.user!.userId,
          expectedStart: data.expectedStart ? new Date(data.expectedStart) : undefined,
          expectedEnd: data.expectedEnd ? new Date(data.expectedEnd) : undefined,
          expectedBudget: data.expectedBudget,
          status: ApplicationStatus.PENDING,
        },
      });
      // 添加创建者为主成员
      await tx.projectMember.create({
        data: { projectId: p.id, userId: req.user!.userId, projectRole: 'PM' },
      });
      // 添加其他成员
      if (data.memberUserIds?.length) {
        for (const uid of data.memberUserIds) {
          await tx.projectMember.create({
            data: { projectId: p.id, userId: uid, projectRole: 'MEMBER' },
          });
        }
      }
      return p;
    });

    // 通知所有 ADMIN
    const admins = await prisma.userRole.findMany({
      where: { role: { code: Role.ADMIN } },
      select: { userId: true },
    });
    for (const a of admins) {
      await prisma.notification.create({
        data: {
          userId: a.userId,
          type: 'PROJECT_APPROVED',
          title: '新项目立项申请',
          content: `${req.user!.username} 提交了项目「${data.name}」的立项申请`,
          link: `/projects/${project.id}`,
        },
      });
    }

    res.status(201).json(success({ id: project.id, code: project.code }, '立项申请已提交'));
  })
);

// ============================================
// 立项申请列表（ADMIN 可看所有，PM/MEMBER 看自己的）
// ============================================
router.get(
  '/applications/list',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = Math.max(1, +(req.query.page || 1));
    const pageSize = Math.min(100, +(req.query.pageSize || 20));
    const status = req.query.status as string | undefined;
    const isAdmin = req.user!.roles.includes(Role.ADMIN);

    const where: any = {};
    if (!isAdmin) where.applicantId = req.user!.userId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.projectApplication.findMany({
        where,
        include: {
          project: {
            select: { id: true, code: true, name: true, priority: true, department: { select: { name: true } } },
          },
          approvals: { orderBy: { step: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.projectApplication.count({ where }),
    ]);

    res.json(success({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }));
  })
);

// ============================================
// 审批立项
// ============================================
const approveSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

router.post(
  '/applications/:id/approve',
  requireRole(Role.ADMIN),
  audit('project', 'approve_application'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const appId = req.params.id as string;
    const { decision, comment } = approveSchema.parse(req.body);

    const application = await prisma.projectApplication.findUnique({
      where: { id: appId },
      include: { project: true },
    });
    if (!application) throw new ApiError(ErrorCodes.NOT_FOUND, '申请不存在', 404);
    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApiError(ErrorCodes.APPLICATION_STATUS_INVALID, '该申请已被处理', 400);
    }

    if (decision === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        await tx.projectApproval.create({
          data: {
            applicationId: appId,
            approverId: req.user!.userId,
            step: 2,
            decision: 'APPROVE',
            comment,
          },
        });
        await tx.projectApplication.update({
          where: { id: appId },
          data: { status: ApplicationStatus.APPROVED, currentStep: 2 },
        });
        await tx.project.update({
          where: { id: application.projectId },
          data: { status: ProjectStatus.APPROVED },
        });
        await tx.projectLog.create({
          data: {
            projectId: application.projectId,
            userId: req.user!.userId,
            action: 'PROJECT_APPROVED',
            message: `项目立项审批通过: ${application.project.name}`,
          },
        });
      });

      // 通知申请人
      await prisma.notification.create({
        data: {
          userId: application.applicantId,
          type: 'PROJECT_APPROVED',
          title: '项目立项已通过',
          content: `项目「${application.project.name}」已通过审批，可以启动`,
          link: `/projects/${application.projectId}`,
        },
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.projectApproval.create({
          data: {
            applicationId: appId,
            approverId: req.user!.userId,
            step: 1,
            decision: 'REJECT',
            comment,
          },
        });
        await tx.projectApplication.update({
          where: { id: appId },
          data: { status: ApplicationStatus.REJECTED },
        });
        await tx.project.update({
          where: { id: application.projectId },
          data: { status: ProjectStatus.REJECTED },
        });
      });

      await prisma.notification.create({
        data: {
          userId: application.applicantId,
          type: 'PROJECT_REJECTED',
          title: '项目立项被驳回',
          content: `项目「${application.project.name}」未通过审批`,
          link: `/projects/${application.projectId}`,
        },
      });
    }

    res.json(success(null, decision === 'APPROVE' ? '审批通过' : '已驳回'));
  })
);

// ============================================
// 启动项目（APPROVED → IN_PROGRESS）
// ============================================
router.post(
  '/:id/start',
  audit('project', 'start'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.id as string } });
    if (!project) throw new ApiError(ErrorCodes.PROJECT_NOT_FOUND, '项目不存在', 404);
    if (project.status !== ProjectStatus.APPROVED) {
      throw new ApiError(ErrorCodes.PROJECT_STATUS_INVALID, '只有已审批的项目才能启动', 400);
    }
    await prisma.project.update({
      where: { id: project.id },
      data: { status: ProjectStatus.IN_PROGRESS, actualStart: new Date() },
    });
    res.json(success(null, '项目已启动'));
  })
);

// ============================================
// 暂停/恢复项目
// ============================================
router.post('/:id/suspend', audit('project', 'suspend'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const p = await prisma.project.findUnique({ where: { id: req.params.id as string } });
  if (p?.status !== ProjectStatus.IN_PROGRESS) throw new ApiError(ErrorCodes.PROJECT_STATUS_INVALID, '只能暂停进行中的项目', 400);
  await prisma.project.update({ where: { id: p.id }, data: { status: ProjectStatus.SUSPENDED } });
  res.json(success(null, '项目已挂起'));
}));

router.post('/:id/resume', audit('project', 'resume'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const p = await prisma.project.findUnique({ where: { id: req.params.id as string } });
  if (p?.status !== ProjectStatus.SUSPENDED) throw new ApiError(ErrorCodes.PROJECT_STATUS_INVALID, '只能恢复已挂起的项目', 400);
  await prisma.project.update({ where: { id: p.id }, data: { status: ProjectStatus.IN_PROGRESS } });
  res.json(success(null, '项目已恢复'));
}));

// ============================================
// 项目成员管理
// ============================================
router.get('/:id/members', asyncHandler(async (req, res) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.id as string },
    include: { user: { select: { id: true, fullName: true, avatar: true, email: true, department: { select: { name: true } } } } },
  });
  res.json(success(members));
}));

const addMemberSchema = z.object({
  userId: z.string(),
  projectRole: z.enum(['PM', 'SUB_LEAD', 'MEMBER', 'OBSERVER']).default('MEMBER'),
  allocation: z.number().min(0).max(100).default(100),
});

router.post('/:id/members', audit('project', 'add_member'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = addMemberSchema.parse(req.body);
  const projectId = req.params.id as string;
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: data.userId } },
  });
  if (existing) throw new ApiError(ErrorCodes.BAD_REQUEST, '该用户已是项目成员', 409);
  const member = await prisma.projectMember.create({
    data: { projectId, userId: data.userId, projectRole: data.projectRole, allocation: data.allocation },
    include: { user: { select: { id: true, fullName: true, avatar: true } } },
  });
  res.status(201).json(success(member, '成员已添加'));
}));

router.delete('/:id/members/:userId', audit('project', 'remove_member'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await prisma.projectMember.deleteMany({
    where: { projectId: req.params.id as string, userId: req.params.userId as string },
  });
  res.json(success(null, '成员已移除'));
}));

// ============================================
// 项目日志
// ============================================
router.get('/:id/logs', asyncHandler(async (req, res) => {
  const logs = await prisma.projectLog.findMany({
    where: { projectId: req.params.id as string },
    include: { user: { select: { id: true, fullName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(success(logs));
}));

// ============================================
// 用户列表（供选择成员使用）
// ============================================
router.get('/users/lookup', asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    select: { id: true, username: true, fullName: true, avatar: true, department: { select: { id: true, name: true } } },
    orderBy: { fullName: 'asc' },
  });
  res.json(success(users));
}));

export default router;
