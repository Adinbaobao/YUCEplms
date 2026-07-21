<template>
  <div class="gantt-container">
    <div class="gantt-toolbar">
      <el-button size="small" :icon="Refresh" @click="fetch">刷新</el-button>
      <span class="gantt-legend"><span style="background:#2563eb;width:12px;height:12px;display:inline-block;border-radius:2px"></span> 任务 <span style="background:#10b981;width:12px;height:12px;display:inline-block;border-radius:2px;margin-left:8px"></span> 里程碑</span>
    </div>
    <div ref="ganttEl" class="gantt-chart" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { api } from '@/api';
import Gantt from 'frappe-gantt';
import { Refresh } from '@element-plus/icons-vue';

const props = defineProps<{ projectId: string }>();
const ganttEl = ref<HTMLElement>();
let gantt: any = null;

const fetch = async () => {
  const res: any = await api.get(`/projects/${props.projectId}/gantt`);
  const tasks = (res.data || []).map((t: any, i: number) => ({
    ...t,
    dependencies: t.dependencies?.join(', ') || '',
  }));
  renderGantt(tasks);
};

const renderGantt = (tasks: any[]) => {
  if (gantt) gantt = null;
  if (!ganttEl.value || !tasks.length) return;
  gantt = new Gantt(ganttEl.value, tasks, {
    view_mode: 'Month',
    date_format: 'YYYY-MM-DD',
    bar_height: 24,
    padding: 16,
    on_date_change: () => { /* 拖拽日期后的回调 */ },
    on_click: (task: any) => { console.log('click', task); },
  });
};

watch(() => props.projectId, fetch);
onMounted(fetch);
onBeforeUnmount(() => { gantt = null; });
</script>

<style scoped>
.gantt-container { padding: 8px 0; }
.gantt-toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.gantt-legend { font-size: 12px; color: var(--plms-text-secondary); }
.gantt-chart { overflow-x: auto; min-height: 300px; }
.gantt-chart :deep(.gantt) { font-size: 12px; }
.gantt-chart :deep(.bar-label) { fill: #fff; font-size: 11px; }
.gantt-chart :deep(.bar-progress) { fill: rgba(255,255,255,0.3); }
</style>
