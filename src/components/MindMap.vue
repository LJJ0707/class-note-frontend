<template>
  <div class="mindmap-wrapper" :class="{ 'fullscreen': isFullscreen, 'dark-mode': isDarkMode }">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="mindmap-toolbar">
      <el-button-group>
        <el-button size="small" @click="handleZoomIn" :disabled="!canZoomIn">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
        <el-button size="small" @click="handleZoomOut" :disabled="!canZoomOut">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <el-button size="small" @click="handleResetView">
          <el-icon><FullScreen /></el-icon>
        </el-button>
        <el-button size="small" @click="handleFit">
          <el-icon><Aim /></el-icon>
        </el-button>
      </el-button-group>

      <el-button-group class="toolbar-right">
        <el-button size="small" @click="handleToggleFullscreen">
          <el-icon v-if="!isFullscreen"><FullScreen /></el-icon>
          <el-icon v-else><Close /></el-icon>
        </el-button>
        <el-button size="small" @click="handleExportPng" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出PNG
        </el-button>
      </el-button-group>

      <!-- 缩放比例显示 -->
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
    </div>

    <!-- 主题切换 -->
    <div v-if="showToolbar" class="theme-toggle">
      <el-switch
        v-model="isDarkMode"
        active-text="深色"
        inactive-text="浅色"
        @change="handleThemeChange"
      />
    </div>

    <!-- 思维导图容器 -->
    <div
      ref="mindmapContainerRef"
      class="mindmap-container"
      :class="{ 'dark': isDarkMode }"
    >
      <slot>
        <!-- 默认插槽，如果外部不传入内容则渲染自带思维导图 -->
        <div v-if="!mindmapData" class="empty-mindmap">
          <el-empty description="暂无思维导图数据" />
        </div>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="mindmap-loading">
      <el-skeleton :rows="5" animated />
      <p>正在渲染思维导图...</p>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="mindmap-error">
      <el-result
        icon="error"
        title="渲染失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="handleRetry">重试</el-button>
          <el-button @click="handleClose">关闭</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ZoomIn,
  ZoomOut,
  FullScreen,
  Close,
  Download,
  Aim
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 思维导图数据（Markdown格式或已经转换的数据）
  data: {
    type: [String, Object],
    default: null
  },
  // 是否显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否自动渲染
  autoRender: {
    type: Boolean,
    default: true
  },
  // 初始缩放比例
  initialScale: {
    type: Number,
    default: 1
  },
  // 主题模式：'light' | 'dark'
  theme: {
    type: String,
    default: 'light'
  }
})

// Emits
const emit = defineEmits([
  'zoom-in',
  'zoom-out',
  'reset',
  'fit',
  'fullscreen',
  'export',
  'theme-change',
  'ready',
  'error'
])

// Refs
const mindmapContainerRef = ref(null)
let markmapInstance = null
let markmap = null
let resizeObserver = null

// States
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const isFullscreen = ref(false)
const isDarkMode = ref(props.theme === 'dark')
const scale = ref(1)
const exporting = ref(false)

// Computed
const canZoomIn = computed(() => scale.value < 2)
const canZoomOut = computed(() => scale.value > 0.5)

const mindmapData = computed(() => props.data)

// Methods
const loadMarkmapLibrary = async () => {
  if (markmap) return markmap

  try {
    const markmapLib = await import('markmap-lib')
    const markmapView = await import('markmap-view')
    markmap = {
      transform: markmapLib.transform,
      Markmap: markmapView.Markmap
    }
    return markmap
  } catch (err) {
    console.error('加载markmap库失败:', err)
    throw err
  }
}

const renderMindMap = async () => {
  if (!mindmapContainerRef.value || !mindmapData.value) return

  loading.value = true
  error.value = false
  errorMessage.value = ''

  try {
    // 加载库
    const lib = await loadMarkmapLibrary()

    // 清空容器
    mindmapContainerRef.value.innerHTML = ''

    // 解析数据
    let root
    if (typeof mindmapData.value === 'string') {
      // Markdown 格式
      const cleanMarkdown = DOMPurify.sanitize(mindmapData.value)
      const result = lib.transform(cleanMarkdown)
      root = result.root
    } else {
      // 已经是转换后的数据
      root = mindmapData.value
    }

    // 创建 SVG 容器
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.width = '100%'
    svg.style.height = isFullscreen.value ? 'calc(100vh - 120px)' : '500px'
    mindmapContainerRef.value.appendChild(svg)

    // 颜色方案
    const getColor = (node) => {
      if (isDarkMode.value) {
        const darkColors = [
          '#69db7c', '#4dabf7', '#ffa94d', '#ff6b6b', '#da77f2',
          '#91a7ff', '#66d9e8', '#ffd43b', '#f783ac', '#a9e34b'
        ]
        return darkColors[node.depth % darkColors.length]
      }
      const lightColors = [
        '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
        '#53a8ff', '#85ce61', '#ebb563', '#f78989', '#a6a9ad'
      ]
      return lightColors[node.depth % lightColors.length]
    }

    // 渲染选项
    const options = {
      duration: 500,
      nodeFont: isDarkMode.value
        ? '16px "Microsoft YaHei", "PingFang SC", sans-serif'
        : '16px "Microsoft YaHei", "PingFang SC", sans-serif',
      nodeMinHeight: 28,
      spacingVertical: 10,
      spacingHorizontal: 80,
      paddingX: 8,
      autoFit: true,
      fitRatio: 0.95,
      color: getColor
    }

    // 渲染
    markmapInstance = lib.Markmap.create(svg, options, root)
    markmapInstance.fit()

    // 更新缩放比例
    scale.value = 1

    // 通知就绪
    emit('ready', markmapInstance)

  } catch (err) {
    console.error('渲染思维导图失败:', err)
    error.value = true
    errorMessage.value = err.message || '渲染失败，请重试'
    emit('error', err)
  } finally {
    loading.value = false
  }
}

const handleZoomIn = () => {
  if (markmapInstance && canZoomIn.value) {
    const newScale = Math.min(scale.value + 0.1, 2)
    markmapInstance.setScale(newScale)
    scale.value = newScale
    emit('zoom-in', newScale)
  }
}

const handleZoomOut = () => {
  if (markmapInstance && canZoomOut.value) {
    const newScale = Math.max(scale.value - 0.1, 0.5)
    markmapInstance.setScale(newScale)
    scale.value = newScale
    emit('zoom-out', newScale)
  }
}

const handleResetView = () => {
  if (markmapInstance) {
    markmapInstance.fit()
    scale.value = 1
    emit('reset')
  }
}

const handleFit = () => {
  if (markmapInstance) {
    markmapInstance.fit()
    emit('fit')
  }
}

const handleToggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreen', isFullscreen.value)

  nextTick(() => {
    if (markmapInstance) {
      markmapInstance.fit()
    }
  })
}

const handleThemeChange = (dark) => {
  isDarkMode.value = dark
  emit('theme-change', dark ? 'dark' : 'light')

  // 重新渲染以应用新主题
  if (mindmapData.value) {
    renderMindMap()
  }
}

const handleExportPng = async () => {
  if (!mindmapContainerRef.value) return

  exporting.value = true

  try {
    const htmlToImageLib = await import('html-to-image').catch(() => null)
    if (!htmlToImageLib) {
      throw new Error('html-to-image 库未安装，请运行: npm install html-to-image')
    }

    const dataUrl = await htmlToImageLib.toPng(mindmapContainerRef.value, {
      backgroundColor: isDarkMode.value ? '#304636' : '#ffffff',
      pixelRatio: 2
    })

    // 创建下载链接
    const link = document.createElement('a')
    link.download = `mindmap-${Date.now()}.png`
    link.href = dataUrl
    link.click()

    ElMessage.success('导出成功')
    emit('export', dataUrl)
  } catch (err) {
    console.error('导出PNG失败:', err)
    ElMessage.error('导出失败: ' + err.message)
  } finally {
    exporting.value = false
  }
}

const handleRetry = () => {
  error.value = false
  renderMindMap()
}

const handleClose = () => {
  error.value = false
  if (mindmapContainerRef.value) {
    mindmapContainerRef.value.innerHTML = ''
  }
}

// 监听数据变化
watch(() => props.data, () => {
  if (props.autoRender && props.data) {
    nextTick(() => {
      renderMindMap()
    })
  }
}, { deep: true })

// 监听全屏变化
watch(isFullscreen, () => {
  nextTick(() => {
    if (markmapInstance) {
      markmapInstance.fit()
    }
  })
})

// 生命周期
onMounted(() => {
  if (props.autoRender && props.data) {
    nextTick(() => {
      renderMindMap()
    })
  }

  // 监听窗口 resize
  if (mindmapContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (markmapInstance) {
        markmapInstance.fit()
      }
    })
    resizeObserver.observe(mindmapContainerRef.value)
  }
})

onUnmounted(() => {
  if (markmapInstance) {
    markmapInstance.destroy()
    markmapInstance = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 暴露方法
defineExpose({
  zoomIn: handleZoomIn,
  zoomOut: handleZoomOut,
  reset: handleResetView,
  fit: handleFit,
  exportPng: handleExportPng,
  setFullscreen: (full) => {
    isFullscreen.value = full
  },
  setTheme: (theme) => {
    isDarkMode.value = theme === 'dark'
    if (mindmapData.value) {
      renderMindMap()
    }
  },
  getInstance: () => markmapInstance
})
</script>

<style scoped>
.mindmap-wrapper {
  position: relative;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  transition: all 0.3s ease;
}

.mindmap-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border: none;
  border-radius: 0;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.mindmap-toolbar .toolbar-right {
  margin-left: auto;
}

.zoom-level {
  font-size: 12px;
  color: #909399;
  min-width: 50px;
  text-align: center;
}

.theme-toggle {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 10;
}

.mindmap-container {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  background-color: #fff;
  transition: background-color 0.3s ease;
}

.mindmap-container.dark {
  background-color: #1a1a2e;
}

.fullscreen .mindmap-container {
  min-height: calc(100vh - 120px);
  height: calc(100vh - 120px);
}

.empty-mindmap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.mindmap-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 40px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
}

.mindmap-loading p {
  margin-top: 16px;
  color: #909399;
}

.mindmap-error {
  padding: 60px 40px;
}

/* 深色主题样式 */
.dark-mode .mindmap-toolbar {
  background-color: #1a1a2e;
  border-bottom-color: #2d2d44;
}

.dark-mode .zoom-level {
  color: #909399;
}

.dark-mode .mindmap-container {
  background-color: #1a1a2e;
}

.dark-mode .mindmap-container svg {
  background-color: #1a1a2e;
}
</style>
