<template>
  <div class="plms-page" v-if="project">
    <!-- 项目头部 -->
    <div class="project-header plms-card">
      <div class="header-info">
        <div class="header-top">
          <span class="header-code">{{ project.code }}</span>
          <el-tag :type="statusTag(project.status)">{{ statusLabels[project.status]?.label }}</el-tag>
        </div>
        <h2>{{ project.name }}</h2>
        <div class="header-meta">
          <span><el-icon><User /></el-icon>{{ project.owner?.fullName }}</span>
          <span><el-icon><Calendar /></el-icon>{{ formatDate(project.plannedStart) }} ~ {{ formatDate(project.plannedEnd) }}</span>
          <span><el-icon><DataLine /></el-icon>{{ project.budget ? '¥' + project.budget.toLocaleString() : '-' }}</span>
        </div>
      </div>
      <div class="header-actions" v-if="project.status === 'APPROVED'">
        <el-button type="success" @click="startProject">🚀 启动项目</el-button>
      </div>
    </div>

    <!-- Tab 内容 -->
    <el-tabs v-model="activeTab" type="border-card" class="project-tabs">
      <el-tab-pane label="概览" name="overview">
        <ProjectOverview :project="project" :refresh="refresh" />
      </el-tab-pane>
      <el-tab-pane label="任务 WBS" name="tasks">
        <TaskManager :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane label="甘特图" name="gantt">
        <GanttChart :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane label="子任务" name="subtasks">
        <SubtaskPanel :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane label="成员" name="members">
        <MemberPanel :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane label="里程碑" name="milestones">
        <MilestonePanel :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane label="日志" name="logs">
        <LogTimeline :project-id="project.id" />
      </el-tab-pane>
    </el-tabs>
  </div>
  <div v-else class="plms-page" style="text-align:center;padding-top:100px">
    <el-skeleton :rows="8" animated />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import { PROJECT_STATUS_LABELS, formatDate } from '@plms/shared';
import { ElMessage } from 'element-plus';
import ProjectOverview from './components/ProjectOverview.vue';
import TaskManager from './components/TaskManager.vue';
import GanttChart from './components/GanttChart.vue';
import SubtaskPanel from './components/SubtaskPanel.vue';
import MemberPanel from './components/MemberPanel.vue';
import MilestonePanel from './components/MilestonePanel.vue';
import LogTimeline from './components/LogTimeline.vue';

const route = useRoute();
const project = ref<any>(null);
const activeTab = ref('overview');
const statusLabels = PROJECT_STATUS_LABELS;

const statusTag = (s: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => ({ DRAFT: 'info', PENDING_REVIEW: 'warning', APPROVED: 'success', IN_PROGRESS: 'primary', SUSPENDED: 'warning', REJECTED: 'danger', READY_TO_CLOSE: 'success', CLOSED: 'info', ARCHIVED: 'info', CANCELED: 'danger' }[s] || 'info') as any;

const refresh = async () => {
  const id = route.params.id as string;
  const res: any = await api.get(`/projects/${id}`);
  project.value = res.data;
};

const startProject = async () => {
  await api.post(`/projects/${project.value.id}/start`);
  ElMessage.success('项目已启动');
  refresh();
};

onMounted(refresh);
</script>

<style scoped>
.project-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.header-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.header-code { font-size: 13px; color: var(--plms-text-muted); font-family: monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
.header-info h2 { margin: 0 0 8px; font-size: 22px; }
.header-meta { display: flex; gap: 20px; font-size: 13px; color: var(--plms-text-secondary); flex-wrap: wrap; }
.header-meta span { display: flex; align-items: center; gap: 4px; }
.project-tabs { min-height: 400px; }
</style>
