<template>
  <div class="register-container">
    <div class="register-card">
      <el-card class="register-form-card">
        <template #header>
          <div class="register-header">
            <h2>用户注册</h2>
            <p>创建新账号，体验智能体平台</p>
          </div>
        </template>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-width="100px"
          @submit.prevent="handleRegister"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="3-20个字符，字母数字下划线"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱（可选）"
              size="large"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="6-20个字符"
              size="large"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              size="large"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleRegister"
              class="register-button"
            >
              {{ loading ? '注册中...' : '注册' }}
            </el-button>
          </el-form-item>

          <div class="register-footer">
            <el-link type="primary" @click="goToLogin">已有账号？立即登录</el-link>
            <el-link type="info" @click="goToHome">返回</el-link>
          </div>
        </el-form>
      </el-card>

      <div class="register-illustration">
        <div class="illustration-content">
          <h3>加入我们</h3>
          <p>注册账号后，您可以享受以下服务：</p>
          <ul class="feature-list">
            <li>完全免费的智能体交互</li>
            <li>安全的个人数据存储</li>
            <li>历史记录云端同步</li>
            <li>个性化推荐功能</li>
            <li>7x24小时技术支持</li>
          </ul>
          <div class="terms">
            <el-checkbox v-model="agreeTerms">
              我已阅读并同意
              <el-link type="primary">服务条款</el-link>
              和
              <el-link type="primary">隐私政策</el-link>
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { register } from '@/api/user'

const router = useRouter()

const registerFormRef = ref()
const loading = ref(false)
const agreeTerms = ref(true)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 自定义验证规则：确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 自定义验证规则：邮箱格式
const validateEmail = (rule, value, callback) => {
  if (value && value !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      callback(new Error('请输入有效的邮箱地址'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  try {
    // 验证表单
    await registerFormRef.value.validate()

    if (!agreeTerms.value) {
      ElMessage.warning('请同意服务条款和隐私政策')
      return
    }

    loading.value = true

    // 调用注册API
    await register({
      username: registerForm.username,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      email: registerForm.email || ''
    })

    ElMessage.success('注册成功，请登录')

    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(error.message || '注册失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.register-container {
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

.register-card {
  display: flex;
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.register-form-card {
  flex: 1;
  border-radius: 0;
  border: none;
}

.register-header {
  text-align: center;
}

.register-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.register-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.register-button {
  width: 100%;
  margin-top: 10px;
}

.register-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.register-illustration {
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
  margin-bottom: 24px;
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

.terms {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.terms .el-checkbox {
  color: rgba(255, 255, 255, 0.9);
}

.terms .el-link {
  color: #a3bffa !important;
}
</style>