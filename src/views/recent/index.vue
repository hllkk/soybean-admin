<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchGetRecentList, fetchDeleteRecent, fetchClearRecent, fetchAddRecent } from '@/service/api/disk';
import { useFilePreview } from '@/hooks/business/disk/use-file-preview';
import ImagePreview from '@/components/preview/image-preview.vue';
import FilePreviewOverlays from '@/components/disk/file-preview-overlays.vue';
import SimpleToolbar from '../disk/modules/simple-toolbar.vue';
import FileGrid from '../disk/modules/file-grid.vue';
import FileList from '../disk/modules/file-list.vue';
import FileEmpty from '@/components/disk/file-empty.vue';

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

// 图片预览 ref
const imagePreviewRef = ref<InstanceType<typeof ImagePreview>>();

// 将 RecentItem 转换为 FileItem 格式（用于复用文件组件）
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

const fileList = computed(() => recentList.value.map(convertToFileItem));

// 文件预览 hook
const preview = reactive(useFilePreview({ fileList, imagePreviewRef }));

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
function handleFileDblClick(file: Api.Disk.FileItem) {
  if (file.isFolder) {
    window.$message?.info('暂不支持预览文件夹');
    return;
  }
  fetchAddRecent(file.fileId);
  preview.previewByCategory(file);
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
          <FileEmpty v-if="showEmpty" :description="$t('page.disk.recent.empty')" />

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

    <!-- Image Preview -->
    <ImagePreview ref="imagePreviewRef" />
    <FilePreviewOverlays
      :video-preview-file="preview.videoPreviewFile"
      :video-preview-visible="preview.videoPreviewVisible"
      :video-stream-token="preview.videoStreamToken"
      :video-stream-base-url="preview.videoStreamBaseUrl"
      :audio-preview-file="preview.audioPreviewFile"
      :audio-preview-visible="preview.audioPreviewVisible"
      :audio-playlist="preview.audioPlaylist"
      :current-audio-index="preview.currentAudioIndex"
      :is-audio-compact="preview.isAudioCompact"
      :preview-visible="preview.previewVisible"
      :preview-file="preview.previewFile"
      @close-video="preview.closeVideoPreview"
      @video-token-update="preview.handleVideoTokenUpdate"
      @close-audio="preview.closeAudioPreview"
      @audio-overlay-click="preview.handleAudioOverlayClick"
      @update:is-audio-compact="preview.isAudioCompact = $event"
      @update:preview-visible="preview.previewVisible = $event"
    />
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>