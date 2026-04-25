<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { getToken } from '@/store/modules/auth/shared';
import {
  fetchGetRecentList,
  fetchDeleteRecent,
  fetchClearRecent,
  fetchAddRecent,
  fetchGenerateStreamToken
} from '@/service/api/disk';
import { getPreviewCategory } from '@/utils/file-type';
import { getServiceBaseURL } from '@/utils/service';
import SimpleToolbar from '../disk/modules/simple-toolbar.vue';
import FileGrid from '../disk/modules/file-grid.vue';
import FileList from '../disk/modules/file-list.vue';
import FileEmpty from '../disk/modules/file-empty.vue';
import FilePreviewOverlay from '@/components/preview/file-preview-overlay.vue';
import ImagePreview from '@/components/preview/image-preview.vue';
import VideoPreview from '@/components/preview/video-preview.vue';
import AudioPreview from '@/components/preview/audio-preview.vue';
import TextPreview from '@/components/preview/text-preview.vue';

defineOptions({
  name: 'RecentPage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

// 搜索参数
const searchParams = ref<Api.Disk.RecentListParams>({
  pageNum: 1,
  pageSize: 100,
  sortField: null,
  sortOrder: null
});

// 最近访问列表
const recentList = ref<Api.Disk.RecentItem[]>([]);

// 本地选中状态（不污染 diskStore）
const selectedFiles = ref<CommonType.IdType[]>([]);

// Office/PDF 预览
const previewVisible = ref(false);
const previewFile = ref<Api.Disk.PreviewFileInfo | null>(null);

// 图片预览
const imagePreviewRef = ref<InstanceType<typeof ImagePreview>>();

// 视频预览
const videoPreviewVisible = ref(false);
const videoPreviewFile = ref<Api.Disk.FileItem | null>(null);
const videoStreamToken = ref('');

// 音频预览
const audioPreviewVisible = ref(false);
const audioPreviewFile = ref<Api.Disk.FileItem | null>(null);
const isAudioCompact = ref(false);

// 将 RecentItem 转换为 FileItem 格式（用于复用文件组件）
// fileId：真正的文件ID（用于缩略图显示）
// recordId：访问记录ID（用于删除操作）
function convertToFileItem(item: Api.Disk.RecentItem): Api.Disk.FileItem {
  return {
    fileId: item.fileId,
    recordId: item.recordId,
    fileName: item.fileName,
    fileType: item.fileType,
    fileExtension: item.fileExtension,
    fileSize: item.fileSize,
    filePath: item.filePath,
    parentId: null,
    isFolder: item.isFolder,
    modifyTime: item.visitTime,
    createTime: item.visitTime,
    updateTime: item.visitTime,
    createBy: '',
    updateBy: '',
    mediaCover: item.hasMediaCover
  };
}

// 转换后的文件列表
const fileList = computed(() => recentList.value.map(convertToFileItem));

// 音频播放列表（从最近访问列表筛选）
const audioPlaylist = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const token = getToken();

  return fileList.value
    .filter(file => !file.isFolder && getPreviewCategory(file.fileName) === 'audio')
    .map(file => ({
      id: file.fileId,
      title: file.fileName.replace(/\.[^.]+$/, ''),
      artist: '未知歌手',
      album: '',
      cover: file.mediaCover ? `${baseURL}/view/cover?id=${file.fileId}&token=${token}` : '',
      src: `${baseURL}/preview/file/${file.fileId}?token=${token}`,
      duration: undefined,
      lyrics: undefined
    }));
});

// 当前播放曲目索引
const currentAudioIndex = computed(() => {
  if (!audioPreviewFile.value) return 0;
  return audioPlaylist.value.findIndex(item => String(item.id) === String(audioPreviewFile.value?.fileId));
});

// 视频预览 URL
const videoStreamBaseUrl = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return `${baseURL}/stream/video/${videoPreviewFile.value?.fileId}`;
});

// 选中数量
const selectedCount = computed(() => selectedFiles.value.length);

// 是否显示空状态
const showEmpty = computed(() => recentList.value.length === 0 && !loading.value);

// 获取最近访问列表
async function getData() {
  startLoading();
  const { data, error } = await fetchGetRecentList(searchParams.value);
  endLoading();

  if (!error && data) {
    recentList.value = data.rows || [];
  } else {
    recentList.value = [];
  }
}

// 处理排序
function handleSort(field: string, order: 'asc' | 'desc') {
  searchParams.value.sortField = field as 'visitTime' | 'fileName' | 'size';
  searchParams.value.sortOrder = order;
  getData();
}

// 切换视图
function toggleView() {
  diskStore.setViewMode(diskStore.viewMode === 'grid' ? 'list' : 'grid');
}

// 取消选中
function handleClearSelection() {
  selectedFiles.value = [];
}

// 处理选中状态变化
function handleSelectionChange(files: CommonType.IdType[]) {
  selectedFiles.value = files;
}

// 清除选中项的访问记录
async function handleClearRecent() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.warning({
    title: $t('page.disk.recent.remove'),
    content: `确定要删除 ${selectedIds.length} 条访问记录吗？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      const { error } = await fetchDeleteRecent(selectedIds);
      endLoading();

      if (!error) {
        recentList.value = recentList.value.filter(item => !selectedIds.includes(item.recordId));
        selectedFiles.value = [];
        window.$message?.success('已删除访问记录');
      } else {
        window.$message?.error('删除失败');
      }
    }
  });
}

// 清空全部访问记录
function handleClearAll() {
  window.$dialog?.warning({
    title: $t('page.disk.recent.clearAll'),
    content: '确定要清空全部访问记录吗？',
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      const { error } = await fetchClearRecent();
      endLoading();

      if (!error) {
        recentList.value = [];
        selectedFiles.value = [];
        window.$message?.success('已清空全部访问记录');
      } else {
        window.$message?.error('清空失败');
      }
    }
  });
}

// 处理文件双击 - 打开预览
async function handleFileDblClick(file: Api.Disk.FileItem) {
  if (file.isFolder) {
    window.$message?.info('暂不支持预览文件夹');
    return;
  }

  // 更新最近访问记录
  fetchAddRecent(file.fileId);

  const category = getPreviewCategory(file.fileName);

  switch (category) {
    case 'image':
      openImagePreview(file);
      break;
    case 'video':
      await openVideoPreview(file);
      break;
    case 'audio':
      openAudioPreview(file);
      break;
    case 'office':
    case 'pdf':
      openOfficePdfPreview(file);
      break;
    case 'code':
    case 'markdown':
      openTextPreview(file);
      break;
    default:
      window.$notification?.warning({
        content: '暂不支持预览此类型文件',
        duration: 3000
      });
  }
}

// 图片预览
function openImagePreview(file: Api.Disk.FileItem) {
  const images = fileList.value
    .filter(f => !f.isFolder && getPreviewCategory(f.fileName) === 'image')
    .map(f => ({ fileId: f.fileId, fileName: f.fileName }));

  const initialIndex = images.findIndex(img => String(img.fileId) === String(file.fileId));

  nextTick(() => {
    imagePreviewRef.value?.show(images, initialIndex >= 0 ? initialIndex : 0);
  });
}

// 视频预览
async function openVideoPreview(file: Api.Disk.FileItem) {
  const res = await fetchGenerateStreamToken(String(file.fileId));
  if (res.data) {
    videoStreamToken.value = res.data.token;
    videoPreviewFile.value = file;
    videoPreviewVisible.value = true;
  }
}

// 音频预览
function openAudioPreview(file: Api.Disk.FileItem) {
  audioPreviewFile.value = file;
  audioPreviewVisible.value = true;
}

// Office/PDF 预览
function openOfficePdfPreview(file: Api.Disk.FileItem) {
  previewFile.value = {
    fileId: file.fileId,
    fileName: file.fileName,
    fileSize: file.fileSize,
    fileExtension: file.fileExtension,
    filePath: file.filePath
  };
  previewVisible.value = true;
}

// 文本预览（使用 diskStore 状态）
function openTextPreview(file: Api.Disk.FileItem) {
  diskStore.textPreviewRow = file;
  diskStore.textPreviewVisible = true;
}

// 视频关闭
function handleVideoClose() {
  videoPreviewVisible.value = false;
  videoPreviewFile.value = null;
  videoStreamToken.value = '';
}

function handleVideoTokenUpdate(token: string) {
  videoStreamToken.value = token;
}

// 音频关闭
function handleAudioClose() {
  audioPreviewVisible.value = false;
  audioPreviewFile.value = null;
  isAudioCompact.value = false;
}

function handleAudioOverlayClick() {
  if (!isAudioCompact.value) {
    audioPreviewVisible.value = false;
    audioPreviewFile.value = null;
  }
}

// 处理文件操作
function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'download':
      window.$message?.info('下载功能开发中');
      break;
    case 'delete':
      // 删除操作使用 recordId（访问记录ID），而非 fileId（文件ID）
      selectedFiles.value = [file.recordId!];
      handleClearRecent();
      break;
  }
}

// 下载功能提示
function handleDownloadTip() {
  window.$message?.info('下载功能开发中');
}

// 初始化
getData();
</script>

<template>
  <div class="min-h-500px h-full flex-col-stretch gap-0 overflow-hidden lt-lg:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper h-full flex-1-hidden">
      <div class="h-full flex flex-col">
        <!-- 简化工具栏 -->
        <SimpleToolbar
          page-type="recent"
          :selected-count="selectedCount"
          @sort="handleSort"
          @toggle-view="toggleView"
          @refresh="getData"
          @clear-selection="handleClearSelection"
          @clear-recent="handleClearRecent"
          @clear-all="handleClearAll"
          @download="handleDownloadTip"
        />

        <!-- 内容区域 -->
        <div class="flex-1 overflow-hidden lt-sm:flex-initial lt-sm:overflow-auto">
          <!-- 空状态 -->
          <FileEmpty v-if="showEmpty" />

          <!-- 网格视图 -->
          <FileGrid
            v-if="!showEmpty && diskStore.viewMode === 'grid'"
            :files="fileList"
            :loading="loading"
            :selected-files="selectedFiles"
            page-type="recent"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-download="handleFileAction('download', $event)"
            @file-delete="handleFileAction('delete', $event)"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />

          <!-- 列表视图 -->
          <FileList
            v-if="!showEmpty && diskStore.viewMode === 'list'"
            :files="fileList"
            :loading="loading"
            :selected-files="selectedFiles"
            page-type="recent"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-download="handleFileAction('download', $event)"
            @file-delete="handleFileAction('delete', $event)"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />
        </div>
      </div>
    </NCard>

    <!-- Office/PDF 预览 -->
    <FilePreviewOverlay
      v-model:visible="previewVisible"
      :file="previewFile"
    />

    <!-- 图片预览 -->
    <ImagePreview ref="imagePreviewRef" />

    <!-- 视频预览 -->
    <Teleport to="body">
      <VideoPreview
        v-if="videoPreviewVisible && videoPreviewFile && videoStreamToken"
        :src="videoStreamBaseUrl"
        :file-name="videoPreviewFile.fileName"
        :stream-token="videoStreamToken"
        @close="handleVideoClose"
        @token-update="handleVideoTokenUpdate"
      />
    </Teleport>

    <!-- 音频预览 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="audioPreviewVisible"
          class="fixed inset-0 z-9999 flex items-center justify-center"
          :class="isAudioCompact ? 'pointer-events-none' : 'bg-black/40 backdrop-blur-sm'"
          @click.self="handleAudioOverlayClick"
        >
          <AudioPreview
            v-if="audioPreviewFile && audioPlaylist.length > 0"
            :playlist="audioPlaylist"
            :initial-index="currentAudioIndex"
            @close="handleAudioClose"
            @compact-change="isAudioCompact = $event"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- 文本预览 -->
    <TextPreview />
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
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