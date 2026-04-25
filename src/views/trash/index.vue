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
  name: 'TrashPage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

// 回收站列表
const recycleList = ref<Api.Disk.RecycleItem[]>([]);

// 本地选中状态（不污染 diskStore）
const selectedFiles = ref<CommonType.IdType[]>([]);

// 将 RecycleItem 转换为 FileItem 格式
function convertToFileItem(item: Api.Disk.RecycleItem): Api.Disk.FileItem {
  return {
    fileId: item.recycleId, // 使用 recycleId 作为临时 fileId
    fileName: item.fileName,
    fileType: item.fileType,
    fileExtension: item.fileExtension,
    fileSize: item.fileSize,
    filePath: item.originalPath,
    parentId: null,
    isFolder: item.isFolder,
    modifyTime: item.deleteTime,
    createTime: item.deleteTime,
    updateTime: item.deleteTime,
    createBy: '',
    updateBy: '',
    mediaCover: item.mediaCover
  };
}

// 转换后的文件列表
const fileList = computed(() => recycleList.value.map(convertToFileItem));

// 选中数量
const selectedCount = computed(() => selectedFiles.value.length);

// 是否显示空状态
const showEmpty = computed(() => recycleList.value.length === 0 && !loading.value);

// 获取回收站列表（Mock 数据）
async function getData() {
  startLoading();
  // TODO: 调用后端 API
  // const { data, error } = await fetchGetRecycleList(searchParams.value);

  // 模拟 API 响应延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 使用 Mock 数据
  recycleList.value = getMockRecycleList();
  endLoading();
}

// Mock 数据
function getMockRecycleList(): Api.Disk.RecycleItem[] {
  return [
    {
      recycleId: 1,
      fileId: 201,
      fileName: '旧版设计稿',
      fileType: 'folder',
      isFolder: true,
      fileSize: 0,
      deleteTime: '2024-04-22 18:00:00',
      originalPath: '/设计素材/旧版设计稿',
      expireDays: 25
    },
    {
      recycleId: 2,
      fileId: 202,
      fileName: '过期合同.pdf',
      fileType: 'document',
      fileExtension: 'pdf',
      isFolder: false,
      fileSize: 512000,
      deleteTime: '2024-04-20 14:30:00',
      originalPath: '/文档/过期合同.pdf',
      expireDays: 23
    },
    {
      recycleId: 3,
      fileId: 203,
      fileName: '废弃图片.jpg',
      fileType: 'image',
      fileExtension: 'jpg',
      isFolder: false,
      fileSize: 204800,
      deleteTime: '2024-04-18 10:15:00',
      originalPath: '/图片/废弃图片.jpg',
      expireDays: 21,
      mediaCover: true
    },
    {
      recycleId: 4,
      fileId: 204,
      fileName: '测试音频.mp3',
      fileType: 'audio',
      fileExtension: 'mp3',
      isFolder: false,
      fileSize: 2097152,
      deleteTime: '2024-04-15 16:45:00',
      originalPath: '/音频/测试音频.mp3',
      expireDays: 18,
      mediaCover: false
    },
    {
      recycleId: 5,
      fileId: 205,
      fileName: '临时视频.mp4',
      fileType: 'video',
      fileExtension: 'mp4',
      isFolder: false,
      fileSize: 10485760,
      deleteTime: '2024-04-12 09:00:00',
      originalPath: '/视频/临时视频.mp4',
      expireDays: 15,
      mediaCover: true
    },
    {
      recycleId: 6,
      fileId: 206,
      fileName: '备份文件.zip',
      fileType: 'other',
      fileExtension: 'zip',
      isFolder: false,
      fileSize: 5242880,
      deleteTime: '2024-04-08 11:30:00',
      originalPath: '/备份文件.zip',
      expireDays: 11
    },
    {
      recycleId: 7,
      fileId: 207,
      fileName: '即将过期文档.docx',
      fileType: 'document',
      fileExtension: 'docx',
      isFolder: false,
      fileSize: 102400,
      deleteTime: '2024-04-01 08:00:00',
      originalPath: '/文档/即将过期文档.docx',
      expireDays: 4 // 快要过期了
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

// 处理选中状态变化
function handleSelectionChange(files: CommonType.IdType[]) {
  selectedFiles.value = files;
}

// 恢复文件
function handleRestore() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.info({
    title: $t('page.disk.trash.restore'),
    content: selectedIds.length === 1
      ? '确定恢复此文件到原位置？'
      : `确定恢复 ${selectedIds.length} 个文件到原位置？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // TODO: 调用后端 API 恢复文件
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 500));
      endLoading();

      recycleList.value = recycleList.value.filter(item => !selectedIds.includes(item.recycleId));
      selectedFiles.value = [];
      window.$message?.success('文件已恢复');
    }
  });
}

// 彻底删除
function handleDeletePermanently() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.error({
    title: $t('page.disk.trash.deletePermanently'),
    content: selectedIds.length === 1
      ? '此操作不可撤销，确定彻底删除此文件？'
      : `此操作不可撤销，确定彻底删除 ${selectedIds.length} 个文件？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // TODO: 调用后端 API 彻底删除
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 500));
      endLoading();

      recycleList.value = recycleList.value.filter(item => !selectedIds.includes(item.recycleId));
      selectedFiles.value = [];
      window.$message?.success('文件已彻底删除');
    }
  });
}

// 清空回收站
function handleEmptyTrash() {
  window.$dialog?.error({
    title: $t('page.disk.trash.empty'),
    content: '此操作不可撤销，确定清空回收站？',
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // TODO: 调用后端 API 清空回收站
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 500));
      endLoading();

      recycleList.value = [];
      selectedFiles.value = [];
      window.$message?.success('回收站已清空');
    }
  });
}

// 处理文件双击
function handleFileDblClick(file: Api.Disk.FileItem) {
  // 显示文件详情或恢复对话框
  const item = recycleList.value.find(r => r.recycleId === file.fileId);
  if (item) {
    window.$dialog?.info({
      title: '文件信息',
      content: `文件名: ${item.fileName}\n原路径: ${item.originalPath}\n删除时间: ${item.deleteTime}\n剩余 ${item.expireDays} 天后自动清除`,
      positiveText: '恢复',
      negativeText: '关闭',
      onPositiveClick: () => {
        selectedFiles.value = [item.recycleId];
        handleRestore();
      }
    });
  }
}

// 处理文件操作
function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'restore':
      selectedFiles.value = [file.fileId];
      handleRestore();
      break;
    case 'delete':
      selectedFiles.value = [file.fileId];
      handleDeletePermanently();
      break;
  }
}

// 下载功能提示
function handleDownloadTip() {
  window.$message?.warning('回收站文件无法下载');
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
          page-type="trash"
          :selected-count="selectedCount"
          @sort="handleSort"
          @toggle-view="toggleView"
          @refresh="getData"
          @clear-selection="handleClearSelection"
          @restore="handleRestore"
          @delete-permanently="handleDeletePermanently"
          @empty-trash="handleEmptyTrash"
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
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-delete="handleFileAction('delete', $event)"
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