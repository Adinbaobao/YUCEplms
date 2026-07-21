<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0">里程碑</h3>
      <el-button size="small" type="primary" :icon="Plus" @click="showAdd=true">添加</el-button>
    </div>
    <el-timeline v-loading="loading">
      <el-timeline-item
        v-for="m in milestones" :key="m.id"
        :timestamp="formatDate(m.targetDate)"
        placement="top"
        :color="m.status === 'REACHED' ? '#10b981' : '#2563eb'"
      >
        <div style="font-weight:600">{{ m.name }}</div>
        <div style="font-size:12px;color:var(--plms-text-muted)" v-if="m.task">
          关联任务：{{ m.task.name }}
        </div>
      </el-timeline-item>
    </el-timeline>

    <el-dialog v-model="showAdd" title="添加里程碑" width="400px">
      <el-input v-model="newMs.name" placeholder="名称" style="margin-bottom:12px" />
      <el-date-picker v-model="newMs.targetDate" type="date" placeholder="目标日期" style="width:100%" />
      <template #footer><el-button @click="showAdd=false">取消</el-button><el-button type="primary" @click="addMs">添加</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { formatDate } from '@plms/shared';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const props = defineProps<{ projectId: string }>();
const milestones = ref<any[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const newMs = ref({ name: '', targetDate: '' });

const fetch = async () => {
  loading.value = true;
  try { const r: any = await api.get(`/projects/${props.projectId}/milestones`); milestones.value = r.data || []; } finally { loading.value = false; }
};
const addMs = async () => {
  if (!newMs.value.name || !newMs.value.targetDate) return;
  await api.post(`/projects/${props.projectId}/milestones`, newMs.value);
  ElMessage.success('已添加');
  showAdd.value = false;
  fetch();
};
onMounted(fetch);
</script>
