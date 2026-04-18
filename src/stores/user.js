import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUserProfile,
  getUserStatistics,
  getUserSkills
} from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const profile = ref(null)
  const statistics = ref(null)
  const skills = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getUserProfile()
      profile.value = response.data
    } catch (err) {
      error.value = err.message || '获取个人资料失败'
      console.error('Failed to fetch profile:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getUserStatistics()
      statistics.value = response.data
    } catch (err) {
      error.value = err.message || '获取统计数据失败'
      console.error('Failed to fetch statistics:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchSkills = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getUserSkills()
      skills.value = response.data
    } catch (err) {
      error.value = err.message || '获取技能标签失败'
      console.error('Failed to fetch skills:', err)
    } finally {
      loading.value = false
    }
  }

  // 同时获取所有用户数据
  const fetchAllUserData = async () => {
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        fetchProfile(),
        fetchStatistics(),
        fetchSkills()
      ])
    } catch (err) {
      error.value = err.message || '获取用户数据失败'
      console.error('Failed to fetch all user data:', err)
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  const reset = () => {
    profile.value = null
    statistics.value = null
    skills.value = null
    error.value = null
  }

  return {
    // 状态
    profile,
    statistics,
    skills,
    loading,
    error,

    // Actions
    fetchProfile,
    fetchStatistics,
    fetchSkills,
    fetchAllUserData,
    reset
  }
})