<template>
  <div class="plms-page">
    <div class="page-toolbar">
      <h2>立项审批</h2>
      <el-button :icon="Refresh" @click="fetch">刷新</el-button>
    </div>
    <el-table :data="items" v-loading="loading" size="small">
      <el-table-column prop="project.code" label="编号" width="160" />
      <el-table-column prop="project.name" label="项目名称" min-width="200" />
      <el-table-column prop="project.priority" label="优先级" width="80">
        <template #default="{ row }"><el-tag :type="priorityTag(row.project?.priority)" size="small">{{ row.project?.priority }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="project.department.name" label="部门" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }"><el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="row.status==='PENDING'" size="small" type="success" @click="approve(row.id,'APPROVE')">通过</el-button>
          <el-button v-if="row.status==='PENDING'" size="small" type="danger" @click="approve(row.id,'REJECT')">驳回</el-button>
          <el-button size="small" @click="$router.push(`/projects/${row.projectId}`)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const items = ref<any[]>([]);
const loading = ref(false);

const fetch = async () => {
  loading.value = true;
  try { const r: any = await api.get('/projects/applications/list'); items.value = r.data?.items || []; } finally { loading.value = false; }
};
const priorityTag = (p: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => ({ LOW: 'info', MEDIUM: 'primary', HIGH: 'warning', URGENT: 'danger' }[p] || 'info') as any;
const statusTag = (s: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[s] || 'info') as any;

const approve = async (id: string, decision: string) => {
  const msg = decision === 'APPROVE' ? '通过' : '驳回';
  try {
    await ElMessageBox.prompt(`审批意见（${msg}）`, '审批', { confirmButtonText: `确认${msg}` });
  } catch { return; }
  await api.post(`/projects/applications/${id}/approve`, { decision });
  ElMessage.success(decision === 'APPROVE' ? '审批通过' : '已驳回');
  fetch();
};
onMounted(fetch);
</script>
