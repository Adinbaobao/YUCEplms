<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code plms-gradient-text">{{ code }}</div>
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <el-button type="primary" size="large" @click="$router.push('/dashboard')">返回工作台</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const code = computed(() => (route.name === '403' ? '403' : '404'));
const title = computed(() => (route.name === '403' ? '权限不足' : '页面未找到'));
const message = computed(() => (route.name === '403' ? '您没有访问此页面的权限' : '请检查您输入的地址'));
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--plms-bg);
}
.error-content { text-align: center; }
.error-code { font-size: 96px; font-weight: 700; line-height: 1; }
.error-content h1 { margin: 16px 0 8px; }
.error-content p { color: var(--plms-text-secondary); margin-bottom: 24px; }
</style>
