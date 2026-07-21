// ============================================
// 用户与权限枚举
// ============================================

/** 系统级角色 */
export enum Role {
  /** 管理层（行政 + 财务 + 系统管理） */
  ADMIN = 'ADMIN',
  /** 项目经理 */
  PM = 'PM',
  /** 团队成员（含子项目负责人） */
  MEMBER = 'MEMBER',
}

/** 项目级角色 */
export enum ProjectRole {
  /** 项目所有者 */
  OWNER = 'OWNER',
  /** 项目经理 */
  PM = 'PM',
  /** 子项目负责人 */
  SUB_LEAD = 'SUB_LEAD',
  /** 团队成员 */
  MEMBER = 'MEMBER',
  /** 项目观察者（只读） */
  OBSERVER = 'OBSERVER',
}

/** 用户状态 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

// ============================================
// 项目枚举
// ============================================

/** 项目状态机 */
export enum ProjectStatus {
  /** 草稿 */
  DRAFT = 'DRAFT',
  /** 待审批 */
  PENDING_REVIEW = 'PENDING_REVIEW',
  /** 已审批通过 */
  APPROVED = 'APPROVED',
  /** 已驳回 */
  REJECTED = 'REJECTED',
  /** 进行中 */
  IN_PROGRESS = 'IN_PROGRESS',
  /** 挂起 */
  SUSPENDED = 'SUSPENDED',
  /** 可结项（系统自动判定） */
  READY_TO_CLOSE = 'READY_TO_CLOSE',
  /** 结项中 */
  CLOSING = 'CLOSING',
  /** 已结项 */
  CLOSED = 'CLOSED',
  /** 已归档 */
  ARCHIVED = 'ARCHIVED',
  /** 已取消 */
  CANCELED = 'CANCELED',
}

/** 项目优先级 */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/** 立项申请状态 */
export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVING = 'APPROVING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

/** 审批决策 */
export enum ApprovalDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  HOLD = 'HOLD',
}

// ============================================
// 任务枚举
// ============================================

/** 任务状态 */
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

/** 任务依赖类型 */
export enum DependencyType {
  /** 完成-开始 (Finish-to-Start) */
  FS = 'FS',
  /** 开始-开始 (Start-to-Start) */
  SS = 'SS',
  /** 完成-完成 (Finish-to-Finish) */
  FF = 'FF',
  /** 开始-完成 (Start-to-Finish) */
  SF = 'SF',
}

// ============================================
// 子任务枚举（流程图核心）
// ============================================

/** 子任务状态机 */
export enum SubtaskStatus {
  /** 未领取 */
  UNCLAIMED = 'UNCLAIMED',
  /** 已领取 */
  CLAIMED = 'CLAIMED',
  /** 已上传 */
  UPLOADED = 'UPLOADED',
  /** 待审核 */
  UNDER_REVIEW = 'UNDER_REVIEW',
  /** 已审核通过 */
  APPROVED = 'APPROVED',
  /** 已驳回 */
  REJECTED = 'REJECTED',
  /** 暂定/已锁定 */
  LOCKED = 'LOCKED',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
}

/** 子任务审批决策 */
export enum ReviewDecision {
  /** 通过 */
  PASS = 'PASS',
  /** 驳回 */
  REJECT = 'REJECT',
  /** 暂定 */
  HOLD = 'HOLD',
  /** 重新审核 */
  RELOCK = 'RELOCK',
}

// ============================================
// 资源与文档枚举
// ============================================

/** 文档类型 */
export enum DocumentType {
  FOLDER = 'FOLDER',
  FILE = 'FILE',
  LINK = 'LINK',
}

/** 文档分类 */
export enum DocumentCategory {
  PROPOSAL = 'PROPOSAL',          // 方案
  REQUIREMENT = 'REQUIREMENT',    // 需求
  DESIGN = 'DESIGN',              // 设计
  REPORT = 'REPORT',              // 报告
  CONTRACT = 'CONTRACT',          // 合同
  OTHER = 'OTHER',
}

/** 主体类型（用于权限） */
export enum PrincipalType {
  USER = 'USER',
  ROLE = 'ROLE',
  DEPARTMENT = 'DEPARTMENT',
  PROJECT_ALL = 'PROJECT_ALL',
}

// ============================================
// 风险与问题枚举
// ============================================

/** 风险状态 */
export enum RiskStatus {
  IDENTIFIED = 'IDENTIFIED',
  ANALYZED = 'ANALYZED',
  MITIGATING = 'MITIGATING',
  REALIZED = 'REALIZED',
  CLOSED = 'CLOSED',
}

/** 问题工单状态 */
export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** 问题类型 */
export enum IssueType {
  BUG = 'BUG',
  CHANGE = 'CHANGE',
  BLOCKER = 'BLOCKER',
  QUESTION = 'QUESTION',
  OTHER = 'OTHER',
}

// ============================================
// 成本与结项枚举
// ============================================

/** 预算分类 */
export enum BudgetCategory {
  LABOR = 'LABOR',        // 人工
  MATERIAL = 'MATERIAL',  // 材料
  SERVICE = 'SERVICE',    // 服务
  EQUIPMENT = 'EQUIPMENT',// 设备
  TRAVEL = 'TRAVEL',      // 差旅
  OTHER = 'OTHER',
}

/** 结项状态 */
export enum ClosureStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** 经验教训分类 */
export enum LessonCategory {
  WENT_WELL = 'WENT_WELL',           // 做得好的
  WENT_POORLY = 'WENT_POORLY',       // 做得不好的
  IMPROVEMENT = 'IMPROVEMENT',       // 改进建议
}

// ============================================
// 通知枚举
// ============================================

/** 通知类型 */
export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  SUBTASK_ASSIGNED = 'SUBTASK_ASSIGNED',
  SUBTASK_REJECTED = 'SUBTASK_REJECTED',
  SUBTASK_APPROVED = 'SUBTASK_APPROVED',
  SUBTASK_LOCKED = 'SUBTASK_LOCKED',
  PROJECT_APPROVED = 'PROJECT_APPROVED',
  PROJECT_REJECTED = 'PROJECT_REJECTED',
  PROJECT_CLOSURE = 'PROJECT_CLOSURE',
  PROJECT_READY_TO_CLOSE = 'PROJECT_READY_TO_CLOSE',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}

// ============================================
// 通用枚举
// ============================================

/** 存储类型 */
export enum StorageType {
  LOCAL = 'LOCAL',
  S3 = 'S3',
}

/** 审批级别（多级审批） */
export enum ApprovalStep {
  /** 部门负责人审批 */
  DEPT_LEAD = 1,
  /** 管理层审批 */
  MANAGEMENT = 2,
  /** 财务审批（仅大额） */
  FINANCE = 3,
}
