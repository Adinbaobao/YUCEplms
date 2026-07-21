<template>
  <div class="plms-page">
    <div class="plms-card">
      <h2>子任务收件箱</h2>
      <p class="text-muted" style="color: var(--plms-text-muted)">
        ⭐ 流程图业务核心：领取 → 上传 → 审核 → 驳回/暂定 完整闭环
      </p>
      <el-alert type="warning" :closable="false" show-icon style="margin-top: 16px">
        <template #title>子任务面板 UI 将在阶段 3 实现（已包含流程图严格对应的状态机）</template>
      </el-alert>
    </div>
  </div>
</template>
