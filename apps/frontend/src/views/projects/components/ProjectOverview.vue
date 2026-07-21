<template>
  <div class="overview-tab">
    <el-row :gutter="16">
      <el-col :xs="24" :md="16">
        <div class="info-section">
          <h3>项目信息</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="项目编号">{{ project.code }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ project.owner?.fullName }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ project.department?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="priorityTag(project.priority)" size="small">{{ project.priority }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="计划时间">{{ formatDate(project.plannedStart) }} ~ {{ formatDate(project.plannedEnd) }}</el-descriptions-item>
            <el-descriptions-item label="预算">¥{{ (project.budget || 0).toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="进度" :span="2">
              <el-progress :percentage="project.progress" :stroke-width="10" style="max-width: 300px" />
              <span style="margin-left: 12px; font-weight: 600">{{ project.progress }}%</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="stats-section">
          <h3>统计</h3>
          <div class="stat-cards">
            <div class="stat-card"><div class="stat-num">{{ project._count?.tasks || 0 }}</div><div class="stat-label">任务</div></div>
            <div class="stat-card"><div class="stat-num">{{ project._count?.documents || 0 }}</div><div class="stat-label">文档</div></div>
            <div class="stat-card"><div class="stat-num">{{ project._count?.risks || 0 }}</div><div class="stat-label">风险</div></div>
            <div class="stat-card"><div class="stat-num">{{ project._count?.issues || 0 }}</div><div class="stat-label">问题</div></div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { PRIORITY_LABELS, formatDate } from '@plms/shared';
const props = defineProps<{ project: any; refresh: () => void }>();
const priorityTag = (p: string) => ({ LOW: 'info', MEDIUM: 'primary', HIGH: 'warning', URGENT: 'danger' }[p] || 'info');
</script>

<style scoped>
.overview-tab { padding: 8px 0; }
.info-section h3, .stats-section h3 { font-size: 15px; margin: 0 0 12px; }
.stat-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-card { text-align: center; padding: 12px; border: 1px solid var(--plms-border); border-radius: 8px; }
.stat-num { font-size: 28px; font-weight: 700; color: var(--plms-primary); }
.stat-label { font-size: 12px; color: var(--plms-text-muted); margin-top: 4px; }
</style>
