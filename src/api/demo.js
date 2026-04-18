import request from '@/utils/request'

/**
 * 测试API连接
 * @returns {Promise} 响应数据
 */
export function testApi() {
  return request({
    url: '/demo/health',
    method: 'get'
  })
}

/**
 * 获取欢迎信息
 * @returns {Promise} 响应数据
 */
export function getWelcomeMessage() {
  return request({
    url: '/demo/welcome',
    method: 'get'
  })
}

/**
 * 上传文件
 * @param {File} file 文件对象
 * @returns {Promise} 响应数据
 */
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/demo/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取用户列表
 * @param {Object} params 查询参数
 * @returns {Promise} 响应数据
 */
export function getUserList(params) {
  return request({
    url: '/demo/users',
    method: 'get',
    params
  })
}

/**
 * 创建用户
 * @param {Object} data 用户数据
 * @returns {Promise} 响应数据
 */
export function createUser(data) {
  return request({
    url: '/demo/users',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 * @param {string} id 用户ID
 * @param {Object} data 用户数据
 * @returns {Promise} 响应数据
 */
export function updateUser(id, data) {
  return request({
    url: `/demo/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除用户
 * @param {string} id 用户ID
 * @returns {Promise} 响应数据
 */
export function deleteUser(id) {
  return request({
    url: `/demo/users/${id}`,
    method: 'delete'
  })
}

/**
 * 登录接口
 * @param {Object} credentials 登录凭证
 * @returns {Promise} 响应数据
 */
export function login(credentials) {
  return request({
    url: '/demo/login',
    method: 'post',
    data: credentials
  })
}

/**
 * 登出接口
 * @returns {Promise} 响应数据
 */
export function logout() {
  return request({
    url: '/demo/logout',
    method: 'post'
  })
}

export default {
  testApi,
  getWelcomeMessage,
  uploadFile,
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout
}