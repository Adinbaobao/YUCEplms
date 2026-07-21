<template>
  <div v-loading="loading">
    <el-timeline>
      <el-timeline-item
        v-for="l in logs" :key="l.id"
        :timestamp="formatDateTime(l.createdAt)"
        placement="top"
        type="primary"
      >
        <div style="font-size:13px">{{ l.message || l.action }}</div>
        <div style="font-size:11px;color:var(--plms-text-muted)">{{ l.user?.fullName }}</div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="!logs.length && !loading" description="暂无操作记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { formatDateTime } from '@plms/shared';
const props = defineProps<{ projectId: string }>();
const logs = ref<any[]>([]);
const loading = ref(false);
const fetch = async () => {
  loading.value = true;
  try { const r: any = await api.get(`/projects/${props.projectId}/logs`); logs.value = r.data || []; } finally { loading.value = false; }
};
onMounted(fetch);
</script>
