<template>
  <el-container class="main-layout">
    <!-- 左侧导航栏 -->
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="layout-aside">
      <div class="logo-area">
        <el-icon size="28" color="#fff"><Reading /></el-icon>
        <span v-if="!isCollapsed" class="logo-text">智能课堂助手</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/home">
          <el-icon><Memo /></el-icon>
          <template #title>笔记重构助手</template>
        </el-menu-item>

        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>智能体聊天</template>
        </el-menu-item>

        <el-menu-item index="/history">
          <el-icon><Clock /></el-icon>
          <template #title>历史记录</template>
        </el-menu-item>
      </el-menu>

      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon size="20">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container class="layout-main">
      <!-- 顶部栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ userInitials }}
              </el-avatar>
              <span class="username">{{ currentUser?.username || '用户' }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-content">
        <router-view />
      </el-main>

      <!-- 页脚 -->
      <el-footer class="layout-footer">
        <span>智能课堂助手 &copy; {{ currentYear }}</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import {
  Reading,
  Memo,
  ChatDotRound,
  Clock,
  Fold,
  Expand,
  ArrowDown,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const isCollapsed = ref(false)
const currentYear = new Date().getFullYear()

// 计算属性
const activeMenu = computed(() => route.path)
const currentUser = computed(() => authStore.currentUser)

const userInitials = computed(() => {
  const username = currentUser.value?.username || '用户'
  return username.substring(0, 2).toUpperCase()
})

const currentPageTitle = computed(() => {
  const titles = {
    '/home': '笔记重构助手',
    '/chat': '智能体聊天',
    '/history': '历史记录'
  }
  return titles[route.path] || ''
})

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-aside {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.1);
}

.logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.layout-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 12px 0;
}

.layout-menu:not(.el-menu--collapse) {
  width: 220px;
}

:deep(.el-menu) {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.9);
  margin: 6px 12px;
  border-radius: 10px;
  padding-left: 20px !important;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: translateX(4px);
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
  color: #fff;
  font-weight: 600;
  border-left: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-menu-item .el-icon) {
  color: inherit;
  font-size: 18px;
}

:deep(.el-menu-item span) {
  font-size: 14px;
}

.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.layout-main {
  display: flex;
  flex-direction: column;
  background: url('/static/教育智能体界面优化方案.png') no-repeat center center;
  background-size: cover;
}

.layout-header {
  height: 60px;
  background: #eef2f8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.username {
  font-size: 14px;
  color: #303133;
}

.dropdown-icon {
  color: #909399;
  font-size: 12px;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: rgba(255, 255, 255, 0.85);
}

.layout-footer {
  height: 48px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e9eef3;
  font-size: 13px;
  color: #909399;
}

/* 响应式 */
@media (max-width: 768px) {
  .layout-aside {
    position: fixed;
    left: -220px;
    z-index: 1000;
    transition: left 0.3s ease;
  }

  .layout-aside.show {
    left: 0;
  }

  .username {
    display: none;
  }
}
</style>
