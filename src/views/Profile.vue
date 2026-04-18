<template>
  <div class="profile-container" v-loading="userStore.loading">
    <!-- 左侧边栏 -->
    <div class="profile-sidebar">
      <!-- 用户信息卡片 -->
      <el-card class="user-card" shadow="hover">
        <div class="user-header">
          <div class="avatar-wrapper">
            <el-avatar :size="100" :src="user.avatar" class="user-avatar">
              {{ userInitials }}
            </el-avatar>
            <div class="avatar-badge">
              <el-icon><Edit /></el-icon>
            </div>
          </div>
          <h2 class="user-name">{{ user.name }}</h2>
          <el-tag type="primary" size="small" class="user-role-tag">
            {{ user.role }}
          </el-tag>
          <p class="user-bio">{{ user.bio }}</p>
        </div>

        <el-divider />

        <!-- 统计数据 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon articles">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ user.stats.articles }}</div>
              <div class="stat-label">笔记</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon followers">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ user.stats.followers }}</div>
              <div class="stat-label">粉丝</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon following">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ user.stats.following }}</div>
              <div class="stat-label">关注</div>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button class="action-btn" @click="editProfile">
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
          <el-button class="action-btn" @click="shareProfile">
            <el-icon><Share /></el-icon>
            分享名片
          </el-button>
        </div>
      </el-card>

      <!-- 学习统计卡片 -->
      <el-card class="learning-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">学习统计</span>
            <el-tag type="success" size="small">本周</el-tag>
          </div>
        </template>
        <div class="learning-stats">
          <div class="learning-item">
            <div class="learning-icon">
              <el-icon color="#67c23a"><Reading /></el-icon>
            </div>
            <div class="learning-info">
              <div class="learning-value">{{ learningStats.learningCourses }}</div>
              <div class="learning-label">学习课程</div>
            </div>
          </div>
          <el-progress :percentage="learningStats.learningCoursesPercentage" :stroke-width="8" color="#67c23a" />
          <div class="learning-item">
            <div class="learning-icon">
              <el-icon color="#409eff"><Memo /></el-icon>
            </div>
            <div class="learning-info">
              <div class="learning-value">{{ learningStats.totalNotes }}</div>
              <div class="learning-label">笔记总数</div>
            </div>
          </div>
          <el-progress :percentage="learningStats.totalNotesPercentage" :stroke-width="8" color="#409eff" />
          <div class="learning-item">
            <div class="learning-icon">
              <el-icon color="#e6a23c"><Timer /></el-icon>
            </div>
            <div class="learning-info">
              <div class="learning-value">{{ learningStats.learningHours }}</div>
              <div class="learning-label">学习时长</div>
            </div>
          </div>
          <el-progress :percentage="learningStats.learningHoursPercentage" :stroke-width="8" color="#e6a23c" />
        </div>
      </el-card>

      <!-- 快捷入口 -->
      <el-card class="quick-access-card" shadow="hover">
        <template #header>
          <span class="card-title">快捷入口</span>
        </template>
        <div class="quick-links">
          <div class="quick-link-item" @click="goToHistory">
            <el-icon><Clock /></el-icon>
            <span>历史记录</span>
          </div>
          <div class="quick-link-item" @click="goToHelp">
            <el-icon><QuestionFilled /></el-icon>
            <span>帮助中心</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 右侧内容区 -->
    <div class="profile-main">
      <el-card class="content-card" shadow="hover">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <!-- 基本信息 Tab -->
          <el-tab-pane label="基本信息" name="info">
            <div class="info-section">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">用户ID</span>
                    <span class="info-value">{{ user.id }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">用户名</span>
                    <span class="info-value">{{ user.username }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">邮箱</span>
                    <span class="info-value">{{ user.email }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">手机号</span>
                    <span class="info-value">{{ user.phone }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">部门</span>
                    <span class="info-value">{{ user.department }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">职位</span>
                    <span class="info-value">{{ user.position }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">入职时间</span>
                    <span class="info-value">{{ user.joinDate }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">最后登录</span>
                    <span class="info-value">{{ user.lastLogin }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">账号状态</span>
                    <el-tag :type="user.status === '正常' ? 'success' : 'danger'" size="small">
                      {{ user.status }}
                    </el-tag>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">注册时间</span>
                    <span class="info-value">{{ user.registerDate }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 最近活动 Tab -->
          <el-tab-pane label="最近活动" name="activity">
            <el-timeline class="activity-timeline">
              <el-timeline-item
                v-for="(activity, index) in recentActivities"
                :key="activity.id"
                :timestamp="activity.time"
                :type="activity.type"
                :icon="activity.icon"
                :color="activity.color"
                :hollow="index % 2 === 1"
              >
                <el-card class="activity-card" shadow="never">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-desc">{{ activity.description }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>

          <!-- 技能标签 Tab -->
          <el-tab-pane label="技能标签" name="skills">
            <div class="skills-section">
              <div class="skill-category">
                <h4 class="skill-category-title">编程语言</h4>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in programmingSkills"
                    :key="skill"
                    :type="getSkillTagType(skill)"
                    effect="light"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              <div class="skill-category">
                <h4 class="skill-category-title">框架&工具</h4>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in frameworkSkills"
                    :key="skill"
                    :type="getSkillTagType(skill)"
                    effect="light"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              <div class="skill-category">
                <h4 class="skill-category-title">其他技能</h4>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in otherSkills"
                    :key="skill"
                    :type="getSkillTagType(skill)"
                    effect="light"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  Edit,
  Document,
  User,
  Star,
  Share,
  Reading,
  Memo,
  Timer,
  Clock,
  Setting,
  QuestionFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('info')

// 计算属性：合并用户资料和统计数据
const user = computed(() => {
  const profile = userStore.profile || {}
  const stats = userStore.statistics || {}

  return {
    id: profile.userId || profile.id || '100001', // 兼容 userId 和 id
    username: profile.username || 'admin',
    name: profile.name || '管理员',
    avatar: profile.avatar || '',
    role: profile.role || '系统管理员',
    bio: profile.bio || '专注于系统架构和前后端开发',
    email: profile.email || 'admin@example.com',
    phone: profile.phone || '138****8000',
    department: profile.department || '技术部',
    position: profile.position || '高级工程师',
    joinDate: profile.joinDate || '2023-01-15',
    lastLogin: profile.lastLogin || '2024-01-15 10:30:25',
    status: profile.status || '正常',
    registerDate: profile.registerDate || '2023-01-10',
    stats: {
      articles: stats.articles || 0,
      followers: stats.followers || 0,
      following: stats.following || 0
    }
  }
})

const userInitials = computed(() => {
  return user.value.name.substring(0, 2).toUpperCase()
})

const recentActivities = ref([
  {
    id: 1,
    time: '2024-01-15 10:30',
    type: 'primary',
    icon: 'User',
    color: '#667eea',
    title: '登录系统',
    description: '成功登录到管理后台'
  },
  {
    id: 2,
    time: '2024-01-15 09:45',
    type: 'success',
    icon: 'Edit',
    color: '#67c23a',
    title: '更新个人信息',
    description: '修改了个人头像和简介'
  },
  {
    id: 3,
    time: '2024-01-14 16:20',
    type: 'warning',
    icon: 'Lock',
    color: '#e6a23c',
    title: '修改密码',
    description: '更新了账户登录密码'
  },
  {
    id: 4,
    time: '2024-01-14 14:15',
    type: 'info',
    icon: 'Upload',
    color: '#909399',
    title: '文件上传',
    description: '上传了项目文档文件'
  },
  {
    id: 5,
    time: '2024-01-13 11:30',
    type: 'success',
    icon: 'Check',
    color: '#67c23a',
    title: '完成项目',
    description: '完成了SpringBoot+Vue3项目骨架'
  }
])

// 获取用户数据
onMounted(() => {
  userStore.fetchAllUserData()
})

// 监听错误并提示
watch(() => userStore.error, (error) => {
  if (error) {
    ElMessage.error(error)
  }
})

// 技能标签计算属性
const programmingSkills = computed(() => userStore.skills?.programming || ['Java', 'Python', 'JavaScript', 'TypeScript'])
const frameworkSkills = computed(() => userStore.skills?.frameworks || ['Spring Boot', 'Vue.js', 'React', 'MySQL', 'Redis', 'Docker'])
const otherSkills = computed(() => userStore.skills?.others || ['Linux', 'Git', 'Nginx', 'Kafka'])

// 学习统计计算属性
const learningStats = computed(() => {
  const stats = userStore.statistics || {}
  return {
    learningCourses: stats.learningCourses || 12,
    learningCoursesPercentage: stats.learningCoursesPercentage || 75,
    totalNotes: stats.totalNotes || 48,
    totalNotesPercentage: stats.totalNotesPercentage || 60,
    learningHours: stats.learningHours || '24h',
    learningHoursPercentage: stats.learningHoursPercentage || 85
  }
})

const getSkillTagType = (skill) => {
  const typeMap = {
    'Java': 'primary',
    'Python': 'success',
    'JavaScript': 'warning',
    'TypeScript': 'info',
    'Spring Boot': 'primary',
    'Vue.js': 'success',
    'React': 'warning',
    'MySQL': 'info',
    'Redis': 'danger',
    'Docker': 'primary',
    'Linux': 'success',
    'Git': 'info',
    'Nginx': 'warning',
    'Kafka': 'danger'
  }
  return typeMap[skill] || ''
}

const editProfile = () => {
  ElMessage.info('编辑资料功能')
}

const shareProfile = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const goToHistory = () => {
  router.push('/history')
}

const goToHelp = () => {
  ElMessage.info('帮助中心开发中')
}
</script>

<style scoped>
.profile-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 120px);
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 左侧边栏 */
.profile-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.user-card :deep(.el-card__header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 20px;
}

.user-card :deep(.el-card__body) {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.user-avatar {
  background: rgba(255, 255, 255, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.5);
  font-size: 32px;
  font-weight: bold;
}

.avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-badge .el-icon {
  color: #667eea;
  font-size: 14px;
}

.user-name {
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 8px;
  color: #fff;
}

.user-role-tag {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: #fff;
  margin-bottom: 12px;
}

.user-bio {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
}

.user-card :deep(.el-divider) {
  background: rgba(255, 255, 255, 0.2);
  margin: 16px 0;
}

/* 统计数据网格 */
.stats-grid {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  overflow: hidden;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  flex: 1;
  margin: 0 4px;
  min-width: 0;
  overflow: hidden;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-icon.articles {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.stat-icon.followers {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.stat-icon.following {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.action-btn {
  flex: 1;
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
}

.action-btn.el-button--primary {
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
}

.action-btn.el-button--primary:hover {
  background: rgba(102, 126, 234, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
}

/* 学习统计卡片 */
.learning-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.learning-stats {
  padding: 8px 0;
}

.learning-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.learning-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.learning-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.learning-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.learning-label {
  font-size: 12px;
  color: #909399;
}

.learning-stats .el-progress {
  margin-bottom: 16px;
}

.learning-stats .el-progress:last-child {
  margin-bottom: 0;
}

/* 快捷入口卡片 */
.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.quick-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
  font-size: 14px;
}

.quick-link-item:hover {
  background: #eef2fa;
  color: #667eea;
  transform: translateX(4px);
}

.quick-link-item .el-icon {
  font-size: 18px;
}

/* 右侧内容区 */
.profile-main {
  flex: 1;
  min-width: 0;
}

.content-card {
  height: 100%;
}

.content-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

/* Tabs 样式 */
.profile-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  color: #909399;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
}

.profile-tabs :deep(.el-tabs__active-bar) {
  background-color: #667eea;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #f0f0f0;
}

/* 信息网格 */
.info-section {
  padding: 8px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* 时间轴 */
.activity-timeline {
  padding: 12px 0;
}

.activity-card {
  background: #f9fafb;
  border: none;
  border-radius: 8px;
}

.activity-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 13px;
  color: #909399;
}

/* 技能标签 */
.skills-section {
  padding: 12px 0;
}

.skill-category {
  margin-bottom: 24px;
}

.skill-category:last-child {
  margin-bottom: 0;
}

.skill-category-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  overflow: hidden;
}

.skill-tag {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 20px;
  white-space: nowrap;
  box-sizing: border-box;
}

/* 响应式 */
@media (max-width: 1024px) {
  .profile-container {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .profile-sidebar > .el-card {
    flex: 1;
    min-width: 280px;
  }

  .user-card {
    flex: 1 1 100%;
  }
}
</style>