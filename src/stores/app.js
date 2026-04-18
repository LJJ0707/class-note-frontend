import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ========== P1 Task 8: 主题管理 ==========
  // 主题类型：'light' | 'dark' | 'eyeCare'
  const theme = ref(localStorage.getItem('app_theme') || 'light')

  // 护眼模式的背景色
  const eyeCareBgColor = '#C7EDCC'

  // 计算当前主题类名
  const themeClass = computed(() => {
    return `theme-${theme.value}`
  })

  // 计算是否为深色或护眼模式
  const isDarkMode = computed(() => theme.value === 'dark' || theme.value === 'eyeCare')

  // 获取主题CSS变量
  const themeVariables = computed(() => {
    switch (theme.value) {
      case 'dark':
        return {
          '--bg-color': '#1a1a2e',
          '--text-color': '#e4e7ed',
          '--primary-color': '#409eff',
          '--border-color': '#2d2d44'
        }
      case 'eyeCare':
        return {
          '--bg-color': eyeCareBgColor,
          '--text-color': '#1a1a1a',
          '--primary-color': '#67c23a',
          '--border-color': '#b8d9be'
        }
      default: // light
        return {
          '--bg-color': '#ffffff',
          '--text-color': '#303133',
          '--primary-color': '#409eff',
          '--border-color': '#e4e7ed'
        }
    }
  })

  // 设置主题
  const setTheme = (newTheme) => {
    if (['light', 'dark', 'eyeCare'].includes(newTheme)) {
      theme.value = newTheme
      localStorage.setItem('app_theme', newTheme)

      // 应用主题到 document
      applyThemeToDocument()
    }
  }

  // 切换主题
  const toggleTheme = () => {
    const themes = ['light', 'dark', 'eyeCare']
    const currentIndex = themes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  // 应用主题到 document
  const applyThemeToDocument = () => {
    const html = document.documentElement
    html.classList.remove('theme-light', 'theme-dark', 'theme-eyeCare')
    html.classList.add(themeClass.value)

    // 应用CSS变量
    Object.entries(themeVariables.value).forEach(([key, value]) => {
      html.style.setProperty(key, value)
    })
  }

  // 初始化主题
  const initTheme = () => {
    applyThemeToDocument()
  }

  // ========== P1 Task 12: 新手引导 ==========
  const hasCompletedGuide = ref(localStorage.getItem('has_completed_guide') === 'true')

  const completeGuide = () => {
    hasCompletedGuide.value = true
    localStorage.setItem('has_completed_guide', 'true')
  }

  const resetGuide = () => {
    hasCompletedGuide.value = false
    localStorage.removeItem('has_completed_guide')
  }

  // ========== P1 Task 11: 收藏夹 ==========
  const favorites = ref(JSON.parse(localStorage.getItem('app_favorites') || '[]'))

  const addFavorite = (item) => {
    const favorite = {
      id: Date.now(),
      ...item,
      createdAt: new Date().toISOString()
    }
    favorites.value.unshift(favorite)
    saveFavorites()
    return favorite
  }

  const removeFavorite = (id) => {
    const index = favorites.value.findIndex(f => f.id === id)
    if (index > -1) {
      favorites.value.splice(index, 1)
      saveFavorites()
    }
  }

  const isFavorited = (type, itemId) => {
    return favorites.value.some(f => f.type === type && f.itemId === itemId)
  }

  const saveFavorites = () => {
    localStorage.setItem('app_favorites', JSON.stringify(favorites.value))
  }

  // ========== 其他全局状态 ==========
  const globalLoading = ref(false)
  const sidebarCollapsed = ref(false)

  const setGlobalLoading = (loading) => {
    globalLoading.value = loading
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    // 主题相关
    theme,
    themeClass,
    isDarkMode,
    themeVariables,
    setTheme,
    toggleTheme,
    initTheme,

    // 新手引导
    hasCompletedGuide,
    completeGuide,
    resetGuide,

    // 收藏夹
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited,

    // 其他
    globalLoading,
    sidebarCollapsed,
    setGlobalLoading,
    toggleSidebar
  }
})
