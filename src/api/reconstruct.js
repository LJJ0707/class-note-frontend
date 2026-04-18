import request from '@/utils/request'

/**
 * 上传文件进行课堂笔记重构
 * @param {FormData} formData 包含文件的FormData
 * @returns {Promise} 响应数据
 */
export function uploadFile(formData) {
  return request({
    url: '/reconstruct',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 60秒超时（文件上传可能需要更长时间）
  })
}

/**
 * 模拟文件上传（用于测试）
 * @param {File} file 文件对象
 * @returns {Promise} 模拟响应数据
 */
export function mockUploadFile(file) {
  return new Promise((resolve, reject) => {
    // 模拟上传进度
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          resolve({
            code: 200,
            message: 'success',
            data: {
              reply: `已成功分析您的课堂笔记文件：${file.name}\n\n` +
                '通过AI智能分析，我已经将您的课堂笔记重构为以下结构：\n\n' +
                '1. **核心知识点**：识别出5个主要知识模块\n' +
                '2. **逻辑关系**：建立了知识点之间的关联网络\n' +
                '3. **难点分析**：标记了3个需要重点复习的部分\n' +
                '4. **学习建议**：提供了针对性的学习路径\n\n' +
                '重构后的笔记更加结构化，便于复习和掌握。思维导图可以帮助您直观理解知识体系，大纲可以作为学习路线图，实训项目推荐将理论知识与实践结合。',
              outline: '# 课堂笔记重构大纲\n\n' +
                '## 一、核心知识点\n' +
                '1. 基础概念\n' +
                '   - 定义与特性\n' +
                '   - 基本原理\n' +
                '   - 应用场景\n\n' +
                '2. 关键理论\n' +
                '   - 理论框架\n' +
                '   - 推导过程\n' +
                '   - 验证方法\n\n' +
                '## 二、知识结构\n' +
                '1. 模块划分\n' +
                '2. 依赖关系\n' +
                '3. 学习路径\n\n' +
                '## 三、学习建议\n' +
                '1. 复习重点\n' +
                '2. 练习方法\n' +
                '3. 扩展学习',
              mindMapMarkdown: '```mindmap\n' +
                'root((课堂笔记重构))\n' +
                '  核心知识点\n' +
                '    基础概念\n' +
                '      定义与特性\n' +
                '      基本原理\n' +
                '      应用场景\n' +
                '    关键理论\n' +
                '      理论框架\n' +
                '      推导过程\n' +
                '      验证方法\n' +
                '  知识结构\n' +
                '    模块划分\n' +
                '      模块A\n' +
                '      模块B\n' +
                '      模块C\n' +
                '    依赖关系\n' +
                '      前置知识\n' +
                '      后续内容\n' +
                '    学习路径\n' +
                '      入门阶段\n' +
                '      进阶阶段\n' +
                '      精通阶段\n' +
                '  学习建议\n' +
                '    复习重点\n' +
                '      难点标记\n' +
                '      易错点\n' +
                '    练习方法\n' +
                '      理论练习\n' +
                '      实践项目\n' +
                '    扩展学习\n' +
                '      相关领域\n' +
                '      进阶资料\n' +
                '```',
              projects: [
                '课堂知识练习项目',
                '相关实验指导',
                '综合实训案例',
                '在线测试题库',
                '扩展阅读材料'
              ]
            },
            traceId: 'mock-trace-' + Date.now()
          })
        }, 500)
      }
    }, 200)
  })
}

/**
 * 获取用户历史记录
 * @param {Object} params 查询参数
 * @returns {Promise} 响应数据
 */
export function getUserHistory(params = {}) {
  return request({
    url: '/reconstruct/history',
    method: 'get',
    params
  })
}

/**
 * 获取文件上传状态
 * @param {string} taskId 任务ID
 * @returns {Promise} 响应数据
 */
export function getUploadStatus(taskId) {
  return request({
    url: `/reconstruct/status/${taskId}`,
    method: 'get'
  })
}

/**
 * 取消文件上传
 * @param {string} taskId 任务ID
 * @returns {Promise} 响应数据
 */
export function cancelUpload(taskId) {
  return request({
    url: `/reconstruct/cancel/${taskId}`,
    method: 'post'
  })
}

export default {
  uploadFile,
  mockUploadFile,
  getUserHistory,
  getUploadStatus,
  cancelUpload
}