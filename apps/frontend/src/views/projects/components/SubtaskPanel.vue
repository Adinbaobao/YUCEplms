<template>
  <div class="subtask-panel">
    <div class="panel-toolbar">
      <h3>子任务列表</h3>
      <el-button size="small" type="primary" :icon="Plus" @click="openCreate">添加子任务</el-button>
    </div>
    <div v-loading="loading">
      <el-empty v-if="!subtasks.length" description="暂无子任务" />
      <div v-for="s in subtasks" :key="s.id" class="subtask-item" :class="s.status">
        <div class="subtask-left">
          <el-avatar :size="28" :src="s.owner?.avatar">{{ s.owner?.fullName?.[0] }}</el-avatar>
          <div>
            <div class="subtask-name">{{ s.name }}</div>
            <div class="subtask-meta">{{ s.owner?.fullName }} · v{{ s.version }}</div>
          </div>
        </div>
        <div class="subtask-right">
          <el-tag :type="subStatusTag(s.status)" size="small">{{ SUBTASK_STATUS_LABELS[s.status]?.label }}</el-tag>
          <el-button v-if="s.status === 'UNCLAIMED'" size="small" type="primary" @click="claim(s.id)">领取</el-button>
          <el-button v-if="s.status === 'CLAIMED' || s.status === 'REJECTED'" size="small" @click="showUpload(s)">上传成果</el-button>
          <el-button v-if="s.status === 'UPLOADED'" size="small" type="success" @click="submitReview(s.id)">提交审核</el-button>
          <el-dropdown v-if="s.status === 'UNDER_REVIEW'" trigger="click" @command="(c:string) => review(s.id, c)">
            <el-button size="small">审核</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="PASS">✅ 通过</el-dropdown-item>
                <el-dropdown-item command="REJECT">❌ 驳回</el-dropdown-item>
                <el-dropdown-item command="HOLD">⏸️ 暂定</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-if="s.status === 'LOCKED'" size="small" type="warning" @click="relock(s.id)">重新审核</el-button>
        </div>
      </div>
    </div>

    <!-- 创建/上传弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode==='create'?'添加子任务':'上传成果'" width="400px">
      <el-form v-if="dialogMode==='create'" :model="createForm">
        <el-form-item label="名称"><el-input v-model="createForm.name" /></el-form-item>
        <el-form-item label="负责人"><el-select v-model="createForm.ownerId" filterable><el-option v-for="m in members" :key="m.user.id" :label="m.user.fullName" :value="m.user.id" /></el-select></el-form-item>
        <el-form-item label="描述"><el-input v-model="createForm.description" type="textarea" /></el-form-item>
      </el-form>
      <el-input v-else v-model="uploadComment" type="textarea" placeholder="上传说明" />
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="dialogMode==='create' ? doCreate() : doUpload()">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { SUBTASK_STATUS_LABELS } from '@plms/shared';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const props = defineProps<{ projectId: string }>();
const subtasks = ref<any[]>([]);
const members = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'upload'>('create');
const currentSubtaskId = ref('');
const uploadComment = ref('');
const createForm = ref({ name: '', ownerId: '', description: '' });

const subStatusTag = (s: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => ({ UNCLAIMED: 'info', CLAIMED: 'primary', UPLOADED: 'primary', UNDER_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'danger', LOCKED: 'info', COMPLETED: 'success' }[s] || 'info') as any;

const fetch = async () => {
  loading.value = true;
  try {
    const [tRes, mRes] = await Promise.all([
      api.get(`/projects/${props.projectId}/wbs`),
      api.get(`/projects/${props.projectId}/members`),
    ]);
    members.value = (mRes as any).data || [];
    const allSubtasks: any[] = [];
    const collectSubtasks = (nodes: any[]) => {
      nodes.forEach((n: any) => {
        if (n.subtasks) allSubtasks.push(...n.subtasks.map((s: any) => ({ ...s, taskName: n.name })));
        if (n.children) collectSubtasks(n.children);
      });
    };
    collectSubtasks((tRes as any).data || []);
    subtasks.value = allSubtasks;
  } finally { loading.value = false; }
};

const openCreate = () => {
  dialogMode.value = 'create';
  createForm.value = { name: '', ownerId: '', description: '' };
  dialogVisible.value = true;
};

const showUpload = (s: any) => {
  dialogMode.value = 'upload';
  currentSubtaskId.value = s.id;
  uploadComment.value = '';
  dialogVisible.value = true;
};

const doCreate = async () => {
  saving.value = true;
  // 使用第一个任务的 ID；实际应用中应有任务选择器
  const tasks: any = await api.get(`/projects/${props.projectId}/wbs`);
  const firstTaskId = (tasks as any).data?.[0]?.id;
  if (!firstTaskId) { ElMessage.error('请先创建任务'); saving.value = false; return; }
  try {
    await api.post(`/tasks/${firstTaskId}/subtasks`, createForm.value);
    ElMessage.success('子任务已创建');
    dialogVisible.value = false;
    fetch();
  } finally { saving.value = false; }
};

const doUpload = async () => {
  saving.value = true;
  try {
    await api.post(`/subtasks/${currentSubtaskId.value}/upload`, { comment: uploadComment.value });
    ElMessage.success('已上传');
    dialogVisible.value = false;
    fetch();
  } finally { saving.value = false; }
};

const claim = async (id: string) => { await api.post(`/subtasks/${id}/claim`); ElMessage.success('已领取'); fetch(); };
const submitReview = async (id: string) => { await api.post(`/subtasks/${id}/submit-review`); ElMessage.success('已提交审核'); fetch(); };
const review = async (id: string, decision: string) => { await api.post(`/subtasks/${id}/review`, { decision }); ElMessage.success(decision === 'PASS' ? '已通过' : decision === 'REJECT' ? '已驳回' : '已暂定'); fetch(); };
const relock = async (id: string) => { await api.post(`/subtasks/${id}/relock`); ElMessage.success('已重新审核'); fetch(); };

onMounted(fetch);
</script>

<style scoped>
.panel-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-toolbar h3 { margin: 0; font-size: 14px; }
.subtask-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border: 1px solid var(--plms-border); border-radius: 6px; margin-bottom: 8px; }
.subtask-item.UNDER_REVIEW { border-left: 3px solid var(--plms-warning); background: #fefce8; }
.subtask-item.REJECTED { border-left: 3px solid var(--plms-danger); background: #fef2f2; }
.subtask-left { display: flex; align-items: center; gap: 10px; }
.subtask-name { font-size: 13px; font-weight: 600; }
.subtask-meta { font-size: 11px; color: var(--plms-text-muted); }
.subtask-right { display: flex; align-items: center; gap: 8px; }
</style>
