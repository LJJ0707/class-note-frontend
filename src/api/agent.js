import request from '@/utils/request'

/**
 * 发送消息给智能体
 * @param {Object} data 请求数据
 * @param {string} data.message 消息内容
 * @returns {Promise} 响应数据
 */
export function chat(data) {
  return request({
    url: '/chat',
    method: 'post',
    data
  })
}

/**
 * 模拟智能体响应（用于测试）
 * @param {string} message 消息内容
 * @returns {Promise} 模拟响应数据
 */
export function mockChat(message) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: 'success',
        data: {
          reply: `这是对"${message}"的模拟回复。此回复来自模拟数据，实际使用时请调用真实API。`,
          outline: '# 大纲\n\n1. 问题分析\n2. 解决方案\n3. 实施步骤',
          mindMapMarkdown: '```mindmap\nroot\n  问题分析\n    原因1\n    原因2\n  解决方案\n    方案1\n    方案2\n```',
          projects: ['项目A', '项目B', '项目C']
        },
        traceId: 'mock-trace-id-' + Date.now()
      })
    }, 1000)
  })
}

export default {
  chat,
  mockChat
}