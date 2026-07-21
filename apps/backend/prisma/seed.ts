/**
 * 数据库种子数据
 * 运行：npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role } from '@plms/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...\n');

  // ============== 1. 权限码 ==============
  console.log('1️⃣  创建权限码...');
  const permissionDefs = [
    // 用户与系统
    { code: 'user:read', module: 'user', action: 'read', name: '查看用户' },
    { code: 'user:create', module: 'user', action: 'create', name: '创建用户' },
    { code: 'user:update', module: 'user', action: 'update', name: '更新用户' },
    { code: 'user:delete', module: 'user', action: 'delete', name: '删除用户' },
    { code: 'user:reset_password', module: 'user', action: 'reset_password', name: '重置密码' },
    { code: 'system:config', module: 'system', action: 'config', name: '系统设置' },
    { code: 'audit:read', module: 'audit', action: 'read', name: '查看审计日志' },

    // 项目
    { code: 'project:read', module: 'project', action: 'read', name: '查看项目' },
    { code: 'project:create', module: 'project', action: 'create', name: '创建项目' },
    { code: 'project:update', module: 'project', action: 'update', name: '编辑项目' },
    { code: 'project:delete', module: 'project', action: 'delete', name: '删除项目' },
    { code: 'project:approve', module: 'project', action: 'approve', name: '审批立项' },
    { code: 'project:close', module: 'project', action: 'close', name: '结项审批' },
    { code: 'project:archive', module: 'project', action: 'archive', name: '项目归档' },

    // 任务
    { code: 'task:read', module: 'task', action: 'read', name: '查看任务' },
    { code: 'task:create', module: 'task', action: 'create', name: '创建任务' },
    { code: 'task:update', module: 'task', action: 'update', name: '编辑任务' },
    { code: 'task:delete', module: 'task', action: 'delete', name: '删除任务' },
    { code: 'task:assign', module: 'task', action: 'assign', name: '分配任务' },

    // 子任务（流程图核心）
    { code: 'subtask:read', module: 'subtask', action: 'read', name: '查看子任务' },
    { code: 'subtask:create', module: 'subtask', action: 'create', name: '创建子任务' },
    { code: 'subtask:claim', module: 'subtask', action: 'claim', name: '领取子任务' },
    { code: 'subtask:upload', module: 'subtask', action: 'upload', name: '上传子任务成果' },
    { code: 'subtask:review', module: 'subtask', action: 'review', name: '审批子任务' },

    // 资源/团队
    { code: 'team:read', module: 'team', action: 'read', name: '查看团队' },
    { code: 'team:assign', module: 'team', action: 'assign', name: '分配成员' },
    { code: 'resource:analyze', module: 'resource', action: 'analyze', name: '资源分析' },

    // 文档
    { code: 'document:read', module: 'document', action: 'read', name: '查看文档' },
    { code: 'document:create', module: 'document', action: 'create', name: '上传文档' },
    { code: 'document:update', module: 'document', action: 'update', name: '编辑文档' },
    { code: 'document:delete', module: 'document', action: 'delete', name: '删除文档' },

    // 风险
    { code: 'risk:read', module: 'risk', action: 'read', name: '查看风险' },
    { code: 'risk:create', module: 'risk', action: 'create', name: '登记风险' },
    { code: 'risk:update', module: 'risk', action: 'update', name: '更新风险' },

    // 预算
    { code: 'budget:read', module: 'budget', action: 'read', name: '查看预算' },
    { code: 'budget:create', module: 'budget', action: 'create', name: '编制预算' },
    { code: 'budget:update', module: 'budget', action: 'update', name: '更新预算' },

    // 统计
    { code: 'dashboard:read', module: 'dashboard', action: 'read', name: '查看仪表盘' },
    { code: 'report:export', module: 'report', action: 'export', name: '导出报表' },
  ];

  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({ where: { code: p.code }, update: {}, create: p })
    )
  );
  console.log(`   ✅ 创建 ${permissions.length} 个权限\n`);

  // ============== 2. 角色 ==============
  console.log('2️⃣  创建角色...');
  const roleDefs = [
    {
      code: Role.ADMIN,
      name: '管理层',
      description: '系统全权：审批立项、用户管理、报表、归档',
      sortOrder: 1,
      permCodes: permissionDefs.map((p) => p.code), // 所有权限
    },
    {
      code: Role.PM,
      name: '项目经理',
      description: '项目创建/编辑、任务分配、子任务审批',
      sortOrder: 2,
      permCodes: [
        'project:read', 'project:create', 'project:update', 'project:close',
        'task:read', 'task:create', 'task:update', 'task:delete', 'task:assign',
        'subtask:read', 'subtask:create', 'subtask:review',
        'team:read', 'team:assign', 'resource:analyze',
        'document:read', 'document:create', 'document:update',
        'risk:read', 'risk:create', 'risk:update',
        'budget:read', 'budget:create', 'budget:update',
        'dashboard:read',
      ],
    },
    {
      code: Role.MEMBER,
      name: '团队成员',
      description: '执行任务、领取子任务、上传成果',
      sortOrder: 3,
      permCodes: [
        'project:read',
        'task:read', 'task:update',
        'subtask:read', 'subtask:claim', 'subtask:upload',
        'document:read', 'document:create',
        'risk:read',
        'budget:read',
        'dashboard:read',
      ],
    },
  ];

  for (const rd of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: rd.code },
      update: { name: rd.name, description: rd.description, sortOrder: rd.sortOrder },
      create: { code: rd.code, name: rd.name, description: rd.description, sortOrder: rd.sortOrder, isSystem: true },
    });
    // 同步权限
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of rd.permCodes) {
      const perm = permissions.find((p) => p.code === code);
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
    console.log(`   ✅ ${rd.name} (${rd.permCodes.length} 项权限)`);
  }

  // ============== 3. 部门 ==============
  console.log('\n3️⃣  创建部门...');
  const deptDefs = [
    { code: 'HQ', name: '公司总部', sortOrder: 1 },
    { code: 'RD', name: '研发部', parent: 'HQ', sortOrder: 2 },
    { code: 'TS', name: '测试部', parent: 'HQ', sortOrder: 3 },
    { code: 'SA', name: '销售部', parent: 'HQ', sortOrder: 4 },
    { code: 'FN', name: '财务部', parent: 'HQ', sortOrder: 5 },
  ];

  const depts: Record<string, { id: string }> = {};
  for (const d of deptDefs) {
    const parent = d.parent ? depts[d.parent] : null;
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, parentId: parent?.id, sortOrder: d.sortOrder },
      create: {
        code: d.code,
        name: d.name,
        parentId: parent?.id,
        sortOrder: d.sortOrder,
      },
    });
    depts[d.code] = dept;
  }
  console.log(`   ✅ 创建 ${deptDefs.length} 个部门`);

  // ============== 4. 用户 ==============
  console.log('\n4️⃣  创建用户...');
  const hash = (pwd: string) => bcrypt.hash(pwd, 10);

  const userDefs = [
    {
      username: 'admin',
      email: 'admin@yuce.local',
      password: 'admin123',
      fullName: '系统管理员',
      dept: 'HQ',
      role: Role.ADMIN,
      phone: '13800000001',
    },
    {
      username: 'pm_zhang',
      email: 'zhang.pm@yuce.local',
      password: 'pm123456',
      fullName: '张经理',
      dept: 'RD',
      role: Role.PM,
      phone: '13800000002',
    },
    {
      username: 'pm_li',
      email: 'li.pm@yuce.local',
      password: 'pm123456',
      fullName: '李经理',
      dept: 'TS',
      role: Role.PM,
      phone: '13800000003',
    },
    {
      username: 'dev_wang',
      email: 'wang.dev@yuce.local',
      password: 'dev123456',
      fullName: '王工',
      dept: 'RD',
      role: Role.MEMBER,
      phone: '13800000004',
    },
    {
      username: 'dev_li',
      email: 'li.dev@yuce.local',
      password: 'dev123456',
      fullName: '李工',
      dept: 'RD',
      role: Role.MEMBER,
      phone: '13800000005',
    },
    {
      username: 'qa_chen',
      email: 'chen.qa@yuce.local',
      password: 'qa123456',
      fullName: '陈工',
      dept: 'TS',
      role: Role.MEMBER,
      phone: '13800000006',
    },
  ];

  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        passwordHash: await hash(u.password),
        departmentId: depts[u.dept].id,
      },
    });
    // 分配角色
    const role = await prisma.role.findUnique({ where: { code: u.role } });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId_projectId: { userId: user.id, roleId: role.id, projectId: '' },
        },
        update: {},
        create: { userId: user.id, roleId: role.id, projectId: null },
      }).catch(() => {
        // 重复时忽略
      });
    }
    console.log(`   ✅ ${u.fullName} (${u.username} / ${u.password}) - ${u.role}`);
  }

  // ============== 5. 示例项目（含子任务流程） ==============
  console.log('\n5️⃣  创建示例项目与子任务...');
  const owner = await prisma.user.findUnique({ where: { username: 'pm_zhang' } });
  const member1 = await prisma.user.findUnique({ where: { username: 'dev_wang' } });
  const member2 = await prisma.user.findUnique({ where: { username: 'dev_li' } });
  if (!owner || !member1 || !member2) throw new Error('示例用户缺失');

  const project = await prisma.project.upsert({
    where: { code: 'YC-2026-RD-0001' },
    update: {},
    create: {
      code: 'YC-2026-RD-0001',
      name: '宇测 PLMS 系统开发',
      description: '搭建公司项目全生命周期管理平台，覆盖立项、任务、文档、风险、成本、结项',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      budget: 800000,
      plannedStart: new Date('2026-07-01'),
      plannedEnd: new Date('2026-12-31'),
      actualStart: new Date('2026-07-01'),
      progress: 35,
      ownerId: owner.id,
      departmentId: depts.RD.id,
    },
  });

  // 成员
  const memberRoles = [
    { user: owner, role: 'PM', allocation: 80 },
    { user: member1, role: 'SUB_LEAD', allocation: 100 },
    { user: member2, role: 'MEMBER', allocation: 100 },
  ];
  for (const mr of memberRoles) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: mr.user.id } },
      update: { projectRole: mr.role, allocation: mr.allocation },
      create: { projectId: project.id, userId: mr.user.id, projectRole: mr.role, allocation: mr.allocation },
    });
  }

  // 任务 + 子任务（流程图核心场景）
  const task1 = await prisma.task.upsert({
    where: { id: 'demo-task-1' },
    update: {},
    create: {
      id: 'demo-task-1',
      projectId: project.id,
      name: '搭建后端框架',
      description: 'Express + Prisma + JWT 鉴权',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progress: 60,
      plannedStart: new Date('2026-07-01'),
      plannedEnd: new Date('2026-07-20'),
      actualStart: new Date('2026-07-01'),
      estimatedHours: 80,
      actualHours: 48,
      sortOrder: 1,
      assigneeId: member1.id,
      ownerId: owner.id,
    },
  });

  // 子任务 1：已审核
  await prisma.subtask.upsert({
    where: { id: 'demo-subtask-1' },
    update: {},
    create: {
      id: 'demo-subtask-1',
      taskId: task1.id,
      name: 'Prisma schema 设计',
      description: '设计 28 张表',
      status: 'APPROVED',
      version: 1,
      ownerId: member1.id,
      claimedAt: new Date('2026-07-02'),
      completedAt: new Date('2026-07-05'),
    },
  });

  // 子任务 2：待审核
  await prisma.subtask.upsert({
    where: { id: 'demo-subtask-2' },
    update: {},
    create: {
      id: 'demo-subtask-2',
      taskId: task1.id,
      name: 'JWT 鉴权中间件',
      description: '实现 JWT + RBAC',
      status: 'UNDER_REVIEW',
      version: 1,
      ownerId: member2.id,
      claimedAt: new Date('2026-07-10'),
    },
  });

  // 子任务 3：未领取
  await prisma.subtask.upsert({
    where: { id: 'demo-subtask-3' },
    update: {},
    create: {
      id: 'demo-subtask-3',
      taskId: task1.id,
      name: 'Swagger 集成',
      description: '自动生成 API 文档',
      status: 'UNCLAIMED',
      version: 1,
      ownerId: member1.id,
    },
  });

  console.log('   ✅ 示例项目与 3 个子任务（覆盖全部状态）');

  // ============== 6. 系统配置 ==============
  console.log('\n6️⃣  初始化系统配置...');
  await prisma.systemConfig.upsert({
    where: { key: 'project_code_format' },
    update: {},
    create: {
      key: 'project_code_format',
      value: { pattern: 'YC-{year}-{dept}-{seq:4}', prefix: 'YC' },
      description: '项目编号生成规则',
    },
  });
  await prisma.systemConfig.upsert({
    where: { key: 'archive_delay_days' },
    update: {},
    create: {
      key: 'archive_delay_days',
      value: { days: 7 },
      description: '结项后到归档的天数',
    },
  });

  console.log('\n🎉 种子数据初始化完成！\n');
  console.log('默认账户：');
  console.log('  管理员 admin / admin123');
  console.log('  项目经理 pm_zhang / pm123456');
  console.log('  团队成员 dev_li / dev123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ 种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
