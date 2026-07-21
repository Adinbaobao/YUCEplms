<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <div class="brand-logo">
          <div class="brand-icon">
            <el-icon :size="56" color="#fff"><DataAnalysis /></el-icon>
          </div>
        </div>
        <h1 class="brand-title">宇测科技 PLMS</h1>
        <p class="brand-subtitle">项目全生命周期管理系统</p>
        <ul class="brand-features">
          <li><el-icon><Check /></el-icon>立项 → 规划 → 执行 → 监控 → 结项</li>
          <li><el-icon><Check /></el-icon>WBS 任务分解 + 甘特图</li>
          <li><el-icon><Check /></el-icon>子任务领取/审批/驳回全流程</li>
          <li><el-icon><Check /></el-icon>预算、成本、风险闭环</li>
          <li><el-icon><Check /></el-icon>多角色协作 + 数据仪表盘</li>
        </ul>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-wrap">
        <h2 class="form-title">欢迎登录</h2>
        <p class="form-subtitle">请使用您的账号登录系统</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          @keyup.enter="onSubmit"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              :prefix-icon="User"
              autocomplete="username"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              style="width: 100%; height: 44px; font-size: 15px"
              @click="onSubmit"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-tips">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              <div style="font-size: 12px; line-height: 1.6">
                <strong>默认账号：</strong><br />
                管理员 admin / admin123<br />
                项目经理 pm_zhang / pm123456<br />
                团队成员 dev_li / dev123456
              </div>
            </template>
          </el-alert>
        </div>

        <div class="form-footer">
          <span>© 2026 宇测科技</span>
          <span>Powered by WorkBuddy</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, DataAnalysis, Check } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: 'admin', password: 'admin123' });

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
};

const onSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    loading.value = true;
    await auth.login(form.username, form.password);
    ElMessage.success('登录成功');
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (err: any) {
    // Element Plus 已显示错误
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
  padding: 24px;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
}
.bg-circle-1 { width: 400px; height: 400px; background: #2563eb; top: -100px; left: -100px; }
.bg-circle-2 { width: 500px; height: 500px; background: #f59e0b; bottom: -200px; right: -150px; opacity: 0.25; }
.bg-circle-3 { width: 300px; height: 300px; background: #3b82f6; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.15; }

.login-container {
  position: relative;
  display: flex;
  width: 1000px;
  max-width: 100%;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.login-brand {
  flex: 1;
  background: var(--plms-gradient);
  color: #fff;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 60%);
  }
}
.brand-logo { margin-bottom: 24px; }
.brand-icon {
  width: 88px;
  height: 88px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
.brand-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; letter-spacing: 1px; }
.brand-subtitle { font-size: 15px; opacity: 0.9; margin: 0 0 32px; }
.brand-features {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    font-size: 14px;
    .el-icon { font-size: 18px; color: #fef3c7; }
  }
}

.login-form-wrap {
  flex: 1;
  padding: 64px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-title { font-size: 26px; font-weight: 700; margin: 0 0 8px; color: var(--plms-text-primary); }
.form-subtitle { font-size: 14px; color: var(--plms-text-secondary); margin: 0 0 32px; }

.form-tips { margin-top: 16px; }
.form-footer {
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
  color: var(--plms-text-muted);
  font-size: 12px;
}

@media (max-width: 768px) {
  .login-container { flex-direction: column; min-height: auto; }
  .login-brand { padding: 32px 24px; }
  .brand-title { font-size: 24px; }
  .brand-features { display: none; }
  .login-form-wrap { padding: 32px 24px; }
}
</style>
