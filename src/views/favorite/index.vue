<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import SimpleToolbar from '../disk/modules/simple-toolbar.vue';
import FileGrid from '../disk/modules/file-grid.vue';
import FileList from '../disk/modules/file-list.vue';
import FileEmpty from '../disk/modules/file-empty.vue';

defineOptions({
  name: 'FavoritePage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

// 收藏列表（Mock 数据）
const favoriteList = ref<Api.Disk.FileItem[]>([]);

// 本地选中状态（不污染 diskStore）
const selectedFiles = ref<CommonType.IdType[]>([]);

// 选中数量
const selectedCount = computed(() => selectedFiles.value.length);

// 是否显示空状态
const showEmpty = computed(() => favoriteList.value.length === 0 && !loading.value);

// 获取收藏列表（Mock 数据）
async function getData() {
  startLoading();
  // TODO: 调用后端 API
  // const { data, error } = await fetchGetFavoriteList(searchParams.value);

  // 模拟 API 响应延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 使用 Mock 数据
  favoriteList.value = getMockFavoriteList();
  endLoading();
}

// Mock 数据
function getMockFavoriteList(): Api.Disk.FileItem[] {
  return [
    {
      fileId: 301,
      fileName: '重要文档',
      fileType: 'folder',
      isFolder: true,
      fileSize: 0,
      filePath: '/重要文档',
      parentId: null,
      modifyTime: '2024-04-20 10:00:00',
      createTime: '2024-04-10 08:00:00',
      updateTime: '2024-04-20 10:00:00',
      createBy: '',
      updateBy: ''
    },
    {
      fileId: 302,
      fileName: '项目计划书.pdf',
      fileType: 'document',
      fileExtension: 'pdf',
      isFolder: false,
      fileSize: 1024000,
      filePath: '/文档/项目计划书.pdf',
      parentId: null,
      modifyTime: '2024-04-18 14:30:00',
      createTime: '2024-04-01 09:00:00',
      updateTime: '2024-04-18 14:30:00',
      createBy: '',
      updateBy: ''
    },
    {
      fileId: 303,
      fileName: '产品演示视频.mp4',
      fileType: 'video',
      fileExtension: 'mp4',
      isFolder: false,
      fileSize: 52428800,
      filePath: '/视频/产品演示视频.mp4',
      parentId: null,
      modifyTime: '2024-04-15 16:20:00',
      createTime: '2024-03-20 10:00:00',
      updateTime: '2024-04-15 16:20:00',
      createBy: '',
      updateBy: '',
      mediaCover: true
    },
    {
      fileId: 304,
      fileName: '品牌Logo.png',
      fileType: 'image',
      fileExtension: 'png',
      isFolder: false,
      fileSize: 256000,
      filePath: '/设计/品牌Logo.png',
      parentId: null,
      modifyTime: '2024-04-12 11:15:00',
      createTime: '2024-02-28 14:00:00',
      updateTime: '2024-04-12 11:15:00',
      createBy: '',
      updateBy: '',
      mediaCover: true
    },
    {
      fileId: 305,
      fileName: '会议录音.mp3',
      fileType: 'audio',
      fileExtension: 'mp3',
      isFolder: false,
      fileSize: 2097152,
      filePath: '/音频/会议录音.mp3',
      parentId: null,
      modifyTime: '2024-04-10 09:45:00',
      createTime: '2024-04-08 13:30:00',
      updateTime: '2024-04-10 09:45:00',
      createBy: '',
      updateBy: ''
    },
    {
      fileId: 306,
      fileName: '配置参数.xlsx',
      fileType: 'document',
      fileExtension: 'xlsx',
      isFolder: false,
      fileSize: 51200,
      filePath: '/数据/配置参数.xlsx',
      parentId: null,
      modifyTime: '2024-04-05 15:00:00',
      createTime: '2024-03-15 11:00:00',
      updateTime: '2024-04-05 15:00:00',
      createBy: '',
      updateBy: ''
    }
  ];
}

// 处理排序
function handleSort(field: string, order: 'asc' | 'desc') {
  // TODO: 实现排序
  console.log('Sort:', field, order);
}

// 切换视图
function toggleView() {
  diskStore.setViewMode(diskStore.viewMode === 'grid' ? 'list' : 'grid');
}

// 取消选中
function handleClearSelection() {
  selectedFiles.value = [];
}

// 取消收藏
function handleRemoveFavorite() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.warning({
    title: $t('page.disk.favorite.remove'),
    content: selectedIds.length === 1
      ? '确定取消收藏此文件？'
      : `确定取消收藏 ${selectedIds.length} 个文件？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // TODO: 调用后端 API 取消收藏
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 300));
      endLoading();

      favoriteList.value = favoriteList.value.filter(item => !selectedIds.includes(item.fileId));
      selectedFiles.value = [];
      window.$message?.success('已取消收藏');
    }
  });
}

// 下载功能提示
function handleDownloadTip() {
  window.$message?.info('下载功能开发中');
}

// 处理文件双击
function handleFileDblClick(_file: Api.Disk.FileItem) {
  // TODO: 跳转到文件位置或打开文件
  window.$message?.info('打开文件功能开发中');
}

// 处理选中状态变化
function handleSelectionChange(files: CommonType.IdType[]) {
  selectedFiles.value = files;
}

// 处理文件操作
function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'removeFavorite':
      selectedFiles.value = [file.fileId];
      handleRemoveFavorite();
      break;
    case 'download':
      handleDownloadTip();
      break;
  }
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
          page-type="favorite"
          :selected-count="selectedCount"
          @sort="handleSort"
          @toggle-view="toggleView"
          @refresh="getData"
          @clear-selection="handleClearSelection"
          @remove-favorite="handleRemoveFavorite"
          @download="handleDownloadTip"
        />

        <!-- 内容区域 -->
        <div class="flex-1 overflow-hidden lt-sm:flex-initial lt-sm:overflow-auto">
          <!-- 空状态 -->
          <FileEmpty v-if="showEmpty" />

          <!-- 网格视图 -->
          <FileGrid
            v-if="!showEmpty && diskStore.viewMode === 'grid'"
            :files="favoriteList"
            :loading="loading"
            :selected-files="selectedFiles"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-download="handleFileAction('download', $event)"
            @file-delete="handleFileAction('removeFavorite', $event)"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />

          <!-- 列表视图 -->
          <FileList
            v-if="!showEmpty && diskStore.viewMode === 'list'"
            :files="favoriteList"
            :loading="loading"
            :selected-files="selectedFiles"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-download="handleFileAction('download', $event)"
            @file-delete="handleFileAction('removeFavorite', $event)"
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