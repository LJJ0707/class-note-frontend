<template>
  <div class="reconstruct-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="reconstruct-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">AI课堂笔记重构</span>
              <el-tag type="warning">文件分析</el-tag>
            </div>
          </template>

          <!-- 上传区域 - 使用 Uploader 组件 -->
          <div class="upload-section">
            <el-alert
              title="支持上传图片、音频、PDF等文件，AI将自动分析并生成结构化笔记"
              type="info"
              :closable="false"
              show-icon
            />

            <Uploader
              :upload-url="uploadUrl"
              @success="handleUploadSuccess"
              @error="handleUploadError"
              @change="handleFileChange"
            />
          </div>

          <el-divider v-if="showResult">
            <el-icon><Collection /></el-icon>
            AI分析结果
          </el-divider>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-section">
            <el-skeleton :rows="6" animated />
          </div>

          <!-- 结果展示 -->
          <div v-if="showResult && !loading" class="result-section">
            <el-row :gutter="20">
              <!-- AI分析报告 -->
              <el-col :span="24">
                <el-card class="result-card" shadow="never">
                  <template #header>
                    <span class="result-title">AI分析报告</span>
                    <el-button
                      size="small"
                      @click="handleExportReply"
                    >
                      <el-icon><Download /></el-icon>
                      导出
                    </el-button>
                  </template>
                  <div class="result-content">
                    <pre class="ai-reply">{{ response.reply }}</pre>
                  </div>
                </el-card>
              </el-col>

              <!-- 结构化大纲 -->
              <el-col :span="24" class="mt-20">
                <el-card class="result-card" shadow="never">
                  <template #header>
                    <span class="result-title">结构化大纲</span>
                    <el-button
                      v-if="response.outline"
                      size="small"
                      @click="handleExportOutline"
                    >
                      <el-icon><Download /></el-icon>
                      导出
                    </el-button>
                  </template>
                  <div class="result-content">
                    <div v-if="response.outline" class="outline-wrapper">
                      <div v-html="renderedOutline" class="markdown-body"></div>
                    </div>
                    <el-empty v-else description="暂无大纲内容" />
                  </div>
                </el-card>
              </el-col>

              <!-- 知识图谱 -->
              <el-col :span="24" class="mt-20">
                <el-card class="result-card" shadow="never">
                  <template #header>
                    <span class="result-title">知识图谱</span>
                  </template>
                  <MindMap
                    v-if="response.mindMapMarkdown"
                    :data="response.mindMapMarkdown"
                    :show-toolbar="true"
                    @export="handleExportMindmap"
                  />
                  <el-empty v-else description="暂无思维导图内容" />
                </el-card>
              </el-col>

              <!-- 实训项目推荐 - P1 Task 7 卡片式展示 -->
              <el-col :span="24" class="mt-20">
                <el-card class="result-card" shadow="never">
                  <template #header>
                    <span class="result-title">实训项目推荐</span>
                    <el-tag type="success" size="small">
                      {{ response.projects?.length || 0 }} 个项目
                    </el-tag>
                  </template>

                  <!-- 项目卡片网格 -->
                  <div class="projects-grid">
                    <el-card
                      v-for="(project, index) in normalizedProjects"
                      :key="index"
                      class="project-card"
                      shadow="hover"
                    >
                      <div class="project-header">
                        <div class="project-index">
                          <el-icon class="project-icon"><Flag /></el-icon>
                          <span>项目 {{ index + 1 }}</span>
                        </div>
                        <!-- 匹配分 -->
                        <el-tooltip
                          v-if="project.matchScore !== undefined"
                          content="匹配度"
                          placement="top"
                        >
                          <el-progress
                            type="circle"
                            :percentage="Math.round(project.matchScore * 100)"
                            :width="40"
                            :stroke-width="4"
                            :color="getMatchScoreColor(project.matchScore)"
                          />
                        </el-tooltip>
                      </div>

                      <div class="project-content">
                        <h4 class="project-name">{{ project.name || project }}</h4>
                        <p v-if="project.description" class="project-description">
                          {{ project.description }}
                        </p>
                      </div>

                      <div class="project-tags" v-if="project.tags?.length">
                        <el-tag
                          v-for="tag in project.tags"
                          :key="tag"
                          size="small"
                          type="info"
                        >
                          {{ tag }}
                        </el-tag>
                      </div>

                      <div class="project-actions">
                        <el-button
                          type="primary"
                          size="small"
                          @click="viewProjectDetail(project, index)"
                        >
                          <el-icon><View /></el-icon>
                          详情
                        </el-button>
                        <el-button
                          size="small"
                          @click="handleFavoriteProject(project)"
                        >
                          <el-icon><Star /></el-icon>
                          收藏
                        </el-button>
                        <el-button
                          v-if="project.url"
                          type="success"
                          size="small"
                          @click="openProjectUrl(project.url)"
                        >
                          <el-icon><Link /></el-icon>
                          访问
                        </el-button>
                      </div>
                    </el-card>
                  </div>

                  <!-- 空状态 -->
                  <el-empty
                    v-if="!response.projects?.length"
                    description="暂无项目推荐"
                  />
                </el-card>
              </el-col>

              <!-- 分析摘要 -->
              <el-col :span="24" class="mt-20">
                <el-card class="result-card" shadow="never">
                  <template #header>
                    <span class="result-title">分析摘要</span>
                  </template>
                  <el-descriptions :column="3" border>
                    <el-descriptions-item label="文件类型">
                      {{ fileInfo.type || '未知' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="文件大小">
                      {{ formatFileSize(fileInfo.size) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="分析时间">
                      {{ analysisTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="回复长度">
                      {{ response.reply?.length || 0 }} 字符
                    </el-descriptions-item>
                    <el-descriptions-item label="大纲长度">
                      {{ response.outline?.length || 0 }} 字符
                    </el-descriptions-item>
                    <el-descriptions-item label="项目数量">
                      {{ response.projects?.length || 0 }} 个
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span class="card-title">使用说明</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="支持格式">
              图片(.jpg,.png,.gif)、音频(.mp3,.wav)、PDF(.pdf)、文档(.doc,.docx,.ppt,.pptx,.txt)
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              最大50MB
            </el-descriptions-item>
            <el-descriptions-item label="处理流程">
              文件上传 → AI分析 → 结构化输出
            </el-descriptions-item>
            <el-descriptions-item label="输出内容">
              分析报告、大纲、思维导图、项目推荐
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目详情对话框 -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="`项目详情 - ${selectedProject?.name || selectedProject}`"
      width="600px"
      destroy-on-close
    >
      <div class="project-detail" v-if="selectedProject">
        <h3>{{ selectedProject.name || selectedProject }}</h3>
        <p v-if="selectedProject.description" class="detail-description">
          {{ selectedProject.description }}
        </p>

        <el-divider>学习目标</el-divider>
        <ul class="detail-list">
          <li>巩固课堂所学的核心知识点</li>
          <li>通过实践加深理解</li>
          <li>提升解决实际问题的能力</li>
        </ul>

        <el-divider>学习步骤</el-divider>
        <ol class="detail-list">
          <li>阅读项目要求和背景资料</li>
          <li>分析项目需求和关键点</li>
          <li>制定实施计划</li>
          <li>动手实践并记录过程</li>
          <li>总结学习成果</li>
        </ol>

        <div v-if="selectedProject.url" class="detail-link">
          <el-divider>项目链接</el-divider>
          <el-link type="primary" :href="selectedProject.url" target="_blank">
            {{ selectedProject.url }}
          </el-link>
        </div>
      </div>
      <template #footer>
        <el-button @click="projectDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          v-if="selectedProject?.url"
          @click="openProjectUrl(selectedProject.url)"
        >
          访问项目
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Collection,
  Download,
  Flag,
  View,
  Star,
  Link
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import Uploader from '@/components/Uploader.vue'
import MindMap from '@/components/MindMap.vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { exportToMd, exportOutlineToMd, exportToPng } from '@/utils/export'

const authStore = useAuthStore()
const appStore = useAppStore()
const router = useRouter()

// Refs
const uploadUrl = '/api/reconstruct'
const selectedFile = ref(null)
const uploading = ref(false)
const response = ref({})
const loading = ref(false)
const fileInfo = ref({ type: '', size: 0 })
const analysisTime = ref('')
const projectDialogVisible = ref(false)
const selectedProject = ref(null)

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true
})

// 计算属性
const showResult = computed(() => {
  return response.value && (response.value.reply || response.value.outline)
})

const renderedOutline = computed(() => {
  if (!response.value.outline) return ''
  try {
    const html = marked.parse(response.value.outline)
    return DOMPurify.sanitize(html)
  } catch (e) {
    console.error('Markdown parse error:', e)
    return response.value.outline
  }
})

// 标准化 projects 数据（兼容字符串和对象格式）
const normalizedProjects = computed(() => {
  if (!response.value.projects) return []

  return response.value.projects.map(p => {
    if (typeof p === 'string') {
      return { name: p, matchScore: 0.8, description: '' }
    }
    return {
      name: p.name || p,
      matchScore: p.matchScore || 0.8,
      description: p.description || '',
      url: p.url || '',
      tags: p.tags || []
    }
  })
})

// 方法
const handleFileChange = (file) => {
  selectedFile.value = file
}

const handleUploadSuccess = (data, file) => {
  response.value = data
  analysisTime.value = new Date().toLocaleTimeString()
  fileInfo.value = {
    type: getFileType(selectedFile.value?.name || ''),
    size: selectedFile.value?.size || 0
  }
  ElMessage.success('AI分析完成')
}

const handleUploadError = (err, file) => {
  console.error('上传失败:', err)
  ElMessage.error('分析失败: ' + (err.message || '未知错误'))
}

const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase()
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const audioTypes = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
  const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']

  if (imageTypes.includes(extension)) return '图片'
  if (audioTypes.includes(extension)) return '音频'
  if (docTypes.includes(extension)) return '文档'
  return '未知'
}

const formatFileSize = (size) => {
  if (size === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
}

const getMatchScoreColor = (score) => {
  if (score >= 0.8) return '#67c23a'
  if (score >= 0.6) return '#e6a23c'
  if (score >= 0.4) return '#f56c6c'
  return '#909399'
}

const viewProjectDetail = (project, index) => {
  selectedProject.value = project
  projectDialogVisible.value = true
}

const openProjectUrl = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

const handleFavoriteProject = (project) => {
  appStore.addFavorite({
    type: 'project',
    itemId: project.name || project,
    data: project
  })
  ElMessage.success('已收藏项目')
}

const handleExportReply = () => {
  if (response.value.reply) {
    exportToMd(response.value.reply, `AI分析报告_${Date.now()}.md`)
    ElMessage.success('导出成功')
  }
}

const handleExportOutline = () => {
  if (response.value.outline) {
    exportOutlineToMd(response.value.outline, '结构化大纲')
    ElMessage.success('导出成功')
  }
}

const handleExportMindmap = async (dataUrl) => {
  ElMessage.success('思维导图已导出')
}

// 初始化
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.reconstruct-container {
  padding: 20px;
}

.reconstruct-card {
  margin-bottom: 20px;
  background: url('/static/教育智能体界面优化方案.png') no-repeat center center;
  background-size: cover;
  position: relative;
}

.reconstruct-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.88);
  z-index: 0;
  border-radius: inherit;
}

.reconstruct-card :deep(.el-card__header),
.reconstruct-card :deep(.el-card__body) {
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.upload-section {
  padding: 20px 0;
}

.loading-section {
  padding: 40px 0;
}

.result-section {
  padding: 20px 0;
}

.result-card {
  margin-bottom: 0;
}

.result-title {
  font-size: 16px;
  font-weight: bold;
}

.result-content {
  padding: 10px 0;
}

.ai-reply {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}

/* 大纲样式 */
.outline-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

/* 项目卡片网格 - P1 Task 7 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.project-card {
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-index {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.project-icon {
  color: #409eff;
}

.project-content {
  margin-bottom: 12px;
}

.project-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
}

.project-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.project-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 详情对话框 */
.project-detail h3 {
  margin-bottom: 16px;
  color: #303133;
}

.detail-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-list {
  padding-left: 24px;
  margin: 12px 0;
}

.detail-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.detail-link {
  margin-top: 16px;
}

/* Markdown 样式 */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.markdown-body p {
  margin: 8px 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
}

.markdown-body li {
  margin: 4px 0;
}

.mt-20 {
  margin-top: 20px;
}
</style>
