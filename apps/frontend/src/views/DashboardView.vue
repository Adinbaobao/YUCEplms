<template>
  <div class="plms-page">
    <!-- 欢迎条 -->
    <div class="welcome-bar plms-card">
      <div>
        <h1 class="welcome-title">
          你好，{{ auth.user?.fullName }}
          <span class="welcome-wave">👋</span>
        </h1>
        <p class="welcome-sub">
          {{ greeting }} · 今天是 {{ today }} ·
          <span v-if="auth.isAdmin">您拥有系统全部权限</span>
          <span v-else-if="auth.isPM">您是项目经理</span>
          <span v-else>您是团队成员</span>
        </p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" :icon="Plus" @click="$router.push('/projects')">查看项目</el-button>
        <el-button :icon="Document" @click="$router.push('/subtasks')">我的任务</el-button>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="12" :md="6" v-for="kpi in kpis" :key="kpi.label">
        <div class="kpi-card plms-card" :style="{ '--kpi-color': kpi.color }" @click="$router.push(kpi.to)">
          <div class="kpi-icon" :style="{ background: kpi.bg }">
            <el-icon :size="24" :color="kpi.color"><component :is="kpi.icon" /></el-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ kpi.value }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- 左侧：进行中项目 -->
      <el-col :xs="24" :md="14">
        <div class="plms-card">
          <div class="card-header">
            <h3>进行中的项目</h3>
            <el-button text type="primary" @click="$router.push('/projects')">
              全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="loading.projects" class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
          <el-empty v-else-if="!projects.length" description="暂无进行中的项目" :image-size="80" />
          <div v-else class="project-list">
            <div
              v-for="p in projects.slice(0, 5)"
              :key="p.id"
              class="project-item"
              @click="$router.push(`/projects/${p.id}`)"
            >
              <div class="project-header">
                <span class="project-code">{{ p.code }}</span>
                <el-tag size="small" :type="priorityType(p.priority)">{{ priorityLabel(p.priority) }}</el-tag>
              </div>
              <div class="project-name">{{ p.name }}</div>
              <div class="project-meta">
                <span><el-icon><User /></el-icon> {{ p.owner?.fullName }}</span>
                <span><el-icon><Calendar /></el-icon> {{ formatDate(p.plannedEnd) }} 截止</span>
              </div>
              <el-progress
                :percentage="p.progress || 0"
                :stroke-width="6"
                :color="progressColor"
              />
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：即将到期 + 流程图业务预览 -->
      <el-col :xs="24" :md="10">
        <div class="plms-card" style="margin-bottom: 16px">
          <div class="card-header">
            <h3>即将到期的里程碑</h3>
          </div>
          <el-empty v-if="!overview.upcomingMilestones?.length" description="近期无里程碑" :image-size="60" />
          <div v-else class="milestone-list">
            <div v-for="m in overview.upcomingMilestones" :key="m.id" class="milestone-item">
              <el-icon class="milestone-icon"><Flag /></el-icon>
              <div class="milestone-info">
                <div class="milestone-name">{{ m.name }}</div>
                <div class="milestone-meta">
                  <el-tag size="small">{{ m.project?.code }}</el-tag>
                  <span>{{ formatDate(m.targetDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="plms-card workflow-preview">
          <div class="card-header">
            <h3>子任务流程（流程图业务）</h3>
            <el-button text type="primary" @click="$router.push('/subtasks')">
              详情 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="workflow-flow">
            <div class="wf-step" data-status="UNCLAIMED">
              <div class="wf-dot" style="background: #94a3b8"></div>
              <div class="wf-label">未领取</div>
            </div>
            <el-icon class="wf-arrow"><Right /></el-icon>
            <div class="wf-step" data-status="CLAIMED">
              <div class="wf-dot" style="background: #3b82f6"></div>
              <div class="wf-label">已领取</div>
            </div>
            <el-icon class="wf-arrow"><Right /></el-icon>
            <div class="wf-step" data-status="UNDER_REVIEW">
              <div class="wf-dot" style="background: #f59e0b"></div>
              <div class="wf-label">待审核</div>
            </div>
            <el-icon class="wf-arrow"><Right /></el-icon>
            <div class="wf-step" data-status="APPROVED">
              <div class="wf-dot" style="background: #10b981"></div>
              <div class="wf-label">已审核</div>
            </div>
          </div>
          <el-alert type="info" :closable="false" show-icon style="margin-top: 12px">
            <template #title>
              <span style="font-size: 12px">
                状态机：领取 → 上传 → 审核（通过/驳回/暂定）→ 归档
              </span>
            </template>
          </el-alert>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, markRaw } from 'vue';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import { dashboardApi, projectApi } from '@/api/dashboard';
import { PRIORITY_LABELS, SUBTASK_STATUS_LABELS, formatDate as fmtDate } from '@plms/shared';
import {
  Folder, Document, Bell, Plus, ArrowRight, User, Calendar, Flag, Right,
  DataLine, Money, List, Notification,
} from '@element-plus/icons-vue';

const auth = useAuthStore();
const loading = ref({ kpi: true, projects: true });

const overview = ref<any>({ kpi: {}, upcomingMilestones: [] });
const projects = ref<any[]>([]);

const today = dayjs().format('YYYY年MM月DD日 dddd');
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const kpis = computed(() => [
  {
    label: '进行中项目', value: overview.value.kpi.activeProjects ?? '-',
    icon: markRaw(Folder), color: '#2563eb', bg: '#eff6ff', to: '/projects',
  },
  {
    label: '待我审批', value: overview.value.kpi.pendingApprovals ?? '-',
    icon: markRaw(Document), color: '#f59e0b', bg: '#fef3c7', to: '/applications',
  },
  {
    label: '我的子任务', value: overview.value.kpi.myPendingTasks ?? '-',
    icon: markRaw(List), color: '#10b981', bg: '#d1fae5', to: '/subtasks',
  },
  {
    label: '未读消息', value: overview.value.kpi.unreadNotifications ?? '-',
    icon: markRaw(Notification), color: '#8b5cf6', bg: '#ede9fe', to: '/notifications',
  },
]);

const priorityType = (p: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => ({ LOW: 'info', MEDIUM: 'primary', HIGH: 'warning', URGENT: 'danger' }[p] || 'info') as any;
const priorityLabel = (p: string) => PRIORITY_LABELS[p]?.label || p;
const formatDate = (d: string) => fmtDate(d);
const progressColor = [
  { color: '#ef4444', percentage: 30 },
  { color: '#f59e0b', percentage: 70 },
  { color: '#10b981', percentage: 100 },
];

const fetchData = async () => {
  loading.value = { kpi: true, projects: true };
  try {
    const [ov, pj] = await Promise.all([dashboardApi.overview(), projectApi.list()]);
    overview.value = (ov as any).data || { kpi: {}, upcomingMilestones: [] };
    projects.value = ((pj as any).data?.items || []).filter((p: any) => p.status === 'IN_PROGRESS');
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = { kpi: false, projects: false };
  }
};

onMounted(fetchData);
</script>

<style scoped lang="scss">
.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background: linear-gradient(120deg, #fff 60%, var(--plms-primary-bg) 100%);
}
.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--plms-text-primary);
}
.welcome-sub {
  color: var(--plms-text-secondary);
  margin: 0;
  font-size: 14px;
}
.welcome-actions { display: flex; gap: 12px; }

.kpi-row { margin: 0 -8px; }
.kpi-row > * { padding: 0 8px; }
.kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  &:hover { transform: translateY(-2px); transition: all 0.2s; }
}
.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-value { font-size: 28px; font-weight: 700; color: var(--kpi-color, var(--plms-text-primary)); }
.kpi-label { font-size: 13px; color: var(--plms-text-secondary); margin-top: 4px; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
}

.project-list { display: flex; flex-direction: column; gap: 12px; }
.project-item {
  padding: 12px;
  border: 1px solid var(--plms-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--plms-primary); background: var(--plms-primary-bg); }
}
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.project-code { font-size: 12px; color: var(--plms-text-muted); font-family: monospace; }
.project-name { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.project-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--plms-text-secondary);
  margin-bottom: 8px;
  span { display: flex; align-items: center; gap: 4px; }
  .el-icon { font-size: 14px; }
}

.milestone-list { display: flex; flex-direction: column; gap: 8px; }
.milestone-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  &:hover { background: var(--plms-primary-bg); }
}
.milestone-icon { color: var(--plms-accent); font-size: 20px; }
.milestone-name { font-size: 13px; font-weight: 600; }
.milestone-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--plms-text-muted); margin-top: 4px; }

.workflow-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  flex-wrap: wrap;
  gap: 8px;
}
.wf-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 60px;
}
.wf-dot { width: 16px; height: 16px; border-radius: 50%; margin-bottom: 6px; }
.wf-label { font-size: 11px; color: var(--plms-text-secondary); text-align: center; }
.wf-arrow { color: var(--plms-text-muted); }

.loading-state { padding: 12px 0; }
</style>
