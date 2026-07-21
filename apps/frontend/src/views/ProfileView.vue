<template>
  <div class="plms-page">
    <div class="plms-card">
      <h2>个人中心</h2>
      <el-descriptions :column="2" border style="margin-top: 16px">
        <el-descriptions-item label="姓名">{{ auth.user?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ auth.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ auth.user?.email }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ auth.user?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ auth.user?.department?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-for="r in auth.user?.roles" :key="r" size="small" style="margin-right: 4px">{{ r }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="权限数" :span="2">
          <el-tag type="success">{{ auth.permissions.length }} 项</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();
</script>
