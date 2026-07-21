/** 项目编号规则 */
export const PROJECT_CODE_PREFIX = 'YC';

/** 项目编号格式：YC-{年份}-{部门代码}-{4位序号}，例：YC-2026-RD-0007 */
export const PROJECT_CODE_FORMAT = `${PROJECT_CODE_PREFIX}-{year}-{dept}-{seq}`;

/** 优先级映射：用于显示和排序 */
export const PRIORITY_LABELS: Record<string, { label: string; color: string; order: number }> = {
  LOW: { label: '低', color: '#94a3b8', order: 1 },
  MEDIUM: { label: '中', color: '#3b82f6', order: 2 },
  HIGH: { label: '高', color: '#f59e0b', order: 3 },
  URGENT: { label: '紧急', color: '#ef4444', order: 4 },
};

/** 项目状态映射 */
export const PROJECT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: '#94a3b8' },
  PENDING_REVIEW: { label: '待审批', color: '#f59e0b' },
  APPROVED: { label: '已审批', color: '#10b981' },
  REJECTED: { label: '已驳回', color: '#ef4444' },
  IN_PROGRESS: { label: '进行中', color: '#2563eb' },
  SUSPENDED: { label: '已挂起', color: '#94a3b8' },
  READY_TO_CLOSE: { label: '可结项', color: '#8b5cf6' },
  CLOSING: { label: '结项中', color: '#8b5cf6' },
  CLOSED: { label: '已结项', color: '#10b981' },
  ARCHIVED: { label: '已归档', color: '#64748b' },
  CANCELED: { label: '已取消', color: '#ef4444' },
};

/** 任务状态映射 */
export const TASK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: '未开始', color: '#94a3b8' },
  IN_PROGRESS: { label: '进行中', color: '#2563eb' },
  ON_HOLD: { label: '已挂起', color: '#f59e0b' },
  COMPLETED: { label: '已完成', color: '#10b981' },
  CANCELED: { label: '已取消', color: '#ef4444' },
};

/** 子任务状态映射（流程图核心） */
export const SUBTASK_STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  UNCLAIMED: { label: '未领取', color: '#94a3b8', bgColor: '#f1f5f9' },
  CLAIMED: { label: '已领取', color: '#3b82f6', bgColor: '#dbeafe' },
  UPLOADED: { label: '已上传', color: '#6366f1', bgColor: '#e0e7ff' },
  UNDER_REVIEW: { label: '待审核', color: '#f59e0b', bgColor: '#fef3c7' },
  APPROVED: { label: '已审核', color: '#10b981', bgColor: '#d1fae5' },
  REJECTED: { label: '已驳回', color: '#ef4444', bgColor: '#fee2e2' },
  LOCKED: { label: '已锁定', color: '#8b5cf6', bgColor: '#ede9fe' },
  COMPLETED: { label: '已完成', color: '#059669', bgColor: '#a7f3d0' },
};

/** 风险等级 */
export const RISK_LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '极低', color: '#10b981' },
  2: { label: '低', color: '#84cc16' },
  3: { label: '较低', color: '#eab308' },
  4: { label: '中', color: '#f59e0b' },
  5: { label: '中等', color: '#f97316' },
  6: { label: '较高', color: '#ef4444' },
  7: { label: '高', color: '#dc2626' },
  8: { label: '很高', color: '#b91c1c' },
  9: { label: '极高', color: '#991b1b' },
  10: { label: '灾难', color: '#7f1d1d' },
};

/** 风险等级计算：probability × impact */
export const calculateRiskLevel = (probability: number, impact: number): number => {
  return Math.max(1, Math.min(probability * impact, 25));
};

/** 经验教训分类 */
export const LESSON_CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  WENT_WELL: { label: '做得好的', color: '#10b981', icon: '✅' },
  WENT_POORLY: { label: '做得不好的', color: '#ef4444', icon: '⚠️' },
  IMPROVEMENT: { label: '改进建议', color: '#3b82f6', icon: '💡' },
};

/** UI 色彩 */
export const UI_COLORS = {
  PRIMARY: '#2563eb',         // Logo 蓝
  PRIMARY_LIGHT: '#3b82f6',
  PRIMARY_BG: '#eff6ff',
  ACCENT: '#f59e0b',          // 飞鸟橙
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  TEXT_PRIMARY: '#0f172a',
  TEXT_SECONDARY: '#475569',
  TEXT_MUTED: '#94a3b8',
  BG: '#f8fafc',
  CARD: '#ffffff',
  BORDER: '#e2e8f0',
  GRADIENT: 'linear-gradient(135deg, #2563eb 0%, #f59e0b 100%)',
} as const;

/** 默认分页 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** 上传限制 */
export const MAX_FILE_SIZE_DEFAULT_MB = 100;
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
