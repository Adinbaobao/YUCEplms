<template>
  <div class="task-manager">
    <div class="task-toolbar">
      <el-button type="primary" size="small" :icon="Plus" @click="openCreate()">添加任务</el-button>
      <el-button size="small" :icon="Refresh" @click="fetch">刷新</el-button>
    </div>

    <el-table :data="flatList" row-key="id" style="width: 100%" v-loading="loading" size="small" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
      <el-table-column prop="name" label="任务名称" min-width="250">
        <template #default="{ row }">
          <span :style="{ paddingLeft: (row._depth || 0) * 20 + 'px' }">
            {{ row.isMilestone ? '🏁 ' : '' }}{{ row.name }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="assignee" label="负责人" width="100">
        <template #default="{ row }">{{ row.assignee?.fullName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ taskStatusLabels[row.status]?.label || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="140">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" :stroke-width="5" :color="progressColors" />
        </template>
      </el-table-column>
      <el-table-column label="开始" width="100">
        <template #default="{ row }">{{ formatDate(row.plannedStart) }}</template>
      </el-table-column>
      <el-table-column label="截止" width="100">
        <template #default="{ row }">{{ formatDate(row.plannedEnd) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" :icon="Plus" @click="openCreate(row.id)">子任务</el-button>
          <el-popconfirm title="确定删除？" @confirm="deleteTask(row.id)">
            <template #reference><el-button link type="danger" size="small" :icon="Delete" /></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 任务编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="editingTask?.id ? '编辑任务' : '新建任务'" size="420px">
      <el-form :model="taskForm" label-width="80px" size="small">
        <el-form-item label="名称" required><el-input v-model="taskForm.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="taskForm.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="负责人"><el-select v-model="taskForm.assigneeId" filterable clearable><el-option v-for="m in members" :key="m.user.id" :label="m.user.fullName" :value="m.user.id" /></el-select></el-form-item>
        <el-form-item label="优先级"><el-select v-model="taskForm.priority"><el-option v-for="(v,k) in PRIORITY_LABELS" :key="k" :label="v.label" :value="k" /></el-select></el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker v-model="taskDates" type="daterange" range-separator="至" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="预估工时"><el-input-number v-model="taskForm.estimatedHours" :min="0" /></el-form-item>
        <el-form-item label="里程碑"><el-switch v-model="taskForm.isMilestone" /></el-form-item>
        <el-form-item label="进度" v-if="editingTask?.id">
          <el-slider v-model="taskForm.progress" :min="0" :max="100" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">{{ editingTask?.id ? '保存' : '创建' }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api';
import { PRIORITY_LABELS, TASK_STATUS_LABELS, formatDate } from '@plms/shared';
import { ElMessage } from 'element-plus';
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue';

const props = defineProps<{ projectId: string }>();
const tasks = ref<any[]>([]);
const members = ref<any[]>([]);
const loading = ref(false);
const drawerVisible = ref(false);
const saving = ref(false);
const editingTask = ref<any>(null);
const taskForm = ref<any>({ name: '', description: '', priority: 'MEDIUM', progress: 0, isMilestone: false, estimatedHours: 0, assigneeId: '' });
const taskDates = ref<[string, string] | null>(null);
const taskStatusLabels = TASK_STATUS_LABELS;

const progressColors = [{ color: '#ef4444', percentage: 30 }, { color: '#f59e0b', percentage: 70 }, { color: '#10b981', percentage: 100 }];
const statusTag = (s: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => ({ NOT_STARTED: 'info', IN_PROGRESS: 'primary', ON_HOLD: 'warning', COMPLETED: 'success', CANCELED: 'danger' }[s] || 'info') as any;

// 扁平化树形结构
const flattenTree = (nodes: any[], depth = 0): any[] => {
  const result: any[] = [];
  for (const n of nodes) {
    result.push({ ...n, _depth: depth, children: n.children || [] });
    if (n.children?.length) result.push(...flattenTree(n.children, depth + 1));
  }
  return result;
};
const flatList = computed(() => flattenTree(tasks.value));

const fetch = async () => {
  loading.value = true;
  try {
    const [tRes, mRes] = await Promise.all([
      api.get(`/projects/${props.projectId}/wbs`),
      api.get(`/projects/${props.projectId}/members`),
    ]);
    tasks.value = (tRes as any).data || [];
    members.value = (mRes as any).data || [];
  } finally { loading.value = false; }
};

const openCreate = (parentId?: string) => {
  editingTask.value = null;
  taskForm.value = { name: '', description: '', priority: 'MEDIUM', progress: 0, isMilestone: false, estimatedHours: 0, assigneeId: '', parentId: parentId || undefined };
  taskDates.value = null;
  drawerVisible.value = true;
};

const openEdit = (task: any) => {
  editingTask.value = task;
  taskForm.value = { name: task.name, description: task.description, priority: task.priority, progress: task.progress, isMilestone: task.isMilestone, estimatedHours: task.estimatedHours, assigneeId: task.assignee?.id || '' };
  taskDates.value = task.plannedStart ? [formatDate(task.plannedStart), formatDate(task.plannedEnd)] : null;
  drawerVisible.value = true;
};

const saveTask = async () => {
  saving.value = true;
  try {
    const data: any = { ...taskForm.value };
    if (taskDates.value) { data.plannedStart = taskDates.value[0]; data.plannedEnd = taskDates.value[1]; }
    if (editingTask.value?.id) {
      await api.patch(`/tasks/${editingTask.value.id}`, data);
      if (taskForm.value.progress !== editingTask.value.progress) {
        await api.post(`/tasks/${editingTask.value.id}/progress`, { progress: taskForm.value.progress });
      }
    } else {
      await api.post(`/projects/${props.projectId}/tasks`, data);
    }
    ElMessage.success(editingTask.value?.id ? '已更新' : '已创建');
    drawerVisible.value = false;
    fetch();
  } finally { saving.value = false; }
};

const deleteTask = async (id: string) => {
  try {
    await api.delete(`/tasks/${id}`);
    ElMessage.success('已删除');
    fetch();
  } catch { /* 子任务存在时会提示 */ }
};

onMounted(fetch);
</script>

<style scoped>
.task-manager { padding: 8px 0; }
.task-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
