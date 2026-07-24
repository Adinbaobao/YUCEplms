<template>
  <div class="plms-page">
    <div class="plms-card">
      <div class="card-header">
        <h2>消息中心</h2>
        <el-button :disabled="!unreadCount" @click="markAllRead">全部已读</el-button>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`全部 (${items.length})`" name="all" />
        <el-tab-pane :label="`未读 (${unreadCount})`" name="unread" />
      </el-tabs>
      <el-empty v-if="!items.length" description="暂无消息" />
      <div v-else class="notification-list">
        <div
          v-for="n in items"
          :key="n.id"
          class="notification-item"
          :class="{ unread: !n.readAt }"
          @click="markRead(n)"
          <el-icon :size="20" :color="n.readAt ? '#94a3b8' : '#2563eb'"><Bell /></el-icon>
          <div class="notification-body">
            <div class="notification-title">{{ n.title }}</div>
            <div class="notification-content">{{ n.content }}</div>
            <div class="notification-time">{{ formatDateTime(n.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { notificationApi } from '@/api/dashboard';
import { formatDateTime } from '@plms/shared';
import { Bell } from '@element-plus/icons-vue';

const items = ref<any[]>([]);
const activeTab = ref('all');
const unreadCount = computed(() => items.value.filter((n) => !n.readAt).length);

const fetch = async () => {
  const res = await notificationApi.list({ page: 1, pageSize: 50, unread: activeTab.value === 'unread' });
  items.value = (res as any).data?.items || [];
};

const markAllRead = async () => {
  await notificationApi.markRead();
  await fetch();
};

const markRead = async (n: any) => {
  if (n.readAt) return;
  await notificationApi.markRead([n.id]);
  n.readAt = new Date().toISOString();
};

watch(activeTab, fetch);
onMounted(fetch);
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.notification-list { display: flex; flex-direction: column; gap: 8px; }
.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--plms-border);
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--plms-primary); background: var(--plms-primary-bg); }
  &.unread { border-left: 3px solid var(--plms-primary); background: #fafbff; }
}
.notification-body { flex: 1; }
.notification-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.notification-content { color: var(--plms-text-secondary); font-size: 13px; margin-bottom: 4px; }
.notification-time { color: var(--plms-text-muted); font-size: 12px; }
</style>
