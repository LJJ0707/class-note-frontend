<template>
  <div class="voice-input-wrapper">
    <el-tooltip
      :content="isRecording ? '正在录音，点击停止' : '点击开始语音输入'"
      placement="top"
    >
      <el-button
        circle
        :type="isRecording ? 'danger' : 'default'"
        :class="['voice-btn', { 'is-recording': isRecording }]"
        @click="toggleRecording"
        :disabled="!isSupported"
      >
        <el-icon :size="20">
          <Microphone v-if="!isRecording" />
          <Close v-else />
        </el-icon>
      </el-button>
    </el-tooltip>

    <!-- 录音状态显示 -->
    <div v-if="isRecording" class="recording-indicator">
      <span class="recording-dot"></span>
      <span class="recording-text">正在录音 {{ recordingTime }}s</span>
    </div>

    <!-- 权限请求提示 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="麦克风权限"
      width="400px"
    >
      <p>需要麦克风权限才能使用语音输入功能</p>
      <p>请在浏览器设置中允许访问麦克风</p>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="requestPermission">重新请求</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, Close } from '@element-plus/icons-vue'

const props = defineProps({
  // 语音识别语言
  lang: {
    type: String,
    default: 'zh-CN'
  },
  // 是否持续识别
  continuous: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'start',
  'result',
  'end',
  'error'
])

// 状态
const isRecording = ref(false)
const isSupported = ref(false)
const recordingTime = ref(0)
const permissionDialogVisible = ref(false)

let recognition = null
let timer = null

// 计算属性
const lang = computed(() => props.lang)
const continuous = computed(() => props.continuous)

// 方法
const checkSupport = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  isSupported.value = !!SpeechRecognition

  if (!isSupported.value) {
    ElMessage.warning('您的浏览器不支持语音识别功能')
  }
}

const initRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return

  recognition = new SpeechRecognition()
  recognition.lang = lang.value
  recognition.continuous = continuous.value
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    isRecording.value = true
    startTimer()
    emit('start')
  }

  recognition.onresult = (event) => {
    const results = event.results
    let transcript = ''

    for (let i = 0; i < results.length; i++) {
      transcript += results[i][0].transcript
    }

    const isFinal = results[results.length - 1].isFinal

    emit('result', {
      transcript,
      isFinal,
      confidence: results[results.length - 1][0].confidence
    })
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)

    if (event.error === 'not-allowed') {
      permissionDialogVisible.value = true
    }

    emit('error', event.error)
    stopRecording()
  }

  recognition.onend = () => {
    if (isRecording.value) {
      // 如果还在录音状态（可能是 continuous 模式的中断），重新开始
      try {
        recognition.start()
      } catch (e) {
        // 忽略已开始的错误
      }
    } else {
      stopTimer()
      emit('end')
    }
  }
}

const startTimer = () => {
  recordingTime.value = 0
  timer = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  recordingTime.value = 0
}

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  if (!isSupported.value) {
    ElMessage.warning('您的浏览器不支持语音识别功能')
    return
  }

  // 检查权限
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
  } catch (e) {
    permissionDialogVisible.value = true
    return
  }

  if (!recognition) {
    initRecognition()
  }

  try {
    recognition.lang = lang.value
    recognition.continuous = continuous.value
    recognition.start()
  } catch (e) {
    console.error('Failed to start recognition:', e)
    ElMessage.error('启动语音识别失败')
  }
}

const stopRecording = () => {
  if (recognition) {
    try {
      recognition.stop()
    } catch (e) {
      // 忽略已停止的错误
    }
  }
  isRecording.value = false
  stopTimer()
}

const requestPermission = async () => {
  permissionDialogVisible.value = false
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    ElMessage.success('已获得麦克风权限')
  } catch (e) {
    ElMessage.error('无法获取麦克风权限')
  }
}

// 生命周期
onMounted(() => {
  checkSupport()
})

onUnmounted(() => {
  stopRecording()
})

// 暴露方法
defineExpose({
  start: startRecording,
  stop: stopRecording,
  isRecording
})
</script>

<style scoped>
.voice-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.voice-btn {
  transition: all 0.3s ease;
}

.voice-btn.is-recording {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 20px;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background-color: #ff4d4f;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.recording-text {
  font-size: 12px;
  color: #ff4d4f;
}
</style>
