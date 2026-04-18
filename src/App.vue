<template>
  <el-config-provider :locale="zhCn">
    <div :class="['app-container', appStore.themeClass]">
      <!-- 主题切换按钮 -->
      <div class="theme-switcher">
        <el-dropdown @command="handleThemeChange" trigger="click">
          <el-button circle>
            <el-icon v-if="appStore.theme === 'light'"><Sunny /></el-icon>
            <el-icon v-else-if="appStore.theme === 'dark'"><Moon /></el-icon>
            <el-icon v-else><Monitor /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="light" :class="{ 'is-active': appStore.theme === 'light' }">
                <el-icon><Sunny /></el-icon> 浅色模式
              </el-dropdown-item>
              <el-dropdown-item command="dark" :class="{ 'is-active': appStore.theme === 'dark' }">
                <el-icon><Moon /></el-icon> 深色模式
              </el-dropdown-item>
              <el-dropdown-item command="eyeCare" :class="{ 'is-active': appStore.theme === 'eyeCare' }">
                <el-icon><Monitor /></el-icon> 护眼模式
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 全局 Loading -->
      <div v-if="appStore.globalLoading" class="global-loading">
        <el-spinner />
      </div>

      <MainLayout v-if="isAuthenticated" />
      <router-view v-else />
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import MainLayout from '@/components/MainLayout.vue'
import { Sunny, Moon, Monitor } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const appStore = useAppStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

// 主题切换处理
const handleThemeChange = (theme) => {
  appStore.setTheme(theme)
}

// 初始化主题
onMounted(() => {
  appStore.initTheme()
})

// 监听主题变化并应用到 document
watch(
  () => appStore.themeVariables,
  (vars) => {
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  },
  { deep: true }
)
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 主题变量 */
.theme-light {
  --bg-color: #ffffff;
  --text-color: #303133;
  --primary-color: #409eff;
  --border-color: #e4e7ed;
}

.theme-dark {
  --bg-color: #1a1a2e;
  --text-color: #e4e7ed;
  --primary-color: #409eff;
  --border-color: #2d2d44;
}

.theme-eyeCare {
  --bg-color: #C7EDCC;
  --text-color: #1a1a1a;
  --primary-color: #67c23a;
  --border-color: #b8d9be;
}

/* 应用主题样式 */
.app-container {
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* 深色主题覆盖 Element Plus */
.theme-dark {
  --el-bg-color: #1a1a2e;
  --el-bg-color-page: #1a1a2e;
  --el-text-color-primary: #e4e7ed;
  --el-border-color: #2d2d44;
  --el-fill-color-light: #2d2d44;
}

/* 护眼主题覆盖 Element Plus */
.theme-eyeCare {
  --el-bg-color: #C7EDCC;
  --el-bg-color-page: #C7EDCC;
  --el-text-color-primary: #1a1a1a;
  --el-border-color: #b8d9be;
  --el-fill-color-light: #d4edda;
}

/* 主题切换按钮 */
.theme-switcher {
  position: fixed;
  top: 16px;
  right: 80px;
  z-index: 9999;
}

/* 全局 Loading */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

::-webkit-scrollbar-track {
  background: transparent;
}

/* 下拉菜单激活状态 */
.el-dropdown-menu__item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
