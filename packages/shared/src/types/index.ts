/** 通用分页请求参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 通用分页响应 */
export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API 统一响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  traceId?: string;
}

/** 登录响应 */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

/** 用户基本信息 */
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  status: string;
  roles: string[];
  permissions: string[];
  department?: { id: string; name: string };
}

/** 项目信息 */
export interface ProjectInfo {
  id: string;
  code: string;
  name: string;
  description?: string;
  priority: string;
  status: string;
  budget: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  owner: { id: string; fullName: string; avatar?: string };
  department?: { id: string; name: string };
  createdAt: string;
}

/** 任务信息 */
export interface TaskInfo {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedHours?: number;
  actualHours?: number;
  isMilestone: boolean;
  assignee?: { id: string; fullName: string; avatar?: string };
  owner?: { id: string; fullName: string; avatar?: string };
  sortOrder: number;
  createdAt: string;
}

/** 子任务信息 */
export interface SubtaskInfo {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  owner: { id: string; fullName: string; avatar?: string };
  claimedAt?: string;
  completedAt?: string;
  lastReviewComment?: string;
  createdAt: string;
}

/** 通知信息 */
export interface NotificationInfo {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}
