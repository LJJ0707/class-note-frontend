/**
 * 内容导出工具
 * P1 Task 9: 内容导出功能
 */

/**
 * 导出文本内容为 Markdown 文件
 * @param {string} content - 要导出的文本内容
 * @param {string} filename - 文件名（不含扩展名）
 */
export const exportToMd = (content, filename = 'export.md') => {
  // 确保文件名有 .md 扩展名
  if (!filename.endsWith('.md')) {
    filename += '.md'
  }

  // 添加BOM以确保UTF-8编码（支持中文）
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/markdown;charset=utf-8' })

  downloadBlob(blob, filename)
}

/**
 * 导出文本内容为纯文本文件
 * @param {string} content - 要导出的文本内容
 * @param {string} filename - 文件名（不含扩展名）
 */
export const exportToTxt = (content, filename = 'export.txt') => {
  if (!filename.endsWith('.txt')) {
    filename += '.txt'
  }

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/plain;charset=utf-8' })

  downloadBlob(blob, filename)
}

/**
 * 导出 JSON 数据
 * @param {object} data - 要导出的数据对象
 * @param {string} filename - 文件名（不含扩展名）
 */
export const exportToJson = (data, filename = 'export.json') => {
  if (!filename.endsWith('.json')) {
    filename += '.json'
  }

  const content = JSON.stringify(data, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })

  downloadBlob(blob, filename)
}

/**
 * 将 DOM 元素导出为 PNG 图片
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {string} filename - 文件名（不含扩展名）
 * @param {object} options - 导出选项
 */
export const exportToPng = async (element, filename = 'export.png', options = {}) => {
  if (!element) {
    throw new Error('要导出的元素不存在')
  }

  // 动态导入 html-to-image（使用命名导入）
  const htmlToImage = await import('html-to-image').catch(() => null)
  if (!htmlToImage) {
    throw new Error('html-to-image 库未安装，请运行: npm install html-to-image')
  }

  const defaultOptions = {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    quality: 1
  }

  const mergedOptions = { ...defaultOptions, ...options }

  try {
    const dataUrl = await htmlToImage.toPng(element, mergedOptions)

    // 转换为 Blob 并下载
    const blob = await dataUrlToBlob(dataUrl)
    downloadBlob(blob, filename)

    return dataUrl
  } catch (error) {
    console.error('导出PNG失败:', error)
    throw new Error('导出PNG失败: ' + error.message)
  }
}

/**
 * 将 DOM 元素导出为 SVG
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {string} filename - 文件名（不含扩展名）
 * @param {object} options - 导出选项
 */
export const exportToSvg = async (element, filename = 'export.svg', options = {}) => {
  if (!element) {
    throw new Error('要导出的元素不存在')
  }

  const htmlToImage = await import('html-to-image')

  try {
    const dataUrl = await htmlToImage.toSvg(element, options)
    const blob = await dataUrlToBlob(dataUrl)
    downloadBlob(blob, filename)

    return dataUrl
  } catch (error) {
    console.error('导出SVG失败:', error)
    throw new Error('导出SVG失败: ' + error.message)
  }
}

/**
 * 导出对话记录为 Markdown
 * @param {Array} messages - 消息数组 [{role, content, time, projects?}]
 * @param {string} title - 对话标题
 */
export const exportChatToMd = (messages, title = '对话记录') => {
  const header = `# ${title}\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n\n---\n\n`

  const content = messages.map(msg => {
    const role = msg.role === 'user' ? '**用户**' : '**AI助手**'
    const time = msg.time || ''
    let text = `${role} ${time}\n\n${msg.content}\n`

    if (msg.projects && msg.projects.length) {
      text += `\n相关项目:\n${msg.projects.map(p => `- ${p}`).join('\n')}\n`
    }

    return text
  }).join('\n\n---\n\n')

  exportToMd(header + content, `${title}_${Date.now()}.md`)
}

/**
 * 导出大纲为 Markdown
 * @param {string} outline - 大纲内容（Markdown 格式）
 * @param {string} title - 标题
 */
export const exportOutlineToMd = (outline, title = '大纲') => {
  const header = `# ${title}\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n\n---\n\n`

  exportToMd(header + outline, `${title}_${Date.now()}.md`)
}

/**
 * 下载 Blob 文件
 * @param {Blob} blob - Blob 对象
 * @param {string} filename - 文件名
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // 清理
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * 将 DataURL 转换为 Blob
 * @param {string} dataUrl - Data URL
 * @returns {Promise<Blob>}
 */
const dataUrlToBlob = (dataUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }

      resolve(new Blob([u8arr], { type: mime }))
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed, using fallback:', err)
      return fallbackCopyToClipboard(text)
    }
  } else {
    return fallbackCopyToClipboard(text)
  }
}

/**
 * 复制文本到剪贴板的降级方案
 * @param {string} text - 要复制的文本
 * @returns {boolean}
 */
const fallbackCopyToClipboard = (text) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const result = document.execCommand('copy')
    document.body.removeChild(textArea)
    return result
  } catch (err) {
    document.body.removeChild(textArea)
    console.error('Copy failed:', err)
    return false
  }
}

// 导出所有函数
export default {
  exportToMd,
  exportToTxt,
  exportToJson,
  exportToPng,
  exportToSvg,
  exportChatToMd,
  exportOutlineToMd,
  copyToClipboard
}
