<template>
  <div class="favorites-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="favorites-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">我的收藏</span>
              <el-tag type="info">{{ appStore.favorites.length }} 条收藏</el-tag>
            </div>
          </template>

          <!-- 筛选 -->
          <div class="filter-section">
            <el-radio-group v-model="filterType" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="project">项目</el-radio-button>
              <el-radio-button label="chat">对话</el-radio-button>
              <el-radio-button label="document">文档</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 收藏列表 -->
          <div v-if="filteredFavorites.length > 0" class="favorites-grid">
            <el-card
              v-for="item in filteredFavorites"
              :key="item.id"
              class="favorite-card"
              shadow="hover"
            >
              <div class="card-header-section">
                <div class="type-icon" :class="`type-${item.type}`">
                  <el-icon v-if="item.type === 'project'"><Flag /></el-icon>
                  <el-icon v-else-if="item.type === 'chat'"><ChatLineRound /></el-icon>
                  <el-icon v-else><Document /></el-icon>
                </div>
                <div class="type-info">
                  <span class="type-label">{{ getTypeName(item.type) }}</span>
                  <span class="create-time">{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>

              <div class="card-content">
                <h4 class="item-title">{{ item.name || item.data?.name || '未命名' }}</h4>
                <p v-if="item.data?.description" class="item-description">
                  {{ item.data.description }}
                </p>
                <p v-else-if="typeof item.data === 'string'" class="item-description">
                  {{ item.data.substring(0, 100) }}{{ item.data.length > 100 ? '...' : '' }}
                </p>
              </div>

              <div class="card-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleUse(item)"
                >
                  <el-icon><RefreshRight /></el-icon>
                  使用
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleRemove(item.id)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </el-card>
          </div>

          <!-- 空状态 -->
          <el-empty v-else description="暂无收藏内容">
            <template #image>
              <el-icon :size="60" color="#909399"><Star /></el-icon>
            </template>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Star,
  Flag,
  ChatLineRound,
  Document,
  RefreshRight,
  Delete
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const filterType = ref('all')

const filteredFavorites = computed(() => {
  if (filterType.value === 'all') {
    return appStore.favorites
  }
  return appStore.favorites.filter(f => f.type === filterType.value)
})

const getTypeName = (type) => {
  const names = {
    project: '实训项目',
    chat: '对话记录',
    document: '文档',
    outline: '大纲'
  }
  return names[type] || '其他'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const handleUse = (item) => {
  if (item.type === 'project') {
    // 导航到重构页面
    router.push('/reconstruct')
    ElMessage.success('已跳转到重构页面')
  } else if (item.type === 'chat') {
    // 导航到聊天页面
    router.push({
      path: '/chat',
      query: { content: item.data?.reply || '' }
    })
    ElMessage.success('已跳转到聊天页面')
  } else if (item.type === 'outline') {
    router.push('/chat')
    ElMessage.success('已跳转到聊天页面')
  }
}

const handleRemove = (id) => {
  ElMessageBox.confirm(
    '确定要删除这条收藏吗？',
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    appStore.removeFavorite(id)
    ElMessage.success('已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.favorites-container {
  padding: 20px;
}

.favorites-card {
  min-height: calc(100vh - 140px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
}

.filter-section {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.favorite-card {
  transition: all 0.3s ease;
}

.favorite-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.type-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.type-icon.type-project { background-color: #e6f7ff; color: #1890ff; }
.type-icon.type-chat { background-color: #fff7e6; color: #fa8c16; }
.type-icon.type-document { background-color: #f6ffed; color: #52c41a; }
.type-icon.type-outline { background-color: #f9f0ff; color: #722ed1; }

.type-info {
  display: flex;
  flex-direction: column;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.create-time {
  font-size: 12px;
  color: #909399;
}

.card-content {
  margin-bottom: 12px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
