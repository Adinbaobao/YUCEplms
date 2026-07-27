<template>
  <div class="panel-wrap">
    <div class="panel-toolbar">
      <h3>项目成员</h3>
      <el-button size="small" type="primary" :icon="Plus" @click="showAdd = true">添加成员</el-button>
    </div>
    <div class="member-list" v-loading="loading">
      <div v-for="m in members" :key="m.id" class="member-item">
        <el-avatar :size="36" :src="m.user.avatar">{{ m.user.fullName[0] }}</el-avatar>
        <div class="member-info">
          <div class="member-name">{{ m.user.fullName }}</div>
          <div class="member-meta">{{ m.user.email }} · {{ m.user.department?.name }}</div>
        </div>
        <div class="member-role">
          <el-tag size="small">{{ ({ PM: '项目经理', SUB_LEAD: '子项负责人', MEMBER: '成员', OBSERVER: '观察者' } as any)[m.projectRole] || m.projectRole }}</el-tag>
          <span v-if="m.allocation !== 100" style="font-size:11px;color:var(--plms-text-muted)">{{ m.allocation }}%</span>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAdd" title="添加成员" width="400px">
      <el-select v-model="newUserId" filterable placeholder="搜索用户" style="width:100%">
        <el-option v-for="u in allUsers" :key="u.id" :label="`${u.fullName} (${u.department?.name || '-'})`" :value="u.id" />
      </el-select>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="addMember">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const props = defineProps<{ projectId: string }>();
const members = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const loading = ref(false);
const showAdd = ref(false);
const newUserId = ref('');

const fetch = async () => {
  loading.value = true;
  try {
    const res: any = await api.get(`/projects/${props.projectId}/members`);
    members.value = res.data || [];
  } finally { loading.value = false; }
};

const fetchUsers = async () => {
  const res: any = await api.get('/projects/users/lookup');
  allUsers.value = res.data || [];
};

const addMember = async () => {
  if (!newUserId.value) return;
  try {
    await api.post(`/projects/${props.projectId}/members`, { userId: newUserId.value });
    ElMessage.success('已添加');
    showAdd.value = false;
    fetch();
  } catch { /* 已存在 */ }
};

onMounted(() => { fetch(); fetchUsers(); });
</script>

<style scoped>
.panel-wrap { padding: 8px 0; }
.panel-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-toolbar h3 { margin: 0; }
.member-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--plms-border); }
.member-info { flex: 1; }
.member-name { font-weight: 600; }
.member-meta { font-size: 11px; color: var(--plms-text-muted); }
.member-role { display: flex; align-items: center; gap: 8px; }
</style>
