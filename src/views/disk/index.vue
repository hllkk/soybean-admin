<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchGetFileList, fetchCreateFolder, fetchCreateFile, fetchRenameFile, mapBackendFileList, fetchGetQuota } from '@/service/api/disk';
import { fetchGenerateStreamToken } from '@/service/api/disk';
import { getServiceBaseURL } from '@/utils/service';
import { getToken } from '@/store/modules/auth/shared';
import { getPreviewCategory } from '@/utils/file-type';
import FileTypeMenu from './modules/file-type-menu.vue';
import Toolbar from './modules/toolbar.vue';
import Breadcrumb from './modules/breadcrumb.vue';
import FileGrid from './modules/file-grid.vue';
import FileList from './modules/file-list.vue';
import TransferPanel from './modules/transfer-panel.vue';
import MoveCopyDialog from './modules/move-copy-dialog.vue';
import VideoPreview from '@/components/preview/video-preview.vue';
import FilePreviewOverlay from '@/components/preview/file-preview-overlay.vue';

defineOptions({
  name: 'DiskPage'
});

const diskStore = useDiskStore();
const route = useRoute();
const router = useRouter();
const { loading, startLoading, endLoading } = useLoading();

const fileList = ref<Api.Disk.FileItem[]>([]);
const transferPanelRef = ref<InstanceType<typeof TransferPanel>>();
const totalCount = ref(0);

// 重命名状态
const renamingFile = ref<Api.Disk.FileItem | null>(null);

// 文件预览
const previewVisible = ref(false);
const previewFile = ref<Api.Disk.PreviewFileInfo | null>(null);

// 当前目录下的音频文件列表（用于播放列表）
const audioPlaylist = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const token = getToken();

  return fileList.value
    .filter(file => file.fileType === 'audio' && !file.isFolder)
    .map(file => ({
      id: file.fileId,
      title: file.music?.songName || file.fileName.replace(/\.[^.]+$/, ''),
      artist: file.music?.singer || '未知歌手',
      album: file.music?.album || '',
      cover: file.mediaCover ? `${baseURL}/view/cover?id=${file.fileId}&token=${token}` : '',
      src: `${baseURL}/preview/file/${file.fileId}?token=${token}`,
      duration: undefined, // 后端暂未返回时长，由 audio 元素获取
      lyrics: undefined // 后端暂不支持歌词，可后续扩展单独接口获取
    }));
});

// 当前播放曲目在播放列表中的索引
const currentAudioIndex = computed(() => {
  if (!diskStore.audioPreviewRow) return 0;
  return audioPlaylist.value.findIndex(item => String(item.id) === String(diskStore.audioPreviewRow?.fileId));
});

// 显示容量开关
const showCapacity = ref(true);

// Audio compact mode state
const isAudioCompact = ref(false);

// 视频预览状态
const videoStreamToken = ref('');
const videoStreamBaseUrl = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return `${baseURL}/stream/video/${diskStore.videoPreviewRow?.fileId}`;
});

function handleVideoClose() {
  diskStore.videoPreviewVisible = false;
  diskStore.videoPreviewRow = null;
  videoStreamToken.value = '';
}

function handleVideoTokenUpdate(token: string) {
  videoStreamToken.value = token;
}

async function openVideoPreview(file: Api.Disk.FileItem) {
  const res = await fetchGenerateStreamToken(String(file.fileId));
  if (res.data) {
    videoStreamToken.value = res.data.token;
    diskStore.videoPreviewRow = file;
    diskStore.videoPreviewVisible = true;
  }
}

function handleAudioOverlayClick() {
  if (!isAudioCompact.value) {
    diskStore.audioPreviewVisible = false;
    diskStore.audioPreviewRow = null;
  }
}

function handleAudioClose() {
  diskStore.audioPreviewVisible = false;
  diskStore.audioPreviewRow = null;
  isAudioCompact.value = false;
}

// 配额信息
const quotaInfo = ref<Api.Disk.QuotaInfo>({
  usedSpace: 0,
  quota: 0,
  unlimited: false,
  quotaSource: 'none'
});
const quotaLoading = ref(false);

// 测试数据 - 用于无后端时测试前端效果
const mockFileList: Api.Disk.FileItem[] = [
  {
    fileId: '1',
    fileName: '项目文档',
    isFolder: true,
    fileType: 'folder',
    fileSize: 0,
    filePath: '/项目文档',
    parentId: null,
    createTime: '2024-01-15 10:30:00',
    createBy: 'admin',
    updateTime: '2024-01-15 10:30:00',
    updateBy: 'admin',
    modifyTime: '2024-01-15 10:30:00'
  },
  {
    fileId: '2',
    fileName: '设计素材',
    isFolder: true,
    fileType: 'folder',
    fileSize: 0,
    filePath: '/设计素材',
    parentId: null,
    createTime: '2024-01-14 09:20:00',
    createBy: 'admin',
    updateTime: '2024-01-14 09:20:00',
    updateBy: 'admin',
    modifyTime: '2024-01-14 09:20:00'
  },
  {
    fileId: '3',
    fileName: '产品需求文档.pdf',
    isFolder: false,
    fileType: 'document',
    fileExtension: 'pdf',
    fileSize: 2048576,
    filePath: '/产品需求文档.pdf',
    parentId: null,
    createTime: '2024-01-13 14:50:00',
    createBy: 'admin',
    updateTime: '2024-01-13 14:50:00',
    updateBy: 'admin',
    modifyTime: '2024-01-13 14:50:00'
  },
  {
    fileId: '4',
    fileName: '会议记录.docx',
    isFolder: false,
    fileType: 'document',
    fileExtension: 'docx',
    fileSize: 51200,
    filePath: '/会议记录.docx',
    parentId: null,
    createTime: '2024-01-12 11:30:00',
    createBy: 'admin',
    updateTime: '2024-01-12 11:30:00',
    updateBy: 'admin',
    modifyTime: '2024-01-12 11:30:00'
  },
  {
    fileId: '5',
    fileName: '系统架构图.png',
    isFolder: false,
    fileType: 'image',
    fileExtension: 'png',
    fileSize: 1536000,
    filePath: '/系统架构图.png',
    parentId: null,
    createTime: '2024-01-11 16:20:00',
    createBy: 'admin',
    updateTime: '2024-01-11 16:20:00',
    updateBy: 'admin',
    modifyTime: '2024-01-11 16:20:00'
  },
  {
    fileId: '6',
    fileName: '产品截图.jpg',
    isFolder: false,
    fileType: 'image',
    fileExtension: 'jpg',
    fileSize: 204800,
    filePath: '/产品截图.jpg',
    parentId: null,
    createTime: '2024-01-10 09:15:00',
    createBy: 'admin',
    updateTime: '2024-01-10 09:15:00',
    updateBy: 'admin',
    modifyTime: '2024-01-10 09:15:00'
  },
  {
    fileId: '7',
    fileName: '演示视频.mp4',
    isFolder: false,
    fileType: 'video',
    fileExtension: 'mp4',
    fileSize: 52428800,
    filePath: '/演示视频.mp4',
    parentId: null,
    createTime: '2024-01-09 13:40:00',
    createBy: 'admin',
    updateTime: '2024-01-09 13:40:00',
    updateBy: 'admin',
    modifyTime: '2024-01-09 13:40:00'
  },
  {
    fileId: '8',
    fileName: '宣传配乐.mp3',
    isFolder: false,
    fileType: 'audio',
    fileExtension: 'mp3',
    fileSize: 3145728,
    filePath: '/宣传配乐.mp3',
    parentId: null,
    createTime: '2024-01-08 08:00:00',
    createBy: 'admin',
    updateTime: '2024-01-08 08:00:00',
    updateBy: 'admin',
    modifyTime: '2024-01-08 08:00:00'
  },
  {
    fileId: '9',
    fileName: '数据分析.xlsx',
    isFolder: false,
    fileType: 'document',
    fileExtension: 'xlsx',
    fileSize: 102400,
    filePath: '/数据分析.xlsx',
    parentId: null,
    createTime: '2024-01-07 15:30:00',
    createBy: 'admin',
    updateTime: '2024-01-07 15:30:00',
    updateBy: 'admin',
    modifyTime: '2024-01-07 15:30:00'
  },
  {
    fileId: '10',
    fileName: '配置文件.json',
    isFolder: false,
    fileType: 'other',
    fileExtension: 'json',
    fileSize: 2048,
    filePath: '/配置文件.json',
    parentId: null,
    createTime: '2024-01-06 12:00:00',
    createBy: 'admin',
    updateTime: '2024-01-06 12:00:00',
    updateBy: 'admin',
    modifyTime: '2024-01-06 12:00:00'
  },
  {
    fileId: '11',
    fileName: '日志文件.log',
    isFolder: false,
    fileType: 'other',
    fileExtension: 'log',
    fileSize: 8192,
    filePath: '/日志文件.log',
    parentId: null,
    createTime: '2024-01-05 17:45:00',
    createBy: 'admin',
    updateTime: '2024-01-05 17:45:00',
    updateBy: 'admin',
    modifyTime: '2024-01-05 17:45:00'
  },
  {
    fileId: '12',
    fileName: '压缩包.zip',
    isFolder: false,
    fileType: 'other',
    fileExtension: 'zip',
    fileSize: 10485760,
    filePath: '/压缩包.zip',
    parentId: null,
    createTime: '2024-01-04 10:20:00',
    createBy: 'admin',
    updateTime: '2024-01-04 10:20:00',
    updateBy: 'admin',
    modifyTime: '2024-01-04 10:20:00'
  }
];

// 根据文件类型过滤测试数据
function getMockFilesByType(type: string): Api.Disk.FileItem[] {
  if (type === 'all') return mockFileList;
  return mockFileList.filter(file => file.fileType === type);
}

const searchParams = ref<Api.Disk.FileSearchParams>({
  pageNum: 1,
  pageSize: 100,
  fileType: null,
  keyword: null,
  parentId: null,
  sortField: null,
  sortOrder: null
});

async function loadQuotaInfo() {
  quotaLoading.value = true;
  const { data, error } = await fetchGetQuota();
  if (!error && data) {
    quotaInfo.value = data;
  }
  quotaLoading.value = false;
}

async function getFileList() {
  startLoading();

  searchParams.value.fileType = diskStore.currentFileType === 'all' ? null : diskStore.currentFileType;
  searchParams.value.parentId = diskStore.currentParentId;
  searchParams.value.sortField = diskStore.sortSettings.field;
  searchParams.value.sortOrder = diskStore.sortSettings.order;

  const { data, error } = await fetchGetFileList(searchParams.value);

  if (!error && data) {
    const mapped = mapBackendFileList(data);
    if (mapped.rows.length > 0) {
      fileList.value = mapped.rows;
      totalCount.value = mapped.total;
    } else {
      fileList.value = [];
      totalCount.value = 0;
    }
  } else {
    // 后端无数据或请求失败，使用测试数据
    const mockFiles = getMockFilesByType(diskStore.currentFileType);
    fileList.value = mockFiles;
    totalCount.value = mockFiles.length;
  }

  endLoading();
  diskStore.currentFileList = fileList.value;
}

async function handleFileCreated(name: string) {
  const { error } = await fetchCreateFile({
    fileName: name,
    folderPath: diskStore.getCurrentPathString()
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
  }
  diskStore.cancelCreating();
  getFileList();
}

async function handleFolderCreated(name: string) {
  const { error } = await fetchCreateFolder({
    fileName: name,
    folderPath: diskStore.getCurrentPathString()
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
  }
  diskStore.cancelCreating();
  getFileList();
}

function handleSearch(keyword: string) {
  searchParams.value.keyword = keyword || null;
  getFileList();
}

function handleRefresh() {
  getFileList();
}

function handleFileDblClick(file: Api.Disk.FileItem) {
  if (file.isFolder) return;

  const category = getPreviewCategory(file.fileName);

  // 代码和 Markdown 文件使用新的 TextPreview
  if (category === 'code' || category === 'markdown') {
    diskStore.textPreviewRow = file;
    diskStore.textPreviewVisible = true;
  } else if (category === 'audio') {
    // 音频文件使用 AudioPreview
    diskStore.audioPreviewRow = file;
    diskStore.audioPreviewVisible = true;
  } else if (category === 'video') {
    // 视频文件使用 VideoPreview
    openVideoPreview(file);
  } else {
    // 其他文件使用预览 Modal
    previewFile.value = {
      fileId: file.fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileExtension: file.fileExtension,
      filePath: file.filePath
    };
    previewVisible.value = true;
  }
}

function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'rename':
      diskStore.startRenaming(file.fileId, file.fileName);
      renamingFile.value = file;
      break;
    case 'copy':
      diskStore.openMoveCopyDialog('copy', [file]);
      break;
    case 'move':
      diskStore.openMoveCopyDialog('move', [file]);
      break;
    case 'delete':
      handleDeleteFile(file);
      break;
    case 'share':
      window.$message?.info(`${$t('page.disk.toolbar.share')}: ${file.fileName}`);
      break;
    case 'download':
      window.$message?.info(`${$t('page.disk.toolbar.download')}: ${file.fileName}`);
      break;
    default:
      break;
  }
}

function handleToolbarRename() {
  const selectedFileIds = diskStore.selectedFiles;
  if (selectedFileIds.length !== 1) return;

  const file = diskStore.currentFileList.find(f => f.fileId === selectedFileIds[0]);
  if (!file) return;

  diskStore.startRenaming(file.fileId, file.fileName);
  renamingFile.value = file;
}

async function handleRenameConfirm(newName: string) {
  if (!renamingFile.value || !newName.trim()) return;
  if (newName.trim() === renamingFile.value.fileName) {
    diskStore.cancelRenaming();
    renamingFile.value = null;
    return;
  }
  const { error } = await fetchRenameFile(renamingFile.value.fileId, newName.trim());
  if (!error) {
    window.$message?.success($t('page.disk.moveCopy.renameSuccess'));
    diskStore.cancelRenaming();
    renamingFile.value = null;
    getFileList();
  }
}

async function handleDeleteFile(file: Api.Disk.FileItem) {
  window.$dialog?.warning({
    title: $t('page.disk.toolbar.delete'),
    content: `${$t('page.disk.moveCopy.deleteConfirm')} "${file.fileName}"?`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { fetchDeleteFile } = await import('@/service/api/disk/file');
      const { error } = await fetchDeleteFile([file.fileId]);
      if (!error) {
        window.$message?.success($t('page.disk.moveCopy.deleteSuccess'));
        getFileList();
      }
    }
  });
}

function handleToolbarDelete() {
  const selectedFileIds = diskStore.selectedFiles;
  if (selectedFileIds.length === 0) return;

  const selectedFiles = diskStore.currentFileList.filter(f => selectedFileIds.includes(f.fileId));
  if (selectedFiles.length === 0) return;

  const fileNames = selectedFiles.map(f => f.fileName).join(', ');
  const isMultiple = selectedFiles.length > 1;

  window.$dialog?.warning({
    title: $t('page.disk.toolbar.delete'),
    content: isMultiple
      ? `${$t('page.disk.moveCopy.deleteConfirm')} ${selectedFiles.length} 个文件?\n${fileNames}`
      : `${$t('page.disk.moveCopy.deleteConfirm')} "${selectedFiles[0].fileName}"?`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { fetchDeleteFile } = await import('@/service/api/disk/file');
      const { error } = await fetchDeleteFile(selectedFileIds);
      if (!error) {
        window.$message?.success($t('page.disk.moveCopy.deleteSuccess'));
        diskStore.clearSelection();
        getFileList();
      }
    }
  });
}

// Watch file type changes
watch(() => diskStore.currentFileType, () => {
  getFileList();
});

// Watch path changes
watch(() => diskStore.currentParentId, () => {
  getFileList();
});

// Watch sort changes
watch(() => diskStore.sortSettings, () => {
  getFileList();
}, { deep: true });

// Watch upload completions to auto-refresh file list
let prevCompletedCount = 0;
watch(
  () => diskStore.transferList.filter(item => item.transferType === 'upload' && item.status === 'completed').length,
  completedCount => {
    if (completedCount > prevCompletedCount) {
      prevCompletedCount = completedCount;
      getFileList();
      loadQuotaInfo();
    }
  }
);

// Watch URL path changes (browser back/forward)
watch(() => route.query.path, async (newPath) => {
  const currentPathStr = diskStore.getCurrentPathString();
  // 解码URL路径
  const decodedNewPath = newPath
    ? decodeURIComponent(newPath as string)
    : '/';

  // 只有当URL路径与当前状态不同时才恢复
  if (decodedNewPath !== currentPathStr) {
    const success = await diskStore.restoreFromPath(decodedNewPath);
    if (!success && decodedNewPath !== '/') {
      // 路径不存在，重定向到根目录
      window.$message?.warning('路径不存在，已返回根目录');
      router.replace({ name: 'disk' });
    }
    getFileList();
  }
});

onMounted(async () => {
  // 从URL恢复路径状态
  const pathParam = route.query.path as string;
  if (pathParam) {
    // 解码URL路径
    const decodedPath = decodeURIComponent(pathParam);
    const success = await diskStore.restoreFromPath(decodedPath);
    if (!success) {
      window.$message?.warning('路径不存在，已返回根目录');
      router.replace({ name: 'disk' });
    }
  }
  getFileList();
  loadQuotaInfo();
});
</script>

<template>
  <TableSiderLayout sider-title="文件管理">
    <template #header-extra>
      <NTooltip trigger="hover">
        <template #trigger>
          <NSwitch v-model:value="showCapacity" :round="false" />
        </template>
        显示容量
      </NTooltip>
    </template>
    <template #sider>
      <NDivider dashed />
      <FileTypeMenu
        :show-capacity="showCapacity"
        :quota-info="quotaInfo"
        :quota-loading="quotaLoading"
      />
    </template>

    <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
      <!-- File Display Area -->
      <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
        <div class="h-full flex flex-col">
          <!-- Toolbar -->
          <Toolbar
            @search="handleSearch"
            @refresh="handleRefresh"
            @delete="handleToolbarDelete"
            @rename="handleToolbarRename"
            @show-transfer="transferPanelRef?.showDefault()"
          />
          <!-- Breadcrumb -->
          <Breadcrumb :total-count="totalCount" />
          <!-- File Content -->
          <div class="flex-1 overflow-hidden lt-sm:flex-initial lt-sm:overflow-auto">
            <FileGrid
              v-if="diskStore.viewMode === 'grid'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
              @file-created="handleFileCreated"
              @folder-created="handleFolderCreated"
              @file-share="handleFileAction('share', $event)"
              @file-download="handleFileAction('download', $event)"
              @file-delete="handleFileAction('delete', $event)"
              @file-rename="handleFileAction('rename', $event)"
              @file-rename-confirm="handleRenameConfirm"
              @file-rename-cancel="() => { diskStore.cancelRenaming(); renamingFile = null; }"
              @file-copy="handleFileAction('copy', $event)"
              @file-move="handleFileAction('move', $event)"
              @refresh="handleRefresh"
            />
            <FileList
              v-if="diskStore.viewMode === 'list'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
              @file-created="handleFileCreated"
              @folder-created="handleFolderCreated"
              @file-share="handleFileAction('share', $event)"
              @file-download="handleFileAction('download', $event)"
              @file-delete="handleFileAction('delete', $event)"
              @file-rename="handleFileAction('rename', $event)"
              @file-rename-confirm="handleRenameConfirm"
              @file-rename-cancel="() => { diskStore.cancelRenaming(); renamingFile = null; }"
              @file-copy="handleFileAction('copy', $event)"
              @file-move="handleFileAction('move', $event)"
              @refresh="handleRefresh"
            />
          </div>
        </div>
      </NCard>
    </div>

    <!-- Transfer Panel -->
    <TransferPanel ref="transferPanelRef" />

    <!-- Move/Copy Dialog -->
    <MoveCopyDialog @success="getFileList" />

    <!-- File Preview Overlay -->
    <FilePreviewOverlay
      v-model:visible="previewVisible"
      :file="previewFile"
    />

    <!-- Audio Preview Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="diskStore.audioPreviewVisible"
          class="fixed inset-0 z-9999 flex items-center justify-center"
          :class="isAudioCompact ? 'pointer-events-none' : 'bg-black/40 backdrop-blur-sm'"
          @click.self="handleAudioOverlayClick"
        >
          <AudioPreview
            v-if="diskStore.audioPreviewRow && audioPlaylist.length > 0"
            :playlist="audioPlaylist"
            :initial-index="currentAudioIndex"
            @close="handleAudioClose"
            @compact-change="isAudioCompact = $event"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- Video Preview Overlay -->
    <Teleport to="body">
      <VideoPreview
        v-if="diskStore.videoPreviewVisible && diskStore.videoPreviewRow && videoStreamToken"
        :src="videoStreamBaseUrl"
        :file-name="diskStore.videoPreviewRow.fileName"
        :stream-token="videoStreamToken"
        @close="handleVideoClose"
        @token-update="handleVideoTokenUpdate"
      />
    </Teleport>

    <!-- Text Preview (opsMaster version) -->
    <TextPreview />
  </TableSiderLayout>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.n-divider) {
  margin: 0 !important;
}

// 音频预览遮罩层过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
