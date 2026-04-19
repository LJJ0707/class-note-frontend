<template>
  <div class="login-container">
    <div class="login-card">
      <el-card class="login-form-card">
        <template #header>
          <div class="login-header">
            <h2>登录</h2>
            <p>请使用您的用户名和密码登录</p>
          </div>
        </template>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="80px"
          @submit.prevent="handleLogin">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password
              :prefix-icon="Lock" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="handleLogin" class="login-button">
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>

          <div class="login-footer">
            <el-link type="primary" @click="goToRegister">还没有账号？立即注册</el-link>
          </div>
        </el-form>
      </el-card>

      <div class="login-illustration">
        <div class="illustration-content">
          <h3>欢迎使用</h3>
          <p>登录后即可使用以下功能：</p>
          <ul class="feature-list">
            <li>智能体聊天交互</li>
            <li>AI课堂笔记重构</li>
            <li>历史记录管理</li>
            <li>个性化设置</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/user'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    // 验证表单
    await loginFormRef.value.validate()

    loading.value = true

    // 调用登录API
    const response = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    // 保存登录状态
    authStore.login(response.data)

    ElMessage.success('登录成功')

    // 跳转到首页或重定向页面
    const redirect = router.currentRoute.value.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    if (error.name !== 'ValidationError') {
      // 根据错误消息显示不同的提示
      const message = error.message || '登录失败'
      if (message.includes('用户名不存在') || message.includes('404')) {
        ElMessage.error('用户名不存在，请先注册')
      } else if (message.includes('密码错误') || message.includes('401')) {
        ElMessage.error('密码错误')
      } else if (message.includes('已被禁用') || message.includes('403')) {
        ElMessage.error('该账号已被禁用，请联系管理员')
      } else {
        ElMessage.error(message)
      }
    }
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const goToHome = () => {
  router.push('/')
}

// 如果已经登录，跳转到首页
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('/static/image_936413153635024.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 9999;
}

.login-card {
  display: flex;
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.login-form-card {
  flex: 1;
  border-radius: 0;
  border: none;
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-illustration {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-content {
  max-width: 300px;
}

.illustration-content h3 {
  font-size: 24px;
  margin-bottom: 16px;
}

.illustration-content p {
  font-size: 16px;
  margin-bottom: 24px;
  opacity: 0.9;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  padding: 8px 0;
  font-size: 14px;
  position: relative;
  padding-left: 20px;
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #52c41a;
  font-weight: bold;
}
</style>