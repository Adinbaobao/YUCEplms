import { api } from './index';

export const dashboardApi = {
  overview: () =>
    api.get<{
      kpi: {
        activeProjects: number;
        pendingApprovals: number;
        myPendingTasks: number;
        unreadNotifications: number;
      };
      upcomingMilestones: any[];
    }>('/dashboard/overview'),
};

export const notificationApi = {
  list: (params: { page?: number; pageSize?: number; unread?: boolean }) =>
    api.get('/notifications', { params }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (ids?: string[]) => api.post('/notifications/read', { ids }),
};

export const projectApi = {
  list: () => api.get('/projects'),
  detail: (id: string) => api.get(`/projects/${id}`),
};
