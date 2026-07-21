/** 生成项目编号 */
export const generateProjectCode = (year: number, deptCode: string, seq: number): string => {
  const paddedSeq = String(seq).padStart(4, '0');
  return `YC-${year}-${deptCode.toUpperCase()}-${paddedSeq}`;
};

/** 格式化日期 YYYY-MM-DD */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

/** 格式化日期时间 YYYY-MM-DD HH:mm */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 计算天数差 */
export const daysBetween = (start: Date | string, end: Date | string): number => {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  const diff = e.getTime() - s.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/** 格式化金额（人民币） */
export const formatCurrency = (amount: number | null | undefined, withSymbol = true): string => {
  if (amount === null || amount === undefined) return withSymbol ? '¥0.00' : '0.00';
  const formatted = amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withSymbol ? `¥${formatted}` : formatted;
};

/** 格式化百分比 */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/** 是否逾期 */
export const isOverdue = (dueDate: Date | string | null | undefined): boolean => {
  if (!dueDate) return false;
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return d.getTime() < Date.now();
};

/** 脱敏手机号 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
};

/** 响应式断点 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1920,
} as const;

/** 检测是否为移动端 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.sm;
};
