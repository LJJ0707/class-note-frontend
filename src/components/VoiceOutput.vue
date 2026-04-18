<template>
  <div class="voice-output-wrapper">
    <el-tooltip
      :content="isPlaying ? '正在播放，点击停止' : '点击朗读文本'"
      placement="top"
    >
      <el-button
        circle
        :type="isPlaying ? 'success' : 'default'"
        :disabled="!text"
        @click="togglePlayback"
      >
        <el-icon :size="20">
          <VideoPause v-if="isPlaying" />
          <VideoPlay v-else />
        </el-icon>
      </el-button>
    </el-tooltip>

    <!-- 播放进度 -->
    <div v-if="isPlaying" class="playback-indicator">
      <span class="progress-text">
        {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
      </span>
      <el-slider
        v-model="progress"
        :step="1"
        :max="100"
        :show-tooltip="false"
        class="progress-slider"
        @input="handleSeek"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'

const props = defineProps({
  // 要朗读的文本
  text: {
    type: String,
    default: ''
  },
  // 语音语言
  lang: {
    type: String,
    default: 'zh-CN'
  },
  // 语速 (0.1 - 10)
  rate: {
    type: Number,
    default: 1.0
  },
  // 音调 (0 - 2)
  pitch: {
    type: Number,
    default: 1.0
  }
})

const emit = defineEmits(['start', 'end', 'error'])

// 状态
const isPlaying = ref(false)
const currentTime = ref(0)
const totalTime = ref(0)
const progress = ref(0)

let utterance = null
let speechSynthesis = null
let voices = []

// 计算属性
const normalizedText = computed(() => {
  // 移除 Markdown 格式符号，只保留纯文本
  return props.text
    .replace(/[#*`\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
})

// 方法
const loadVoices = () => {
  speechSynthesis = window.speechSynthesis
  voices = speechSynthesis.getVoices()

  // 等待 voices 加载完成
  if (voices.length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices()
    }
  }
}

const getVoice = (lang) => {
  // 优先选择指定语言的语音
  let voice = voices.find(v => v.lang.includes(lang.split('-')[0]))

  // 如果没有指定语言，选择中文语音
  if (!voice) {
    voice = voices.find(v => v.lang.includes('zh'))
  }

  // 如果还没有，选择第一个可用的语音
  if (!voice && voices.length > 0) {
    voice = voices[0]
  }

  return voice
}

const startPlayback = () => {
  if (!normalizedText.value) return

  // 停止当前播放
  stopPlayback()

  speechSynthesis = window.speechSynthesis
  utterance = new SpeechSynthesisUtterance(normalizedText.value)

  // 设置语音参数
  const voice = getVoice(props.lang)
  if (voice) {
    utterance.voice = voice
  }
  utterance.lang = props.lang
  utterance.rate = props.rate
  utterance.pitch = props.pitch

  // 计算预估时间
  totalTime.value = Math.ceil(normalizedText.value.length / (5 * props.rate))

  // 事件处理
  utterance.onstart = () => {
    isPlaying.value = true
    emit('start')
    startProgressTimer()
  }

  utterance.onend = () => {
    isPlaying.value = false
    stopProgressTimer()
    currentTime.value = 0
    progress.value = 0
    emit('end')
  }

  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error)
    isPlaying.value = false
    stopProgressTimer()
    emit('error', event.error)
  }

  // 开始播放
  speechSynthesis.speak(utterance)
}

const stopPlayback = () => {
  if (speechSynthesis) {
    speechSynthesis.cancel()
  }
  isPlaying.value = false
  stopProgressTimer()
  currentTime.value = 0
  progress.value = 0
}

const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

const handleSeek = (value) => {
  // 由于语音合成的限制，跳转功能可能不准确
  // 这里只是演示，实际可能需要重新播放
  console.warn('Seeking is not fully supported in Web Speech API')
}

// 进度计时器
let progressTimer = null

const startProgressTimer = () => {
  currentTime.value = 0
  progressTimer = setInterval(() => {
    currentTime.value++
    if (totalTime.value > 0) {
      progress.value = (currentTime.value / totalTime.value) * 100
    }

    // 防止超过总时长
    if (currentTime.value >= totalTime.value) {
      stopProgressTimer()
    }
  }, 1000)
}

const stopProgressTimer = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 监听文本变化
watch(() => props.text, () => {
  if (isPlaying.value) {
    stopPlayback()
  }
})

// 生命周期
onUnmounted(() => {
  stopPlayback()
})

// 暴露方法
defineExpose({
  play: startPlayback,
  stop: stopPlayback,
  isPlaying
})
</script>

<style scoped>
.voice-output-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.playback-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f0f9eb;
  border: 1px solid #b3e19d;
  border-radius: 20px;
}

.progress-text {
  font-size: 12px;
  color: #67c23a;
  min-width: 80px;
}

.progress-slider {
  width: 100px;
}

.progress-slider :deep(.el-slider__runway) {
  height: 4px;
}

.progress-slider :deep(.el-slider__bar) {
  height: 4px;
  background-color: #67c23a;
}

.progress-slider :deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  border-color: #67c23a;
}
</style>
