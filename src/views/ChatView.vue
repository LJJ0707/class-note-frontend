<template>
  <div class="chat-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="chat-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">腾讯云智能体聊天</span>
              <el-tag type="primary">Beta</el-tag>
            </div>
          </template>

          <!-- 聊天消息区域 -->
          <div class="chat-messages" ref="messagesContainer">
            <div v-if="loading" class="messages-loading">
              <el-skeleton :rows="3" animated />
            </div>

            <div v-else-if="messages.length === 0" class="empty-messages">
              <el-empty description="暂无消息，请输入内容开始对话">
                <template #image>
                  <el-icon :size="60" color="#409eff"><ChatDotRound /></el-icon>
                </template>
              </el-empty>
            </div>

            <div v-else class="messages-list">
              <div
                v-for="(msg, index) in messages"
                :key="index"
                :class="['message-item', msg.role === 'user' ? 'user-message' : 'assistant-message']"
              >
                <div class="message-avatar">
                  <el-avatar :icon="msg.role === 'user' ? 'User' : 'ChatDotRound'" />
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-name">{{ msg.role === 'user' ? '我' : 'AI助手' }}</span>
                    <span class="message-time">{{ msg.time }}</span>
                  </div>
                  <div class="message-body">
                    <MarkdownRenderer v-if="msg.role === 'assistant'" :content="msg.content" />
                    <pre v-else class="user-content">{{ msg.content }}</pre>
                  </div>
                  <div v-if="msg.role === 'assistant' && msg.projects?.length" class="message-projects">
                    <el-tag
                      v-for="(project, pIdx) in msg.projects"
                      :key="pIdx"
                      :type="getProjectTagType(pIdx)"
                      size="small"
                      class="project-tag"
                    >
                      {{ project }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷指令 -->
          <div v-if="messages.length === 0" class="quick-commands">
            <span class="quick-label">快捷指令：</span>
            <el-tag
              v-for="cmd in quickCommands"
              :key="cmd.text"
              class="quick-tag"
              @click="handleQuickCommand(cmd.text)"
            >
              {{ cmd.label }}
            </el-tag>
          </div>

          <el-divider />

          <!-- 输入区域 -->
          <div class="chat-input-section">
            <el-form @submit.prevent="handleSubmit">
              <el-form-item>
                <el-input
                  ref="textareaRef"
                  v-model="message"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 6 }"
                  :placeholder="inputPlaceholder"
                  :disabled="loading"
                  :maxlength="maxLength"
                  show-word-limit
                  @keydown="handleKeyDown"
                />
              </el-form-item>

              <!-- 发送按钮和功能按钮 -->
              <div class="input-actions">
                <el-space>
                  <el-button
                    type="primary"
                    @click="handleSubmit"
                    :loading="loading"
                    :disabled="!message.trim() || loading"
                  >
                    <el-icon><Promotion /></el-icon>
                    发送
                  </el-button>
                  <el-button @click="clearChat">
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                  <el-button @click="handleExport">
                    <el-icon><Download /></el-icon>
                    导出
                  </el-button>
                </el-space>
              </div>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Promotion,
  Delete,
  ChatDotRound,
  Download,
  User
} from '@element-plus/icons-vue'
import { chat } from '@/api/agent'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { exportToMd } from '@/utils/export'

// 快捷指令配置
const quickCommands = [
  { label: '知识点讲解', text: '请帮我讲解一个重要的知识点' },
  { label: '笔记重构', text: '请帮我重构课堂笔记' },
  { label: '生成习题', text: '请生成一些练习题帮助我复习' },
  { label: '总结摘要', text: '请总结一下今天学习的主要内容' }
]

// 状态
const message = ref('')
const messages = ref([])
const loading = ref(false)
const textareaRef = ref(null)
const messagesContainer = ref(null)

// 常量
const maxLength = 2000
const inputPlaceholder = '请输入您的问题或需求... (Shift+Enter换行，Enter发送)'

// 防抖定时器
let debounceTimer = null
const DEBOUNCE_DELAY = 500

// 方法

// 处理快捷指令
const handleQuickCommand = (text) => {
  message.value = text
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// 处理键盘事件
const handleKeyDown = (e) => {
  // Enter 发送（不带 Shift）
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
  // Shift + Enter 换行（默认行为）
}

// 防抖输入
const debouncedInput = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    // 可以在此处理防抖逻辑，如自动保存草稿
  }, DEBOUNCE_DELAY)
}

// 监听消息变化
watch(message, () => {
  debouncedInput()
})

// 提交消息
const handleSubmit = async () => {
  const content = message.value.trim()
  if (!content) {
    ElMessage.warning('请输入消息内容')
    return
  }

  // 添加用户消息
  addMessage('user', content)
  message.value = ''

  // 禁用输入框
  loading.value = true

  // 滚动到底部
  scrollToBottom()

  try {
    // 构建完整对话上下文（包含用户和助手的所有消息）
    const conversationContext = messages.value.map(m => {
      const role = m.role === 'user' ? '用户' : '助手'
      return `${role}：${m.content}`
    }).join('\n')

    const result = await chat({ message: conversationContext })
    addMessage('assistant', result.data?.reply || '无回复', result.data?.projects || [])
    ElMessage.success('请求成功')
  } catch (err) {
    addMessage('assistant', '抱歉，发生了错误：' + (err.message || '未知错误'), [])
  } finally {
    loading.value = false
  }
  scrollToBottom()
}

// 添加消息
const addMessage = (role, content, projects = []) => {
  messages.value.push({
    role,
    content,
    projects,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
}

// 清空聊天
const clearChat = () => {
  messages.value = []
  message.value = ''
  ElMessage.info('已清空对话')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 获取项目标签类型
const getProjectTagType = (index) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

// 导出对话
const handleExport = () => {
  if (messages.value.length === 0) {
    ElMessage.warning('没有可导出的对话内容')
    return
  }

  const content = messages.value.map(msg => {
    const role = msg.role === 'user' ? '【用户】' : '【AI助手】'
    return `${role} ${msg.time}\n${msg.content}\n`
  }).join('\n---\n\n')

  exportToMd(content, `对话记录_${Date.now()}.md`)
  ElMessage.success('导出成功')
}

// 生命周期
onMounted(() => {
  // 初始化
})
</script>

<style scoped>
.chat-container {
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  min-height: 300px;
  max-height: calc(100vh - 400px);
}

.messages-loading,
.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.assistant-message {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-message .message-header {
  flex-direction: row-reverse;
}

.message-name {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.message-time {
  font-size: 11px;
  color: #909399;
}

.message-body {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
}

.user-message .message-body {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant-message .message-body {
  background-color: #f5f7fa;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.user-content {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: inherit;
}

.message-projects {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.project-tag {
  cursor: pointer;
}

.quick-commands {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 0;
}

.quick-label {
  font-size: 14px;
  color: #909399;
}

.quick-tag {
  cursor: pointer;
}

.quick-tag:hover {
  opacity: 0.8;
}

.chat-input-section {
  padding: 16px 0 0;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .message-item {
    max-width: 95%;
  }
}
</style>
