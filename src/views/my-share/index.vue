<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchGetMyShareList, fetchCancelShare } from '@/service/api/disk/share';
import { handleCopy } from '@/utils/copy';
import SimpleToolbar from '../disk/modules/simple-toolbar.vue';
import FileGrid from '../disk/modules/file-grid.vue';
import FileList from '../disk/modules/file-list.vue';
import FileEmpty from '../disk/modules/file-empty.vue';

defineOptions({
  name: 'MySharePage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

// 搜索参数
const searchParams = ref<Api.Disk.MyShareListParams>({
  pageNum: 1,
  pageSize: 100,
  sortField: null,
  sortOrder: null
});

// 分享列表数据
const shareList = ref<Api.Disk.MyShareItem[]>([]);

// 本地选中状态（不污染 diskStore）
const selectedFiles = ref<CommonType.IdType[]>([]);

// 将 MyShareItem 转换为 FileItem 格式（用于复用 FileGrid/FileList）
function convertToFileItem(item: Api.Disk.MyShareItem): Api.Disk.FileItem {
  // 根据 contentType 推断 fileType
  let fileType = 'other';
  const contentType = item.contentType?.toLowerCase() || '';
  if (contentType.includes('image')) fileType = 'image';
  else if (contentType.includes('video')) fileType = 'video';
  else if (contentType.includes('audio')) fileType = 'audio';
  else if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) fileType = 'document';

  return {
    fileId: item.shareId, // 使用 shareId 作为临时 fileId
    fileName: item.fileName,
    fileType: fileType,
    fileExtension: contentType.split('/').pop(),
    fileSize: 0, // MyShareItem 没有 fileSize
    filePath: '',
    parentId: null,
    isFolder: item.isFolder,
    modifyTime: item.createDate,
    createTime: item.createDate,
    updateTime: item.createDate,
    createBy: '',
    updateBy: ''
  };
}

// 转换后的文件列表
const fileList = computed(() => shareList.value.map(convertToFileItem));

// 选中数量
const selectedCount = computed(() => selectedFiles.value.length);

// 是否显示空状态
const showEmpty = computed(() => shareList.value.length === 0 && !loading.value);

// 获取分享列表
async function getData() {
  startLoading();
  const { data, error } = await fetchGetMyShareList(searchParams.value);
  endLoading();

  if (!error && data) {
    shareList.value = data.rows || [];
  } else {
    // 使用 mock 数据测试
    shareList.value = getMockShareList();
  }
}

// Mock 数据
function getMockShareList(): Api.Disk.MyShareItem[] {
  return [
    {
      shareId: 1,
      shortId: 'abc123',
      fileName: '项目文档.zip',
      contentType: 'application/zip',
      isFolder: false,
      createDate: '2024-04-20 10:30:00',
      expireDate: '2024-05-20 10:30:00',
      isPrivate: false,
      viewCount: 15,
      downloadCount: 5
    },
    {
      shareId: 2,
      shortId: 'def456',
      fileName: '设计素材',
      contentType: 'folder',
      isFolder: true,
      createDate: '2024-04-18 14:20:00',
      expireDate: null,
      isPrivate: true,
      viewCount: 30,
      downloadCount: 10
    },
    {
      shareId: 3,
      shortId: 'ghi789',
      fileName: '会议纪要.pdf',
      contentType: 'application/pdf',
      isFolder: false,
      createDate: '2024-04-15 09:00:00',
      expireDate: '2024-04-30 09:00:00',
      isPrivate: false,
      viewCount: 8,
      downloadCount: 3
    },
    {
      shareId: 4,
      shortId: 'jkl012',
      fileName: '产品截图.png',
      contentType: 'image/png',
      isFolder: false,
      createDate: '2024-04-10 16:45:00',
      expireDate: '2024-05-10 16:45:00',
      isPrivate: false,
      viewCount: 22,
      downloadCount: 8
    },
    {
      shareId: 5,
      shortId: 'mno345',
      fileName: '演示视频.mp4',
      contentType: 'video/mp4',
      isFolder: false,
      createDate: '2024-04-05 11:30:00',
      expireDate: null,
      isPrivate: false,
      viewCount: 45,
      downloadCount: 20
    }
  ];
}

// 处理排序
function handleSort(field: string, order: 'asc' | 'desc') {
  searchParams.value.sortField = field as 'fileName' | 'createDate';
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

// 取消分享（单选或多选）
async function handleRemoveShare() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.warning({
    title: $t('page.disk.myShare.cancelShare'),
    content: selectedIds.length === 1
      ? $t('page.disk.myShare.cancelConfirm')
      : `确定取消分享 ${selectedIds.length} 个文件？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      // 批量取消分享
      for (const shareId of selectedIds) {
        await fetchCancelShare(shareId);
      }
      endLoading();
      window.$message?.success($t('page.disk.myShare.cancelSuccess'));
      selectedFiles.value = [];
      getData();
    }
  });
}

// 复制分享链接
function handleCopyLink(shareId: CommonType.IdType) {
  const item = shareList.value.find(s => s.shareId === shareId);
  if (item) {
    handleCopy(`${window.location.origin}/s/${item.shortId}`);
  }
}

// 处理文件双击
function handleFileDblClick(file: Api.Disk.FileItem) {
  // 找到对应的分享项，复制链接
  handleCopyLink(file.fileId);
}

// 处理文件操作
function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'share':
      handleCopyLink(file.fileId);
      break;
    case 'delete':
      handleRemoveShare();
      break;
    case 'download':
      // TODO: 实现分享下载
      window.$message?.info('下载功能开发中');
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
          page-type="my-share"
          :selected-count="selectedCount"
          @sort="handleSort"
          @toggle-view="toggleView"
          @refresh="getData"
          @clear-selection="handleClearSelection"
          @remove-share="handleRemoveShare"
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
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-share="handleFileAction('share', $event)"
            @file-delete="handleFileAction('delete', $event)"
            @file-download="handleFileAction('download', $event)"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />

          <!-- 列表视图 -->
          <FileList
            v-if="!showEmpty && diskStore.viewMode === 'list'"
            :files="fileList"
            :loading="loading"
            :selected-files="selectedFiles"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-share="handleFileAction('share', $event)"
            @file-delete="handleFileAction('delete', $event)"
            @file-download="handleFileAction('download', $event)"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />
        </div>
      </div>
    </NCard>
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