import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // Getter
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)

  // Actions
  const login = (loginResponse) => {
    token.value = loginResponse.token
    user.value = {
      userId: loginResponse.userId,
      username: loginResponse.username,
      email: loginResponse.email
    }

    // 保存到 localStorage
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const logout = () => {
    token.value = ''
    user.value = null

    // 清除 localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (userData) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  return {
    token,
    user,
    isAuthenticated,
    currentUser,
    login,
    logout,
    setToken,
    setUser
  }
})