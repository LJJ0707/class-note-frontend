<template>
  <div class="uploader-wrapper">
    <!-- 拖拽上传区域 -->
    <el-upload
      ref="uploadRef"
      class="uploader-dragger"
      :class="{ 'is-dragover': isDragover }"
      drag
      :action="uploadUrl"
      :headers="uploadHeaders"
      :data="uploadData"
      :before-upload="handleBeforeUpload"
      :on-progress="handleProgress"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-remove="handleRemove"
      :on-change="handleChange"
      :on-preview="handlePreview"
      :show-file-list="false"
      :auto-upload="false"
      :limit="1"
      :accept="acceptTypes"
      :disabled="uploading"
    >
      <div v-if="!uploading && !currentFile" class="upload-placeholder">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">
          <p class="primary-text">点击或将文件拖拽到此处</p>
          <p class="secondary-text">支持图片、音频、PDF、文档等，不超过50MB</p>
        </div>
      </div>

      <!-- 上传中状态 -->
      <div v-else-if="uploading" class="upload-progress-wrapper">
        <el-icon class="upload-icon uploading"><Loading /></el-icon>
        <div class="progress-info">
          <p class="file-name">{{ currentFile?.name || '文件' }}</p>
          <el-progress
            :percentage="uploadProgress"
            :status="uploadStatus"
            :stroke-width="6"
            :show-text="true"
          />
          <p class="progress-text">{{ progressText }}</p>
        </div>
        <el-button
          type="danger"
          size="small"
          circle
          @click.stop="handleCancel"
          class="cancel-btn"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 已选文件预览 -->
      <div v-else-if="currentFile && !uploading" class="file-preview">
        <div class="preview-content">
          <!-- 图片预览 -->
          <div v-if="isImageFile" class="image-preview">
            <el-image
              :src="previewUrl"
              fit="cover"
              class="preview-image"
              :preview-src-list="[previewUrl]"
            />
          </div>

          <!-- 音频预览 -->
          <div v-else-if="isAudioFile" class="audio-preview">
            <el-icon class="file-icon audio-icon"><Microphone /></el-icon>
            <audio
              ref="audioPlayer"
              :src="previewUrl"
              controls
              class="audio-player"
            />
          </div>

          <!-- PDF预览 -->
          <div v-else-if="isPdfFile" class="pdf-preview">
            <el-icon class="file-icon pdf-icon"><Document /></el-icon>
            <p class="file-name">{{ currentFile.name }}</p>
            <el-button
              type="primary"
              size="small"
              @click.stop="openPdfPreview"
            >
              <el-icon><View /></el-icon>
              预览PDF
            </el-button>
          </div>

          <!-- 其他文件 -->
          <div v-else class="other-preview">
            <el-icon class="file-icon other-icon"><Document /></el-icon>
            <p class="file-name">{{ currentFile.name }}</p>
            <p class="file-size">{{ formatFileSize(currentFile.size) }}</p>
          </div>
        </div>

        <div class="file-actions">
          <el-button
            type="danger"
            size="small"
            circle
            @click.stop="handleRemoveFile"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </el-upload>

    <!-- 操作按钮 -->
    <div v-if="currentFile && !uploading" class="upload-actions">
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="!currentFile || uploading"
        @click="handleSubmit"
      >
        <el-icon v-if="!uploading"><Upload /></el-icon>
        {{ uploading ? '上传中...' : '开始上传' }}
      </el-button>
      <el-button @click="handleClear">
        <el-icon><RefreshRight /></el-icon>
        清空
      </el-button>
    </div>

    <!-- PDF预览对话框 -->
    <el-dialog
      v-model="pdfPreviewVisible"
      title="PDF预览"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        class="pdf-iframe"
        frameborder="0"
      />
      <div v-else class="pdf-loading">
        <el-skeleton :rows="10" animated />
      </div>
    </el-dialog>

    <!-- 全局Loading指示器 -->
    <div v-if="showGlobalLoading" class="global-loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-spinner"><Loading /></el-icon>
        <p>{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled,
  Loading,
  Close,
  Delete,
  RefreshRight,
  Document,
  View,
  Upload,
  Microphone
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { onLoadingChange } from '@/utils/request'

// Props
const props = defineProps({
  uploadUrl: {
    type: String,
    default: '/api/reconstruct'
  },
  acceptTypes: {
    type: String,
    default: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp3,.wav,.ogg,.m4a,.flac,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.wmv'
  },
  maxSize: {
    type: Number,
    default: 50 * 1024 * 1024 // 50MB
  },
  loadingText: {
    type: String,
    default: '处理中...'
  }
})

// Emits
const emit = defineEmits(['success', 'error', 'change', 'remove'])

// Refs
const uploadRef = ref(null)
const audioPlayer = ref(null)
const currentFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const isDragover = ref(false)
const previewUrl = ref('')
const pdfPreviewVisible = ref(false)
const showGlobalLoading = ref(false)
let removeLoadingChange = null

// Computed
const uploadHeaders = computed(() => {
  const authStore = useAuthStore()
  return {
    'X-Requested-With': 'XMLHttpRequest',
    ...(authStore.token ? { 'Authorization': `Bearer ${authStore.token}` } : {})
  }
})

const uploadData = computed(() => ({}))

const isImageFile = computed(() => {
  if (!currentFile.value) return false
  const ext = getFileExtension(currentFile.value.name).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
})

const isAudioFile = computed(() => {
  if (!currentFile.value) return false
  const ext = getFileExtension(currentFile.value.name).toLowerCase()
  return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)
})

const isPdfFile = computed(() => {
  if (!currentFile.value) return false
  const ext = getFileExtension(currentFile.value.name).toLowerCase()
  return ext === 'pdf'
})

const progressText = computed(() => {
  if (uploadProgress.value < 100) {
    return `上传中 ${uploadProgress.value}%`
  }
  return '处理中，请稍候...'
})

// Methods
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

const formatFileSize = (size) => {
  if (size === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
}

const validateFile = (file) => {
  // 校验文件大小
  if (file.size > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${formatFileSize(props.maxSize)}`)
    return false
  }

  // 校验文件类型
  const extension = getFileExtension(file.name)
  const allowedExtensions = props.acceptTypes.replace(/\./g, '').split(',')
  if (!allowedExtensions.includes(extension)) {
    ElMessage.error('不支持的文件类型')
    return false
  }

  return true
}

const handleBeforeUpload = (file) => {
  if (!validateFile(file)) {
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

const handleSuccess = (response, file) => {
  if (response.code === 200) {
    uploadProgress.value = 100
    uploadStatus.value = 'success'
    uploading.value = false

    ElMessage.success('上传成功')
    emit('success', response.data, file)
  } else {
    uploadStatus.value = 'exception'
    uploading.value = false
    ElMessage.error('上传失败: ' + (response.message || '未知错误'))
    emit('error', new Error(response.message || '上传失败'), file)
  }
}

const handleError = (err, file) => {
  console.error('上传失败:', err)
  uploadStatus.value = 'exception'
  uploading.value = false

  let errorMessage = '上传失败'
  if (err.status === 0) {
    errorMessage = '无法连接到服务器，请检查网络'
  } else if (err.status === 401) {
    errorMessage = '未授权，请重新登录'
  } else if (err.status === 413) {
    errorMessage = '文件大小超过限制'
  } else if (err.status === 415) {
    errorMessage = '不支持的文件类型'
  } else if (err.status >= 500) {
    errorMessage = '服务器内部错误，请稍后重试'
  }

  ElMessage.error(errorMessage)
  emit('error', err, file)
}

const handleChange = (file, fileList) => {
  if (file.status === 'ready') {
    currentFile.value = file.raw

    // 生成预览URL
    if (isImageFile.value || isAudioFile.value || isPdfFile.value) {
      previewUrl.value = URL.createObjectURL(file.raw)
    }

    emit('change', file.raw)
  }
}

const handleRemove = (file, fileList) => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  currentFile.value = null
  uploadProgress.value = 0
  uploadStatus.value = ''
  emit('remove', file)
}

const handlePreview = (file) => {
  if (isPdfFile.value) {
    openPdfPreview()
  }
}

const handleRemoveFile = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  handleRemove({}, [])
}

const handleCancel = () => {
  if (uploadRef.value) {
    uploadRef.value.abort()
  }
  uploading.value = false
  uploadProgress.value = 0
  ElMessage.warning('已取消上传')
}

const handleSubmit = () => {
  if (!currentFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  if (uploadRef.value) {
    uploadRef.value.submit()
  }
}

const handleClear = () => {
  handleRemoveFile()
  emit('change', null)
}

const openPdfPreview = () => {
  if (previewUrl.value) {
    pdfPreviewVisible.value = true
  }
}

// Lifecycle
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  if (removeLoadingChange) {
    removeLoadingChange()
  }
})

// 注册全局 loading 变化回调
removeLoadingChange = onLoadingChange((isLoading) => {
  if (isLoading && !uploading.value) {
    showGlobalLoading.value = true
  } else {
    showGlobalLoading.value = false
  }
})
</script>

<style scoped>
.uploader-wrapper {
  width: 100%;
  position: relative;
}

.uploader-dragger {
  width: 100%;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.uploader-dragger:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.uploader-dragger.is-dragover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.uploader-dragger.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-placeholder {
  padding: 60px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-icon.uploading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-text .primary-text {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.upload-text .secondary-text {
  font-size: 14px;
  color: #909399;
}

.upload-progress-wrapper {
  padding: 40px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-info {
  flex: 1;
}

.progress-info .file-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.cancel-btn {
  flex-shrink: 0;
}

.file-preview {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.preview-content {
  flex: 1;
}

.image-preview {
  max-width: 300px;
}

.preview-image {
  width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.audio-preview {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.audio-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 12px;
}

.audio-player {
  width: 100%;
  max-width: 400px;
  margin-top: 12px;
}

.pdf-preview,
.other-preview {
  text-align: center;
  padding: 20px;
}

.pdf-icon {
  font-size: 64px;
  color: #f56c6c;
}

.other-icon {
  font-size: 64px;
  color: #909399;
}

.pdf-preview .file-name,
.other-preview .file-name {
  font-size: 14px;
  color: #303133;
  margin: 12px 0 8px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdf-preview .file-size,
.other-preview .file-size {
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.upload-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.pdf-iframe {
  width: 100%;
  height: 70vh;
  border: none;
}

.pdf-loading {
  padding: 40px;
}

.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 40px 60px;
  border-radius: 12px;
  text-align: center;
}

.loading-spinner {
  font-size: 48px;
  color: #409eff;
  animation: rotate 1s linear infinite;
  margin-bottom: 16px;
}

.loading-content p {
  font-size: 16px;
  color: #303133;
}
</style>
