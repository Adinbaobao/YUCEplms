/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  traceId?: string;
}

export class ApiError extends Error {
  public readonly code: number;
  public readonly statusCode: number;
  public readonly data?: unknown;

  constructor(code: number, message: string, statusCode = 400, data?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const success = <T>(data?: T, message = 'OK'): ApiResponse<T> => ({
  code: 0,
  message,
  data,
});

export const error = (code: number, message: string, data?: unknown): ApiResponse => ({
  code,
  message,
  data,
});

// 错误码规范（4 位数字）
export const ErrorCodes = {
  // 1000 通用
  BAD_REQUEST: 1000,
  UNAUTHORIZED: 1001,
  FORBIDDEN: 1002,
  NOT_FOUND: 1003,
  METHOD_NOT_ALLOWED: 1004,
  INTERNAL_ERROR: 1005,
  VALIDATION_ERROR: 1006,
  RATE_LIMITED: 1007,

  // 2000 用户/认证
  INVALID_CREDENTIALS: 2001,
  TOKEN_EXPIRED: 2002,
  TOKEN_INVALID: 2003,
  USER_DISABLED: 2004,
  USER_EXISTS: 2005,
  PASSWORD_WEAK: 2006,

  // 3000 项目
  PROJECT_NOT_FOUND: 3001,
  PROJECT_CODE_DUPLICATE: 3002,
  PROJECT_STATUS_INVALID: 3003,
  APPLICATION_STATUS_INVALID: 3004,
  NOT_PROJECT_MEMBER: 3005,

  // 4000 任务
  TASK_NOT_FOUND: 4001,
  TASK_DEPENDENCY_CYCLE: 4002,
  SUBTASK_NOT_FOUND: 4101,
  SUBTASK_STATUS_INVALID: 4102,
  SUBTASK_NOT_OWNER: 4103,
  STATE_MACHINE_INVALID: 4104,

  // 5000 文档
  DOCUMENT_NOT_FOUND: 5001,
  DOCUMENT_PERMISSION_DENIED: 5002,
  FILE_TOO_LARGE: 5003,
  FILE_TYPE_INVALID: 5004,

  // 6000 风险
  RISK_NOT_FOUND: 6001,

  // 7000 预算
  BUDGET_NOT_FOUND: 7001,
  BUDGET_EXCEEDED: 7002,

  // 8000 通知
  NOTIFICATION_NOT_FOUND: 8001,

  // 9000 文件
  FILE_UPLOAD_FAILED: 9001,
} as const;
