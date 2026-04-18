<template>
  <div class="footer-content">
    <el-row justify="center" align="middle">
      <el-col :span="24">
        <div class="footer-links">
          <el-link :underline="false" type="info" href="#" class="footer-link">关于我们</el-link>
          <el-divider direction="vertical" />
          <el-link :underline="false" type="info" href="#" class="footer-link">联系我们</el-link>
          <el-divider direction="vertical" />
          <el-link :underline="false" type="info" href="#" class="footer-link">隐私政策</el-link>
          <el-divider direction="vertical" />
          <el-link :underline="false" type="info" href="#" class="footer-link">服务条款</el-link>
        </div>
        <div class="footer-copyright">
          <span>© 2024 SpringBoot + Vue3 Demo. All rights reserved.</span>
        </div>
        <div class="footer-version">
          <el-tag size="small" type="info">v1.0.0</el-tag>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// No icon import needed - using plain text copyright symbol
</script>

<style scoped>
.footer-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.footer-link {
  color: #606266 !important;
  font-size: 14px;
}

.footer-link:hover {
  color: #409eff !important;
}

.footer-copyright {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 14px;
}

.footer-version {
  margin-top: 8px;
}
</style>