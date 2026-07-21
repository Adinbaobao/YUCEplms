<template>
  <div class="plms-page">
    <div class="page-toolbar">
      <h2>项目列表</h2>
      <div class="toolbar-actions">
        <el-input v-model="keyword" placeholder="搜索项目名称或编号" clearable :prefix-icon="Search" style="width: 260px" @clear="fetch" @keyup.enter="fetch" />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px" @change="fetch">
          <el-option v-for="(v,k) in statusLabels" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-button :icon="Refresh" @click="fetch">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新建项目</el-button>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div v-if="!loading" class="project-grid">
      <div v-for="p in projects" :key="p.id" class="project-card plms-card" @click="$router.push(`/projects/${p.id}`)">
        <div class="card-top">
          <span class="card-code">{{ p.code }}</span>
          <el-tag :type="priorityTag(p.priority)" size="small">{{ PRIORITY_LABELS[p.priority]?.label }}</el-tag>
        </div>
        <h3 class="card-name">{{ p.name }}</h3>
        <p class="card-desc">{{ p.description || '暂无描述' }}</p>
        <div class="card-meta">
          <span><el-icon><User /></el-icon>{{ p.owner?.fullName }}</span>
          <span><el-icon><Calendar /></el-icon>{{ formatDate(p.plannedEnd) || '未设定' }}</span>
          <span><el-icon><List /></el-icon>{{ p._count?.tasks || 0 }} 任务</span>
        </div>
        <div class="card-progress">
          <el-progress :percentage="p.progress" :stroke-width="6" :color="progressColors" />
          <el-tag :type="statusTag(p.status)" size="small" style="margin-left: 8px">{{ statusLabels[p.status]?.label || p.status }}</el-tag>
        </div>
      </div>
      <el-empty v-if="!projects.length" description="暂无项目" />
    </div>
    <el-skeleton v-else :rows="3" animated />

    <!-- 新建项目弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新建项目" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority">
            <el-option v-for="(v,k) in PRIORITY_LABELS" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算 (¥)">
          <el-input-number v-model="form.expectedBudget" :min="0" :step="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker v-model="planDates" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="form.departmentId" placeholder="选择部门" clearable>
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目成员">
          <el-select v-model="form.memberUserIds" multiple filterable placeholder="选择成员">
            <el-option v-for="u in users" :key="u.id" :label="`${u.fullName} (${u.department?.name || '-'})`" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createProject">提交立项申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, formatDate } from '@plms/shared';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Plus, User, Calendar, List } from '@element-plus/icons-vue';

const projects = ref<any[]>([]);
const loading = ref(true);
const keyword = ref('');
const statusFilter = ref('');
const showCreateDialog = ref(false);
const creating = ref(false);
const formRef = ref();
const departments = ref<any[]>([]);
const users = ref<any[]>([]);

const statusLabels: Record<string, { label: string }> = PROJECT_STATUS_LABELS;

const planDates = ref<[string, string] | null>(null);
const form = ref({
  name: '',
  description: '',
  priority: 'MEDIUM',
  expectedBudget: 0,
  departmentId: '',
  memberUserIds: [] as string[],
});
const rules = { name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] };

const priorityTag = (p: string) => ({ LOW: 'info', MEDIUM: 'primary', HIGH: 'warning', URGENT: 'danger' }[p] || 'info');
const statusTag = (s: string) => ({ DRAFT: 'info', APPROVED: 'success', IN_PROGRESS: 'primary', SUSPENDED: 'warning', REJECTED: 'danger', CLOSED: 'success' }[s] || 'info');
const progressColors = [{ color: '#ef4444', percentage: 30 }, { color: '#f59e0b', percentage: 70 }, { color: '#10b981', percentage: 100 }];

const fetch = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (keyword.value) params.keyword = keyword.value;
    if (statusFilter.value) params.status = statusFilter.value;
    const res: any = await api.get('/projects', { params });
    projects.value = res.data?.items || [];
  } finally { loading.value = false; }
};

const loadMeta = async () => {
  const [deptRes, userRes] = await Promise.all([
    api.get('/departments'),
    api.get('/projects/users/lookup'),
  ]);
  departments.value = (deptRes as any).data || [];
  users.value = (userRes as any).data || [];
};

const createProject = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    creating.value = true;
    const data: any = { ...form.value };
    if (planDates.value) {
      data.expectedStart = planDates.value[0];
      data.expectedEnd = planDates.value[1];
    }
    await api.post('/projects/applications', data);
    ElMessage.success('立项申请已提交');
    showCreateDialog.value = false;
    fetch();
  } finally { creating.value = false; }
};

onMounted(() => { fetch(); loadMeta(); });
</script>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.page-toolbar h2 { margin: 0; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.project-card { cursor: pointer; }
.project-card:hover { border-color: var(--plms-primary); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-code { font-size: 12px; color: var(--plms-text-muted); font-family: monospace; }
.card-name { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
.card-desc { font-size: 13px; color: var(--plms-text-secondary); margin: 0 0 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-meta { display: flex; gap: 16px; font-size: 12px; color: var(--plms-text-secondary); margin-bottom: 12px; flex-wrap: wrap; }
.card-meta span { display: flex; align-items: center; gap: 4px; }
.card-progress { display: flex; align-items: center; }
.card-progress .el-progress { flex: 1; }
</style>
