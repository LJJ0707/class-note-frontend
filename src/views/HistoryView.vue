<template>
  <div class="history-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="history-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">历史记录</span>
              <el-space>
                <el-tag type="info">{{ filteredData.length }} 条记录</el-tag>
                <el-button
                  v-if="selectedItems.length > 0"
                  type="danger"
                  size="small"
                  @click="handleBatchDelete"
                >
                  <el-icon><Delete /></el-icon>
                  批量删除 ({{ selectedItems.length }})
                </el-button>
              </el-space>
            </div>
          </template>

          <!-- 筛选区域 -->
          <div class="filter-section">
            <el-form :model="queryParams" inline>
              <el-form-item label="文件名">
                <el-input
                  v-model="queryParams.filename"
                  placeholder="输入文件名搜索"
                  clearable
                  @keyup.enter="handleSearch"
                  style="width: 200px"
                />
              </el-form-item>

              <el-form-item label="类型">
                <el-select
                  v-model="queryParams.fileType"
                  placeholder="全部类型"
                  clearable
                  style="width: 150px"
                >
                  <el-option label="文本对话" value="chat" />
                  <el-option label="文件重构" value="reconstruct" />
                  <el-option label="图片" value="image" />
                  <el-option label="音频" value="audio" />
                  <el-option label="PDF" value="pdf" />
                  <el-option label="文档" value="document" />
                </el-select>
              </el-form-item>

              <el-form-item label="日期范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="handleDateRangeChange"
                  style="width: 260px"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleSearch">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetSearch">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-section">
            <el-skeleton :rows="5" animated />
          </div>

          <!-- 历史记录卡片列表 -->
          <div v-else-if="filteredData.length > 0" class="cards-grid">
            <el-card
              v-for="item in paginatedData"
              :key="item.id"
              :class="['history-card-item', { 'is-selected': selectedItems.includes(item.id) }]"
              shadow="hover"
              @click="handleCardClick(item)"
            >
              <!-- 选择框 -->
              <div class="card-checkbox" @click.stop>
                <el-checkbox
                  v-model="item._selected"
                  @change="handleSelectionChange"
                />
              </div>

              <!-- 文件信息 -->
              <div class="card-content">
                <div class="card-header-section">
                  <div class="file-icon" :class="getFileTypeClass(item.fileType)">
                    <el-icon v-if="isImageFile(item.fileType)"><Picture /></el-icon>
                    <el-icon v-else-if="isAudioFile(item.fileType)"><Microphone /></el-icon>
                    <el-icon v-else-if="isPdfFile(item.fileType)"><Document /></el-icon>
                    <el-icon v-else><Files /></el-icon>
                  </div>
                  <div class="file-info">
                    <h4 class="file-name" :title="item.originalFilename">
                      {{ item.originalFilename }}
                    </h4>
                    <div class="file-meta">
                      <el-tag size="small" :type="getFileTypeTagType(item.fileType)">
                        {{ getFileTypeName(item.fileType) }}
                      </el-tag>
                      <span class="file-size">{{ formatFileSize(item.fileSize) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 回复摘要 -->
                <div class="card-summary">
                  <p class="summary-text">{{ item.replySummary || '无摘要' }}</p>
                </div>

                <!-- 时间信息 -->
                <div class="card-footer">
                  <span class="upload-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(item.uploadTime) }}
                  </span>
                  <span v-if="item.projectCount > 0" class="project-count">
                    <el-icon><Folder /></el-icon>
                    {{ item.projectCount }} 个项目
                  </span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="card-actions" @click.stop>
                <el-button
                  type="primary"
                  size="small"
                  @click="viewDetail(item)"
                >
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="reuseRecord(item)"
                >
                  <el-icon><RefreshRight /></el-icon>
                  复用
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(item)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </el-card>
          </div>

          <!-- 空状态 -->
          <el-empty v-else description="暂无历史记录" />

          <!-- 分页 -->
          <div v-if="filteredData.length > 0" class="pagination-section">
            <el-pagination
              v-model:current-page="queryParams.pageNum"
              v-model:page-size="queryParams.pageSize"
              :total="filteredData.length"
              :page-sizes="[8, 16, 24, 48]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`历史记录详情 - ${selectedRecord?.originalFilename || ''}`"
      width="900px"
      destroy-on-close
    >
      <div v-if="selectedRecord" class="detail-content">
        <!-- 文件信息 -->
        <el-descriptions :column="2" border class="detail-header">
          <el-descriptions-item label="文件名">
            {{ selectedRecord.originalFilename }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            <el-tag>{{ selectedRecord.fileType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatFileSize(selectedRecord.fileSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="上传时间">
            {{ formatDate(selectedRecord.uploadTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- AI 回复内容 -->
        <div class="agent-reply-section">
          <h4 class="section-title">AI 回复</h4>
          <div class="agent-reply-content" v-if="selectedRecord.agentReply">
            <pre>{{ selectedRecord.agentReply }}</pre>
          </div>
          <el-empty v-else description="暂无AI回复内容" :image-size="60" />
        </div>

        <!-- 项目推荐 -->
        <div v-if="selectedRecord.projects?.length" class="projects-section">
          <h4 class="section-title">项目推荐</h4>
          <div class="projects-grid">
            <el-card
              v-for="(project, index) in selectedRecord.projects"
              :key="index"
              class="project-card"
              shadow="hover"
            >
              <template #header>
                <div class="project-header">
                  <el-icon><Flag /></el-icon>
                  <span>项目 {{ index + 1 }}</span>
                </div>
              </template>
              <div class="project-content">
                {{ project }}
              </div>
              <div class="project-actions">
                <el-button type="primary" size="small" @click="viewProject(project)">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="reuseRecord(selectedRecord)">
          <el-icon><RefreshRight /></el-icon>
          复用内容
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Delete,
  View,
  Picture,
  Microphone,
  Document,
  Files,
  Clock,
  Folder,
  Flag,
  RefreshRight
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

// 状态
const tableData = ref([])
const loading = ref(false)
const dateRange = ref([])
const detailDialogVisible = ref(false)
const selectedRecord = ref(null)
const selectedItems = ref([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 16,
  filename: '',
  fileType: '',
  startTime: null,
  endTime: null
})

// 计算属性
const filteredData = computed(() => {
  let result = tableData.value

  // 过滤文件名
  if (queryParams.filename) {
    const keyword = queryParams.filename.toLowerCase()
    result = result.filter(item =>
      item.originalFilename?.toLowerCase().includes(keyword)
    )
  }

  // 过滤文件类型
  if (queryParams.fileType) {
    result = result.filter(item => item.fileType === queryParams.fileType)
  }

  // 过滤日期范围
  if (queryParams.startTime && queryParams.endTime) {
    result = result.filter(item => {
      const uploadTime = new Date(item.uploadTime)
      return uploadTime >= new Date(queryParams.startTime) &&
             uploadTime <= new Date(queryParams.endTime + ' 23:59:59')
    })
  }

  return result
})

const paginatedData = computed(() => {
  const start = (queryParams.pageNum - 1) * queryParams.pageSize
  const end = start + queryParams.pageSize
  return filteredData.value.slice(start, end)
})

// 方法
const fetchHistoryList = async () => {
  loading.value = true
  try {
    const headers = { 'X-User-Id': '1' }
    const response = await request({
      url: '/history',
      method: 'get',
      params: {
        pageNum: 1,
        pageSize: 100 // 先获取足够多的数据用于前端筛选
      },
      headers
    })

    if (response.code === 200) {
      tableData.value = (response.data.list || []).map(item => ({
        ...item,
        _selected: false
      }))
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
}

const resetSearch = () => {
  queryParams.filename = ''
  queryParams.fileType = ''
  queryParams.startTime = null
  queryParams.endTime = null
  queryParams.pageNum = 1
  dateRange.value = []
}

const handleDateRangeChange = (range) => {
  if (range && range.length === 2) {
    queryParams.startTime = range[0]
    queryParams.endTime = range[1]
  } else {
    queryParams.startTime = null
    queryParams.endTime = null
  }
}

const handleSizeChange = (size) => {
  queryParams.pageSize = size
  queryParams.pageNum = 1
}

const handleCurrentChange = (page) => {
  queryParams.pageNum = page
}

const handleCardClick = (item) => {
  viewDetail(item)
}

const handleSelectionChange = () => {
  selectedItems.value = tableData.value.filter(item => item._selected).map(item => item.id)
}

const viewDetail = async (item) => {
  loading.value = true
  try {
    const headers = { 'X-User-Id': '1' }
    const response = await request({
      url: `/history/${item.id}`,
      method: 'get',
      headers
    })

    if (response.code === 200) {
      selectedRecord.value = response.data

      // 解析项目JSON
      if (selectedRecord.value.projectsJson) {
        try {
          selectedRecord.value.projects = JSON.parse(selectedRecord.value.projectsJson)
        } catch (e) {
          selectedRecord.value.projects = []
        }
      }

      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (item) => {
  ElMessageBox.confirm(
    `确定要删除记录 "${item.originalFilename}" 吗？此操作不可恢复。`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const headers = { 'X-User-Id': '1' }
      const response = await request({
        url: `/history/${item.id}`,
        method: 'delete',
        headers
      })

      if (response.code === 200) {
        ElMessage.success('删除成功')
        fetchHistoryList()
      } else {
        ElMessage.error('删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleBatchDelete = () => {
  if (selectedItems.value.length === 0) return

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedItems.value.length} 条记录吗？此操作不可恢复。`,
    '批量删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const headers = { 'X-User-Id': '1' }
      await Promise.all(
        selectedItems.value.map(id =>
          request({ url: `/history/${id}`, method: 'delete', headers })
        )
      )
      ElMessage.success('批量删除成功')
      selectedItems.value = []
      fetchHistoryList()
    } catch (error) {
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {})
}

const reuseRecord = (item) => {
  detailDialogVisible.value = false
  // 导航到聊天页面并传递内容
  router.push({
    path: '/chat',
    query: { content: item.reply || '' }
  })
  ElMessage.success('已跳转到聊天页面')
}

const viewProject = (project) => {
  ElMessage.info(`查看项目: ${project}`)
}

// 辅助方法
const formatFileSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
}

const formatDate = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const isImageFile = (type) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(type?.toLowerCase())
const isAudioFile = (type) => ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(type?.toLowerCase())
const isPdfFile = (type) => type?.toLowerCase() === 'pdf'

const getFileTypeClass = (type) => {
  if (isImageFile(type)) return 'type-image'
  if (isAudioFile(type)) return 'type-audio'
  if (isPdfFile(type)) return 'type-pdf'
  return 'type-document'
}

const getFileTypeName = (type) => {
  if (isImageFile(type)) return '图片'
  if (isAudioFile(type)) return '音频'
  if (isPdfFile(type)) return 'PDF'
  if (type === 'chat') return '对话'
  if (type === 'reconstruct') return '重构'
  return '文档'
}

const getFileTypeTagType = (type) => {
  if (isImageFile(type)) return ''
  if (isAudioFile(type)) return 'warning'
  if (isPdfFile(type)) return 'danger'
  if (type === 'chat') return 'success'
  return 'info'
}

// 初始化
onMounted(() => {
  fetchHistoryList()
})
</script>

<style scoped>
.history-container {
  padding: 20px;
}

.history-card {
  min-height: calc(100vh - 140px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
}

.filter-section {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.loading-section {
  padding: 40px 0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.history-card-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.history-card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-card-item.is-selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.card-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
}

.card-content {
  padding: 16px;
}

.card-header-section {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.file-icon.type-image { background-color: #e6f7ff; color: #1890ff; }
.file-icon.type-audio { background-color: #fff7e6; color: #fa8c16; }
.file-icon.type-pdf { background-color: #fff1f0; color: #ff4d4f; }
.file-icon.type-document { background-color: #f6ffed; color: #52c41a; }

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.card-summary {
  margin-bottom: 12px;
}

.summary-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8em;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.upload-time,
.project-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情对话框 */
.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 20px 0 12px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
}

.agent-reply-section {
  margin-bottom: 20px;
}

.agent-reply-content {
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.agent-reply-content pre {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.projects-section {
  margin-top: 20px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-content {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.project-actions {
  display: flex;
  justify-content: center;
}
</style>
