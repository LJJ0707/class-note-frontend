<template>
  <div class="home-container">
    <!-- Hero 区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <el-icon class="hero-icon"><Reading /></el-icon>
          课堂笔记重构助手
        </h1>
        <p class="hero-subtitle">
          上传录音、讲义截图或PDF，AI一键生成结构化大纲、思维导图并推荐实训项目
        </p>
      </div>
    </div>

    <!-- 主功能区 -->
    <div class="main-content">
      <el-row :gutter="24">
        <!-- 左侧：上传区域 -->
        <el-col :xs="24" :lg="8">
          <el-card class="upload-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Upload /></el-icon>
                <span>上传文件</span>
              </div>
            </template>

            <div class="upload-section">
              <el-alert
                title="支持图片、PDF等文件"
                type="info"
                :closable="false"
                show-icon
                class="upload-tip"
              />

              <el-upload
                ref="uploadRef"
                class="upload-dragger"
                drag
                :action="uploadUrl"
                :headers="uploadHeaders"
                :on-change="handleFileChange"
                :before-upload="beforeUpload"
                :on-progress="handleProgress"
                :on-success="handleSuccess"
                :on-error="handleError"
                :show-file-list="false"
                :auto-upload="false"
                :limit="1"
                :accept="allowedFileTypes"
                :disabled="uploading"
              >
                <div v-if="!uploading" class="upload-content">
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <div class="upload-text">
                    <p>点击或将文件拖拽到此处</p>
                    <p class="upload-hint">支持 .jpg, .png, .mp3, .pdf 等格式，不超过50MB</p>
                  </div>
                </div>
                <div v-else class="upload-progress">
                  <el-progress
                    type="circle"
                    :percentage="uploadProgress"
                    :status="uploadStatus"
                    :width="120"
                  />
                  <p class="progress-text">{{ progressText }}</p>
                </div>
              </el-upload>

              <div v-if="selectedFile" class="file-preview">
                <div class="file-info">
                  <el-icon><Document /></el-icon>
                  <div class="file-details">
                    <p class="file-name">{{ selectedFile.name }}</p>
                    <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeFile"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>

              <div class="upload-actions">
                <el-button
                  type="primary"
                  :loading="uploading"
                  :disabled="!selectedFile || uploading"
                  @click="submitUpload"
                  size="large"
                  class="submit-btn"
                >
                  <el-icon><MagicStick /></el-icon>
                  {{ uploading ? 'AI分析中...' : '开始分析' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：结果展示区域 -->
        <el-col :xs="24" :lg="16">
          <!-- 效果预览（未上传时显示） -->
          <el-card v-if="!hasResult" class="preview-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon><View /></el-icon>
                <span>效果预览</span>
              </div>
            </template>

            <div class="preview-content">
              <el-empty description="上传文件后，AI将自动分析并展示分析结果">
              </el-empty>
            </div>
          </el-card>

          <!-- 分析结果（上传后显示） -->
          <el-card v-else class="result-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><SuccessFilled /></el-icon>
                <span>分析结果</span>
                <el-tag type="success" size="small" v-if="responseData">分析完成</el-tag>
              </div>
            </template>

            <div v-if="loading" class="loading-section">
              <el-skeleton :rows="8" animated />
            </div>

            <div v-else class="result-content">
              <!-- AI分析报告 -->
              <div class="result-section">
                <h3 class="section-title">
                  <el-icon><Document /></el-icon>
                  AI分析报告
                </h3>
                <div class="result-box markdown-content">
                  <MarkdownRenderer :content="responseData.reply" />
                </div>
              </div>

              <!-- 结构化大纲 -->
              <div class="result-section" v-if="responseData.outline">
                <h3 class="section-title">
                  <el-icon><List /></el-icon>
                  结构化大纲
                </h3>
                <div class="result-box outline-box">
                  <MarkdownRenderer :content="responseData.outline" />
                </div>
              </div>

              <!-- 思维导图 -->
              <div class="result-section" v-if="responseData.mindMapMarkdown">
                <h3 class="section-title">
                  <el-icon><Connection /></el-icon>
                  知识图谱
                  <el-button
                    size="small"
                    @click="toggleFullscreen"
                    class="fullscreen-btn"
                  >
                    <el-icon><FullScreen /></el-icon>
                    {{ isFullscreen ? '退出全屏' : '全屏查看' }}
                  </el-button>
                </h3>
                <div
                  ref="mindMapContainer"
                  class="mindmap-container"
                  :class="{ 'fullscreen': isFullscreen }"
                ></div>
              </div>

              <!-- 推荐实训项目 -->
              <div class="result-section" v-if="responseData.projects?.length">
                <h3 class="section-title">
                  <el-icon><Medal /></el-icon>
                  推荐实训项目
                  <el-tag type="success" size="small">
                    {{ responseData.projects.length }} 个项目
                  </el-tag>
                </h3>
                <div class="projects-grid">
                  <el-card
                    v-for="(project, index) in responseData.projects"
                    :key="index"
                    class="project-card"
                    shadow="hover"
                  >
                    <div class="project-number">{{ index + 1 }}</div>
                    <div class="project-content">
                      <p class="project-name">{{ project }}</p>
                      <p class="project-desc">基于AI分析的个性化学习项目</p>
                    </div>
                    <div class="project-actions">
                      <el-button type="primary" size="small">
                        <el-icon><View /></el-icon>
                        查看
                      </el-button>
                    </div>
                  </el-card>
                </div>
              </div>

              <!-- Trace ID -->
              <div class="trace-info" v-if="traceId">
                <el-tag type="info" size="small">
                  Trace ID: {{ traceId }}
                </el-tag>
              </div>

              <!-- 重新分析按钮 -->
              <div class="result-actions">
                <el-button @click="reset">
                  <el-icon><Refresh /></el-icon>
                  重新分析
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 项目详情对话框 -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="`项目详情 - ${selectedProject}`"
      width="600px"
    >
      <div class="project-detail">
        <h3>{{ selectedProject }}</h3>
        <p>这是一个基于AI分析的个性化学习项目，旨在帮助您将理论知识转化为实践能力。</p>
        <el-divider content-position="left">项目特点</el-divider>
        <ul>
          <li>基于您的课堂笔记内容定制</li>
          <li>理论与实践相结合</li>
          <li>分步骤学习指导</li>
          <li>提供参考资料和练习</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="projectDialogVisible = false">关闭</el-button>
        <el-button type="primary">开始学习</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Reading,
  Upload,
  UploadFilled,
  Document,
  Close,
  MagicStick,
  View,
  SuccessFilled,
  List,
  Connection,
  FullScreen,
  Medal,
  Refresh
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import DOMPurify from 'dompurify'

const authStore = useAuthStore()
const router = useRouter()

// 上传相关
const uploadRef = ref(null)
const uploadUrl = '/api/reconstruct'
const uploadHeaders = computed(() => ({
  'X-Requested-With': 'XMLHttpRequest',
  ...(authStore.token ? { 'Authorization': `Bearer ${authStore.token}` } : {})
}))
const allowedFileTypes = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp3,.wav,.ogg,.m4a,.flac,.pdf,.doc,.docx,.ppt,.pptx,.txt'

const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

// 结果相关
const responseData = ref(null)
const traceId = ref('')
const loading = ref(false)
const hasResult = computed(() => responseData.value && Object.keys(responseData.value).length > 0)

// 思维导图相关
const mindMapContainer = ref(null)
const isFullscreen = ref(false)
let markmap = null

// 项目对话框
const projectDialogVisible = ref(false)
const selectedProject = ref('')

const progressText = computed(() => {
  if (uploadProgress.value < 100) {
    return `正在上传 ${uploadProgress.value}%`
  }
  return 'AI分析中，请稍候...'
})

// 文件处理
const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const beforeUpload = (file) => {
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过50MB')
    return false
  }

  const extension = file.name.split('.').pop().toLowerCase()
  const allowedExtensions = allowedFileTypes.replace(/\./g, '').split(',')
  if (!allowedExtensions.includes(extension)) {
    ElMessage.error('不支持的文件类型')
    return false
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''
  return true
}

const handleProgress = (event) => {
  uploadProgress.value = Math.floor(event.percent)
}

const handleSuccess = (res) => {
  if (res.code === 200) {
    uploadProgress.value = 100
    uploadStatus.value = 'success'
    responseData.value = res.data
    traceId.value = res.traceId || ''
    loading.value = false

    // 延迟渲染思维导图
    nextTick(() => {
      renderMindMap()
    })

    ElMessage.success('AI分析完成')

    // 滚动到结果区域
    scrollToResult()
  } else {
    uploadStatus.value = 'exception'
    ElMessage.error('分析失败: ' + (res.message || '未知错误'))
  }

  uploading.value = false
}

const handleError = (err) => {
  console.error('上传失败:', err)
  uploadStatus.value = 'exception'
  uploading.value = false

  let errorMessage = '上传失败'
  if (err.status === 0) {
    errorMessage = '无法连接到服务器'
  } else if (err.status === 401) {
    errorMessage = '未授权，请重新登录'
    authStore.logout()
    router.push('/login')
  }

  ElMessage.error(errorMessage)
}

const submitUpload = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  if (uploadRef.value) {
    uploadRef.value.submit()
  }
}

const removeFile = () => {
  selectedFile.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const reset = () => {
  removeFile()
  responseData.value = null
  traceId.value = ''
  isFullscreen.value = false
  if (mindMapContainer.value) {
    mindMapContainer.value.innerHTML = ''
  }
}

const formatFileSize = (size) => {
  if (size === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
}

const scrollToResult = () => {
  const resultCard = document.querySelector('.result-card')
  if (resultCard) {
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 思维导图渲染
const loadMarkmapLibrary = async () => {
  if (markmap) return
  try {
    const markmapLib = await import('markmap-lib')
    const markmapView = await import('markmap-view')
    markmap = {
      transform: markmapLib.transform,
      Markmap: markmapView.Markmap
    }
  } catch (err) {
    console.error('加载markmap库失败:', err)
  }
}

const renderMindMap = async () => {
  if (!mindMapContainer.value || !responseData.value?.mindMapMarkdown) return

  try {
    await loadMarkmapLibrary()
    if (!markmap) return

    mindMapContainer.value.innerHTML = ''
    const cleanMarkdown = DOMPurify.sanitize(responseData.value.mindMapMarkdown)
    const { root } = markmap.transform(cleanMarkdown)

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.width = '100%'
    svg.style.height = isFullscreen.value ? '80vh' : '400px'
    mindMapContainer.value.appendChild(svg)

    const options = {
      duration: 500,
      nodeFont: '14px "Microsoft YaHei", sans-serif',
      nodeMinHeight: 24,
      spacingVertical: 8,
      spacingHorizontal: 60,
      autoFit: true,
      color: (node) => {
        const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
        return colors[node.depth % colors.length]
      }
    }

    const markmapInstance = markmap.Markmap.create(svg, options, root)
    markmapInstance.fit()
  } catch (err) {
    console.error('渲染思维导图失败:', err)
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => renderMindMap())
}

// 清理
onUnmounted(() => {
  if (mindMapContainer.value) {
    mindMapContainer.value.innerHTML = ''
  }
})
</script>

<style scoped>
.home-container {
  height: 100%;
  overflow-y: auto;
  background: #F5F3FF;
}

/* Hero 区域 */
.hero-section {
  background: linear-gradient(135deg, #60A5FA ,#818CF8,#C4B5FD);
  color: white;
  padding: 40px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.hero-icon {
  font-size: 36px;
}

.hero-subtitle {
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.6;
}

/* 主内容区 */
.main-content {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 卡片样式 */
.upload-card,
.preview-card,
.result-card {
  border-radius: 12px;
  height: 100%;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(118, 75, 162, 0.1);
  border: 1px solid rgba(118, 75, 162, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* 上传区域 */
.upload-section {
  padding: 16px 0;
}

.upload-tip {
  margin-bottom: 16px;
}

.upload-dragger {
  width: 100%;
}

.upload-content {
  padding: 32px 16px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #764ba2;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 16px;
}

.progress-text {
  color: #606266;
  font-size: 14px;
}

.file-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-details {
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.upload-actions {
  margin-top: 20px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

/* 预览区域 */
.preview-content {
  padding: 20px 0;
}

.preview-demo {
  text-align: left;
}

.demo-item {
  margin-bottom: 24px;
}

.demo-item h4 {
  margin-bottom: 12px;
  color: #303133;
}

.demo-outline {
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.8;
  color: #606266;
}

.demo-mindmap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f5ff;
  border-radius: 8px;
}

.mindmap-node {
  padding: 8px 16px;
  background: #764ba2;
  color: white;
  border-radius: 20px;
  font-size: 14px;
}

.mindmap-node.root {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}

.mindmap-children {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.mindmap-children .mindmap-node {
  background: #667eea;
  font-size: 12px;
  padding: 6px 12px;
}

.demo-projects {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 结果区域 */
.loading-section {
  padding: 20px 0;
}

.result-content {
  padding: 8px 0;
}

.result-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.fullscreen-btn {
  margin-left: auto;
}

.result-box {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.markdown-content {
  line-height: 1.8;
}

.outline-box {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  white-space: pre-wrap;
}

.mindmap-container {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.mindmap-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border: none;
  border-radius: 0;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.project-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 12px;
}

.project-content {
  margin-bottom: 12px;
}

.project-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.project-desc {
  font-size: 12px;
  color: #909399;
}

.project-actions {
  display: flex;
  justify-content: flex-end;
}

.trace-info {
  margin-top: 16px;
  text-align: right;
}

.result-actions {
  margin-top: 24px;
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 项目详情 */
.project-detail h3 {
  margin-bottom: 16px;
  color: #303133;
}

.project-detail ul {
  padding-left: 20px;
}

.project-detail li {
  margin-bottom: 8px;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-section {
    padding: 24px 16px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .main-content {
    padding: 16px;
  }

  .upload-card,
  .preview-card,
  .result-card {
    margin-bottom: 16px;
  }
}
</style>
