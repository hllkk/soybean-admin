<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSSE } from '@/hooks/business/sse';

interface TaskProgress {
  taskId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'processing' | 'uploading' | 'downloading' | 'completed' | 'failed';
  error?: string;
  uploaded?: number;
  total?: number;
  downloaded?: number;
}

const { useSSEConnection } = useSSE();

const connectionId = 'disk-page';
const tasks = ref<Map<string, TaskProgress>>(new Map());
const activeTasks = computed(() => Array.from(tasks.value.values()));

let unsubscribeCompress: (() => void) | null = null;
let unsubscribeExtract: (() => void) | null = null;
let unsubscribeUpload: (() => void) | null = null;
let unsubscribeDownload: (() => void) | null = null;

const { isConnected, subscribe, close } = useSSEConnection(connectionId, {
  onOpen: () => {
    console.log('网盘SSE连接已建立');
  },
  onError: error => {
    console.error('网盘SSE连接错误:', error);
  },
  onClose: () => {
    console.log('网盘SSE连接已关闭');
  }
});

onMounted(() => {
  subscribeToDiskMessages();
});

onUnmounted(() => {
  if (unsubscribeCompress) unsubscribeCompress();
  if (unsubscribeExtract) unsubscribeExtract();
  if (unsubscribeUpload) unsubscribeUpload();
  if (unsubscribeDownload) unsubscribeDownload();
  close();
});

function subscribeToDiskMessages() {
  unsubscribeCompress = subscribe('disk_compress', message => {
    const data = message.data as Api.Sse.DiskCompressMessage['data'];
    updateTaskProgress(data);
  });

  unsubscribeExtract = subscribe('disk_extract', message => {
    const data = message.data as Api.Sse.DiskExtractMessage['data'];
    updateTaskProgress(data);
  });

  unsubscribeUpload = subscribe('disk_upload', message => {
    const data = message.data as Api.Sse.DiskUploadMessage['data'];
    updateTaskProgress({
      ...data,
      uploaded: data.uploaded,
      total: data.total
    });
  });

  unsubscribeDownload = subscribe('disk_download', message => {
    const data = message.data as Api.Sse.DiskDownloadMessage['data'];
    updateTaskProgress({
      ...data,
      downloaded: data.downloaded,
      total: data.total
    });
  });
}

function updateTaskProgress(task: TaskProgress) {
  tasks.value.set(task.taskId, task);

  if (task.status === 'completed') {
    window.$message?.success(`${task.fileName} ${getTaskTypeText(task.taskId)}完成`);
    setTimeout(() => {
      tasks.value.delete(task.taskId);
    }, 3000);
  } else if (task.status === 'failed') {
    window.$message?.error(`${task.fileName} ${getTaskTypeText(task.taskId)}失败: ${task.error}`);
    setTimeout(() => {
      tasks.value.delete(task.taskId);
    }, 5000);
  }
}

function getTaskTypeText(taskId: string) {
  if (taskId.startsWith('compress')) return '压缩';
  if (taskId.startsWith('extract')) return '解压';
  if (taskId.startsWith('upload')) return '上传';
  if (taskId.startsWith('download')) return '下载';
  return '操作';
}

function getStatusText(status: TaskProgress['status']) {
  const statusMap: Record<TaskProgress['status'], string> = {
    pending: '等待中',
    processing: '处理中',
    uploading: '上传中',
    downloading: '下载中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status];
}

function getStatusType(status: TaskProgress['status']) {
  const typeMap: Record<TaskProgress['status'], 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    pending: 'default',
    processing: 'info',
    uploading: 'info',
    downloading: 'info',
    completed: 'success',
    failed: 'error'
  };
  return typeMap[status];
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

function cancelTask(taskId: string) {
  tasks.value.delete(taskId);
  window.$message?.info('已取消任务');
}
</script>

<template>
  <div class="disk-sse-demo">
    <NCard title="网盘任务进度" :bordered="false">
      <template #header-extra>
        <NTag :type="isConnected ? 'success' : 'error'">
          {{ isConnected ? '已连接' : '未连接' }}
        </NTag>
      </template>

      <NEmpty v-if="activeTasks.length === 0" description="暂无进行中的任务" />

      <NList v-else bordered>
        <NListItem v-for="task in activeTasks" :key="task.taskId">
          <template #prefix>
            <NIcon size="24" :color="task.status === 'failed' ? '#f56c6c' : '#409eff'">
              <svg viewBox="0 0 1024 1024">
                <path
                  fill="currentColor"
                  d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 393.664H405.248a32 32 0 1 0 0 64h96.64v168.96a32 32 0 1 0 64 0V521.664h96.64a32 32 0 1 0 0-64H512V457.664zm-32-64a32 32 0 0 0 32-32V192a32 32 0 0 0-64 0v169.664a32 32 0 0 0 32 32z"
                />
              </svg>
            </NIcon>
          </template>

          <NThing>
            <template #header>
              <div class="task-header">
                <span class="task-name">{{ task.fileName }}</span>
                <NTag :type="getStatusType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </NTag>
              </div>
            </template>

            <template #description>
              <div class="task-info">
                <span v-if="task.uploaded !== undefined && task.total !== undefined">
                  已上传: {{ formatFileSize(task.uploaded) }} / {{ formatFileSize(task.total) }}
                </span>
                <span v-else-if="task.downloaded !== undefined && task.total !== undefined">
                  已下载: {{ formatFileSize(task.downloaded) }} / {{ formatFileSize(task.total) }}
                </span>
                <span v-else>进度: {{ task.progress }}%</span>
              </div>
            </template>

            <div class="task-progress">
              <NProgress
                type="line"
                :percentage="task.progress"
                :status="task.status === 'failed' ? 'error' : task.status === 'completed' ? 'success' : 'default'"
                :show-indicator="false"
              />
            </div>

            <div v-if="task.error" class="task-error">
              <NAlert type="error" :bordered="false">{{ task.error }}</NAlert>
            </div>
          </NThing>

          <template #suffix>
            <NButton
              v-if="task.status !== 'completed' && task.status !== 'failed'"
              text
              type="error"
              @click="cancelTask(task.taskId)"
            >
              取消
            </NButton>
          </template>
        </NListItem>
      </NList>
    </NCard>
  </div>
</template>

<style scoped>
.disk-sse-demo {
  padding: 16px;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-name {
  font-weight: 500;
  font-size: 14px;
}

.task-info {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.task-progress {
  margin-top: 8px;
}

.task-error {
  margin-top: 8px;
}
</style>
