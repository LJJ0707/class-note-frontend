<template>
  <el-row class="header-row" justify="space-between" align="middle">
    <el-col :span="12">
      <div class="header-left">
        <el-icon size="24" color="white"><Platform /></el-icon>
        <span class="header-title">Education assistant</span>
      </div>
    </el-col>

    <el-col :span="12">
      <div class="header-right">
        <el-menu
          mode="horizontal"
          background-color="#409eff"
          text-color="white"
          active-text-color="#ffd04b"
          :default-active="activeIndex"
          @select="handleSelect"
        >
          <el-menu-item index="1">
            <template #title>
              <el-icon><House /></el-icon>
              <span>首页</span>
            </template>
          </el-menu-item>

          <el-menu-item v-if="isAuthenticated" index="3">
            <template #title>
              <el-icon><ChatLineRound /></el-icon>
              <span>智能体聊天</span>
            </template>
          </el-menu-item>
          <el-menu-item v-if="isAuthenticated" index="4">
            <template #title>
              <el-icon><FolderOpened /></el-icon>
              <span>AI笔记重构</span>
            </template>
          </el-menu-item>
          <el-menu-item v-if="isAuthenticated" index="5">
            <template #title>
              <el-icon><Clock /></el-icon>
              <span>历史记录</span>
            </template>
          </el-menu-item>
          <el-menu-item v-if="isAuthenticated" index="2">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </template>
          </el-menu-item>

          <el-sub-menu v-if="isAuthenticated" index="user-menu">
            <template #title>
              <el-icon><User /></el-icon>
              <span>{{ currentUser?.username || '用户' }}</span>
            </template>
            <el-menu-item index="6">
              <template #title>
                <el-icon><User /></el-icon>
                <span>个人中心</span>
              </template>
            </el-menu-item>
            <el-menu-item index="logout">
              <template #title>
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </template>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else index="login">
            <template #title>
              <el-icon><Lock /></el-icon>
              <span>登录/注册</span>
            </template>
          </el-menu-item>
        </el-menu>
      </div>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { logout } from '@/api/user'
import {
  Platform,
  House,
  Setting,
  User,
  ChatLineRound,
  FolderOpened,
  Clock,
  Lock,
  SwitchButton
} from '@element-plus/icons-vue'

const activeIndex = ref('1')
const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)

const handleSelect = (key, keyPath) => {
  console.log('菜单选择:', key, keyPath)
  switch (key) {
    case '1':
      router.push('/')
      break
    case '2':
      router.push('/chat')
      break
    case '3':
      router.push('/history')
      break
    case '4':
      router.push('/profile')
      break
    case 'login':
      router.push('/login')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = () => {
  // 这里需要调用后端登出API
  authStore.logout()
  router.push('/login')
  ElMessage.success('已退出登录')
}
</script>

<style scoped>
.header-row {
  width: 100%;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.header-right {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-menu) {
  border-bottom: none;
  background-color: transparent !important;
}

:deep(.el-menu--horizontal) {
  border-bottom: none;
}

:deep(.el-menu-item) {
  height: 60px !important;
  line-height: 60px !important;
}

:deep(.el-sub-menu__title) {
  height: 60px !important;
  line-height: 60px !important;
}
</style>