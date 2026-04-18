<template>
  <div class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 配置 marked 选项（使用新 API）
const markedInstance = marked.setOptions({
  breaks: true,        // 转换换行符为 <br>
  gfm: true,           // 启用 GitHub 风格的 Markdown
})

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// 渲染 Markdown 为 HTML
const renderedHtml = computed(() => {
  if (!props.content || !props.content.trim()) {
    return '<p class="empty-content">暂无内容</p>'
  }

  try {
    // 渲染 Markdown（使用 async API）
    let html = marked.parse(props.content)

    // 确保结果是字符串
    if (typeof html !== 'string') {
      html = String(html)
    }

    // 清理 HTML，防止 XSS
    html = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li', 'dd', 'dt',
        'blockquote', 'pre', 'code',
        'strong', 'em', 'del', 's', 'u',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'section', 'article'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'id']
    })

    return html
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return `<p class="error-content">渲染失败: ${error.message}</p>`
  }
})
</script>

<style scoped>
.markdown-renderer {
  line-height: 1.8;
  font-size: 15px;
  color: #374151;
}

/* 标题样式 */
.markdown-renderer :deep(h1),
.markdown-renderer :deep(h2),
.markdown-renderer :deep(h3),
.markdown-renderer :deep(h4),
.markdown-renderer :deep(h5),
.markdown-renderer :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: #1f2937;
}

.markdown-renderer :deep(h1) {
  font-size: 1.8em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #e5e7eb;
}

.markdown-renderer :deep(h2) {
  font-size: 1.5em;
  padding-bottom: 0.2em;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-renderer :deep(h3) {
  font-size: 1.25em;
}

.markdown-renderer :deep(h4) {
  font-size: 1.1em;
}

/* 段落样式 */
.markdown-renderer :deep(p) {
  margin: 1em 0;
}

/* 列表样式 */
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-renderer :deep(li) {
  margin: 0.5em 0;
}

.markdown-renderer :deep(li > ul),
.markdown-renderer :deep(li > ol) {
  margin: 0.3em 0;
}

/* 引用样式 */
.markdown-renderer :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #d1d5db;
  background-color: #f9fafb;
  color: #6b7280;
}

.markdown-renderer :deep(blockquote p) {
  margin: 0.5em 0;
}

/* 代码块样式 */
.markdown-renderer :deep(pre) {
  margin: 1em 0;
  padding: 1em;
  background-color: #1f2937;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-renderer :deep(pre code) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  color: #f3f4f6;
  background: none;
  padding: 0;
}

.markdown-renderer :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  padding: 0.2em 0.4em;
  background-color: #f3f4f6;
  border-radius: 3px;
  color: #dc2626;
}

/* 链接样式 */
.markdown-renderer :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.markdown-renderer :deep(a:hover) {
  text-decoration: underline;
}

/* 表格样式 */
.markdown-renderer :deep(table) {
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  padding: 0.75em;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.markdown-renderer :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
}

.markdown-renderer :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* 分隔线样式 */
.markdown-renderer :deep(hr) {
  margin: 2em 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}

/* 加粗和斜体 */
.markdown-renderer :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.markdown-renderer :deep(em) {
  font-style: italic;
}

/* 图片样式 */
.markdown-renderer :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* 空内容和错误内容 */
.markdown-renderer :deep(.empty-content),
.markdown-renderer :deep(.error-content) {
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 2em;
}

.markdown-renderer :deep(.error-content) {
  color: #ef4444;
}
</style>
