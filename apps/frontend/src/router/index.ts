import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { layout: 'blank', public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '工作台', icon: 'Odometer' },
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/views/projects/ProjectListView.vue'),
          meta: { title: '项目列表', icon: 'Folder' },
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: () => import('@/views/projects/ProjectDetailView.vue'),
          meta: { title: '项目详情', hidden: true },
        },
        {
          path: 'applications',
          name: 'applications',
          component: () => import('@/views/projects/ApplicationsView.vue'),
          meta: { title: '立项申请', icon: 'Document', permission: 'project:approve' },
        },
        {
          path: 'subtasks',
          name: 'subtasks',
          component: () => import('@/views/subtasks/SubtaskInboxView.vue'),
          meta: { title: '子任务收件箱', icon: 'Tickets', permission: 'subtask:claim' },
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('@/views/NotificationsView.vue'),
          meta: { title: '消息中心', icon: 'Bell' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { title: '个人中心', hidden: true },
        },
      ],
    },
    { path: '/403', name: '403', component: () => import('@/views/ErrorView.vue'), meta: { layout: 'blank', public: true } },
    { path: '/:pathMatch(.*)*', name: '404', component: () => import('@/views/ErrorView.vue'), meta: { layout: 'blank', public: true } },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    next();
    return;
  }
  if (!auth.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }
  // 权限校验
  const permission = to.meta.permission as string | undefined;
  if (permission && !auth.hasPermission(permission)) {
    ElMessage.warning('您没有访问此页面的权限');
    next({ name: '403' });
    return;
  }
  next();
});

export default router;
