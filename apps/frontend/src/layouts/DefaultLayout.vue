<template>
  <div class="default-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="logo-area">
        <div class="logo-icon">
          <el-icon :size="24" color="#fff"><DataAnalysis /></el-icon>
        </div>
        <transition name="fade">
          <div v-show="!collapsed" class="logo-text">
            <div class="logo-name plms-gradient-text">宇测 PLMS</div>
            <div class="logo-sub">项目全生命周期管理</div>
          </div>
        </transition>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item
            v-if="!route.meta?.hidden && hasAccess(route)"
            :index="route.path"
          >
            <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>

      <div class="sidebar-footer">
        <el-button
          :icon="collapsed ? Expand : Fold"
          text
          @click="collapsed = !collapsed"
          style="color: #cbd5e1; width: 100%"
        >
          {{ collapsed ? '' : '收起菜单' }}
        </el-button>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main-container">
      <!-- 顶栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <el-badge :value="unreadCount" :hidden="!unreadCount" :max="99">
            <el-button :icon="Bell" circle @click="goNotifications" />
          </el-badge>

          <el-dropdown trigger="click" @command="onUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="auth.user?.avatar">
                {{ auth.user?.fullName?.[0] || 'U' }}
              </el-avatar>
              <div class="user-detail">
                <div class="user-name">{{ auth.user?.fullName || '未登录' }}</div>
                <div class="user-role">{{ roleLabel }}</div>
              </div>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="changePassword">
                  <el-icon><Key /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容 -->
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="pwdDialogVisible" title="修改密码" width="420px">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitChangePassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { notificationApi } from '@/api/dashboard';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Bell, CaretBottom, DataAnalysis, User, Key, SwitchButton, Fold, Expand,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const collapsed = ref(false);
const unreadCount = ref(0);
const pwdDialogVisible = ref(false);
const pwdLoading = ref(false);
const pwdFormRef = ref();
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_r: any, v: string, cb: any) => {
        if (v !== pwdForm.value.newPassword) cb(new Error('两次密码不一致'));
        else cb();
      },
      trigger: 'blur',
    },
  ],
};

const menuRoutes = computed(() => {
  const main = router.options.routes.find((r) => r.path === '/');
  return main?.children || [];
});

const activeMenu = computed(() => {
  // 匹配最长前缀
  const matched = menuRoutes.value.filter((r) => route.path.startsWith(r.path));
  return matched.length ? matched[matched.length - 1].path : route.path;
});

const roleLabel = computed(() => {
  const r = auth.roles[0];
  return { ADMIN: '管理层', PM: '项目经理', MEMBER: '团队成员' }[r as string] || r;
});

const hasAccess = (r: any) => {
  const p = r.meta?.permission;
  if (!p) return true;
  return auth.hasPermission(p);
};

const goNotifications = () => router.push('/notifications');

const onUserCommand = async (cmd: string) => {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' });
    auth.logout();
    router.push('/login');
  } else if (cmd === 'profile') {
    router.push('/profile');
  } else if (cmd === 'changePassword') {
    pwdDialogVisible.value = true;
  }
};

const submitChangePassword = async () => {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate();
  pwdLoading.value = true;
  try {
    await auth.changePassword(pwdForm.value.oldPassword, pwdForm.value.newPassword);
    ElMessage.success('密码修改成功');
    pwdDialogVisible.value = false;
  } finally {
    pwdLoading.value = false;
  }
};

const fetchUnread = async () => {
  try {
    const res = await notificationApi.unreadCount();
    unreadCount.value = (res as any).count;
  } catch {}
};

onMounted(() => {
  fetchUnread();
  // 每 60s 轮询
  setInterval(fetchUnread, 60000);
});
</script>

<style scoped lang="scss">
.default-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  &.collapsed { width: 64px; }
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  height: 64px;
}
.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--plms-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-text { line-height: 1.2; }
.logo-name { font-size: 16px; font-weight: 700; }
.logo-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.sidebar-menu {
  flex: 1;
  border: none;
  background: transparent !important;
  :deep(.el-menu-item) {
    margin: 4px 8px;
    border-radius: 6px;
    height: 40px;
    line-height: 40px;
    &:hover { background: rgba(255, 255, 255, 0.06) !important; }
    &.is-active {
      background: var(--plms-gradient) !important;
      color: #fff !important;
    }
  }
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--plms-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.topbar-left { display: flex; align-items: center; }
.topbar-right { display: flex; align-items: center; gap: 16px; }

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  &:hover { background: var(--plms-primary-bg); }
}
.user-detail { line-height: 1.2; }
.user-name { font-size: 13px; font-weight: 600; }
.user-role { font-size: 11px; color: var(--plms-text-muted); }

.content {
  flex: 1;
  overflow: auto;
  background: var(--plms-bg);
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

// 移动端
@media (max-width: 768px) {
  .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 100; box-shadow: 2px 0 8px rgba(0,0,0,0.15); }
  .sidebar.collapsed { left: -64px; }
  .topbar { padding: 0 12px; }
  .user-detail { display: none; }
}
</style>
