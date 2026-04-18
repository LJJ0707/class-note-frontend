import request from '@/utils/request'

/**
 * 用户注册
 * @param {Object} data 注册数据
 * @param {string} data.username 用户名
 * @param {string} data.password 密码
 * @param {string} data.confirmPassword 确认密码
 * @param {string} data.email 邮箱（可选）
 * @returns {Promise} 响应数据
 */
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

/**
 * 用户登录
 * @param {Object} data 登录数据
 * @param {string} data.username 用户名
 * @param {string} data.password 密码
 * @returns {Promise} 响应数据
 */
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

/**
 * 用户登出
 * @returns {Promise} 响应数据
 */
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise} 响应数据
 */
export function getCurrentUser() {
  return request({
    url: '/user/me',
    method: 'get'
  })
}

/**
 * 获取用户个人资料详情
 * @returns {Promise} 响应数据
 */
export function getUserProfile() {
  return request({
    url: '/user/profile',
    method: 'get'
  })
}

/**
 * 获取用户统计数据
 * @returns {Promise} 响应数据
 */
export function getUserStatistics() {
  return request({
    url: '/user/statistics',
    method: 'get'
  })
}

/**
 * 获取用户技能标签
 * @returns {Promise} 响应数据
 */
export function getUserSkills() {
  return request({
    url: '/user/skills',
    method: 'get'
  })
}

export default {
  register,
  login,
  logout,
  getCurrentUser
}