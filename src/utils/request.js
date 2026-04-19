import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000, // 60秒超时（聊天接口可能需要较长时间）
  headers: {
    'Content-Type': 'application/json'
  }
})

// ========== P0 Task 1: 全局 Loading 状态管理 ==========
let loadingCount = 0
const loadingCallbacks = []

// 显示全局 loading（多个请求时累加计数）
const showLoading = () => {
  loadingCount++
  if (loadingCount === 1) {
    loadingCallbacks.forEach(cb => cb(true))
  }
}

// 隐藏全局 loading（计数归零时才真正关闭）
const hideLoading = () => {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    loadingCallbacks.forEach(cb => cb(false))
  }
}

// 注册 loading 状态回调
const onLoadingChange = (callback) => {
  loadingCallbacks.push(callback)
  // 返回取消注册函数
  return () => {
    const index = loadingCallbacks.indexOf(callback)
    if (index > -1) {
      loadingCallbacks.splice(index, 1)
    }
  }
}

// 导出 loading 管理函数
export { showLoading, hideLoading, onLoadingChange }

// 生成Trace ID
const generateTraceId = () => {
  return 'frontend-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// 生成Nonce（防止重放攻击）
const generateNonce = () => {
  return 'nonce-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// 判断是否需要防重放攻击检查
const shouldAddReplayProtection = (method) => {
  const upperMethod = method?.toUpperCase()
  return upperMethod === 'POST' || upperMethod === 'PUT' ||
         upperMethod === 'DELETE' || upperMethod === 'PATCH'
}

// ========== P0 Task 2: 复制 TraceID 功能 ==========
const copyTraceId = (traceId) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(traceId).then(() => {
      ElMessage.success('Trace ID 已复制到剪贴板')
    }).catch(() => {
      fallbackCopyTraceId(traceId)
    })
  } else {
    fallbackCopyTraceId(traceId)
  }
}

const fallbackCopyTraceId = (traceId) => {
  const textArea = document.createElement('textarea')
  textArea.value = traceId
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
    ElMessage.success('Trace ID 已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
  document.body.removeChild(textArea)
}

// 显示错误通知（带 TraceID 和复制按钮）
const showErrorNotification = (message, traceId) => {
  ElNotification({
    title: '请求错误',
    message: `
      <div class="error-notification-content">
        <p class="error-message">${message}</p>
        ${traceId ? `
          <div class="trace-id-wrapper">
            <span class="trace-id-label">Trace ID:</span>
            <code class="trace-id-value">${traceId}</code>
            <button class="copy-trace-btn" onclick="window.__copyTraceId('${traceId}')">复制</button>
          </div>
        ` : ''}
      </div>
    `,
    type: 'error',
    duration: 0, // 不自动关闭
    dangerouslyUseHTMLString: true,
    position: 'top-right'
  })

  // 注册全局复制函数
  window.__copyTraceId = copyTraceId
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 显示 loading
    showLoading()

    // 添加Trace ID
    const traceId = generateTraceId()
    config.headers['X-Trace-Id'] = traceId
    config._traceId = traceId // 保存到 config 便于响应拦截器使用

    // 为需要防重放攻击的请求添加时间戳和Nonce
    if (shouldAddReplayProtection(config.method)) {
      config.headers['X-Timestamp'] = Date.now().toString()
      config.headers['X-Nonce'] = generateNonce()
    }

    // 添加认证令牌（如果存在）
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }

    // 静默失败配置（用于 ping 等非关键请求）
    if (config.silentFail) {
      config.skipErrorHandler = true
    }

    // 记录请求日志（开发环境）
    if (import.meta.env.DEV) {
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params,
        traceId
      })
    }

    return config
  },
  error => {
    hideLoading()
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 隐藏 loading
    hideLoading()

    // 记录响应日志（开发环境）
    if (import.meta.env.DEV) {
      console.log(`[Response] ${response.config.url}`, {
        status: response.status,
        data: response.data,
        headers: response.headers,
        traceId: response.config._traceId
      })
    }

    // 处理业务响应
    const res = response.data
    if (res.code === 200) {
      return res
    } else if (res.code === 401 || res.code === 403) {
      // Token过期或未授权
      handleUnauthorized(res.message)
      return Promise.reject(new Error(res.message || '登录已过期'))
    } else {
      // 业务错误 - 对于登录接口的错误，不显示全局通知，由调用方处理
      const isLoginRequest = response.config.url && response.config.url.includes('/user/login')
      if (!isLoginRequest) {
        const traceId = response.headers['x-trace-id'] || response.config._traceId || ''
        showErrorNotification(res.message || '请求失败', traceId)
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    // 隐藏 loading
    hideLoading()

    // 如果设置了 skipErrorHandler，则静默失败
    if (error.config?.skipErrorHandler) {
      return Promise.reject(error)
    }

    // 提取 traceId
    const traceId = error.response?.headers?.['x-trace-id'] ||
                    error.config?._traceId ||
                    ''

    // 网络错误或HTTP错误
    let message = '请求失败'
    let isUnauthorized = false
    if (error.response) {
      // HTTP状态码错误
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          isUnauthorized = true
          break
        case 403:
          // 检查是否是Token过期导致的403
          const respMessage = error.response.data?.message || ''
          if (respMessage.includes('expired') || respMessage.includes('过期') || respMessage.includes('Token')) {
            message = '登录已过期，请重新登录'
            isUnauthorized = true
          } else {
            message = '拒绝访问'
          }
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }

      // 尝试从响应体中获取错误信息
      if (error.response.data?.message) {
        message = error.response.data.message
      }

      // 如果是未授权错误（Token过期），清除状态并跳转登录页
      if (isUnauthorized) {
        handleUnauthorized(message)
        return Promise.reject(error)
      }
    } else if (error.request) {
      // 请求已发出但没有响应
      message = '网络连接失败，请检查网络'
    } else {
      // 请求配置错误
      message = error.message
    }

    // 显示错误通知（带 TraceID 和复制按钮）
    showErrorNotification(message, traceId)

    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 处理未授权/Token过期
const handleUnauthorized = (message) => {
  // 清除认证状态
  const authStore = useAuthStore()
  authStore.logout()
  ElMessage.warning(message || '登录已过期，请重新登录')
  // 避免在登录页触发跳转
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
}

export default request
