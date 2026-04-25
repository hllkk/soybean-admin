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
  name: 'RecentPage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

// 最近访问列表
const recentList = ref<Api.Disk.RecentItem[]>([]);

// 本地选中状态（不污染 diskStore）
const selectedFiles = ref<CommonType.IdType[]>([]);

// 将 RecentItem 转换为 FileItem 格式
function convertToFileItem(item: Api.Disk.RecentItem): Api.Disk.FileItem {
  return {
    fileId: item.recordId,
    fileName: item.fileName,
    fileType: item.fileType,
    fileExtension: item.fileExtension,
    fileSize: item.fileSize,
    filePath: item.originalPath,
    parentId: null,
    isFolder: item.isFolder,
    modifyTime: item.visitTime,
    createTime: item.visitTime,
    updateTime: item.visitTime,
    createBy: '',
    updateBy: '',
    mediaCover: item.mediaCover
  };
}

// 转换后的文件列表
const fileList = computed(() => recentList.value.map(convertToFileItem));

// 选中数量
const selectedCount = computed(() => selectedFiles.value.length);

// 是否显示空状态
const showEmpty = computed(() => recentList.value.length === 0 && !loading.value);

// 获取最近访问列表（Mock 数据）
async function getData() {
  startLoading();
  // TODO: 调用后端 API
  // const { data, error } = await fetchGetRecentList(searchParams.value);

  // 模拟 API 响应延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 使用 Mock 数据
  recentList.value = getMockRecentList();
  endLoading();
}

// Mock 数据
function getMockRecentList(): Api.Disk.RecentItem[] {
  return [
    {
      recordId: 1,
      fileId: 101,
      fileName: '项目报告.docx',
      fileType: 'document',
      fileExtension: 'docx',
      isFolder: false,
      fileSize: 256000,
      visitTime: '2024-04-24 10:30:00',
      originalPath: '/文档/项目报告.docx',
      mediaCover: false
    },
    {
      recordId: 2,
      fileId: 102,
      fileName: '产品截图',
      fileType: 'folder',
      isFolder: true,
      fileSize: 0,
      visitTime: '2024-04-23 16:45:00',
      originalPath: '/设计素材/产品截图',
      mediaCover: false
    },
    {
      recordId: 3,
      fileId: 103,
      fileName: '宣传视频.mp4',
      fileType: 'video',
      fileExtension: 'mp4',
      isFolder: false,
      fileSize: 52428800,
      visitTime: '2024-04-22 14:20:00',
      originalPath: '/视频/宣传视频.mp4',
      mediaCover: true
    },
    {
      recordId: 4,
      fileId: 104,
      fileName: '系统架构图.png',
      fileType: 'image',
      fileExtension: 'png',
      isFolder: false,
      fileSize: 1536000,
      visitTime: '2024-04-21 09:15:00',
      originalPath: '/设计素材/系统架构图.png',
      mediaCover: true
    },
    {
      recordId: 5,
      fileId: 105,
      fileName: '背景音乐.mp3',
      fileType: 'audio',
      fileExtension: 'mp3',
      isFolder: false,
      fileSize: 3145728,
      visitTime: '2024-04-20 11:30:00',
      originalPath: '/音频/背景音乐.mp3',
      mediaCover: false
    },
    {
      recordId: 6,
      fileId: 106,
      fileName: '配置文件.json',
      fileType: 'other',
      fileExtension: 'json',
      isFolder: false,
      fileSize: 2048,
      visitTime: '2024-04-19 08:00:00',
      originalPath: '/配置文件.json',
      mediaCover: false
    },
    {
      recordId: 7,
      fileId: 107,
      fileName: '数据分析.xlsx',
      fileType: 'document',
      fileExtension: 'xlsx',
      isFolder: false,
      fileSize: 102400,
      visitTime: '2024-04-18 15:30:00',
      originalPath: '/文档/数据分析.xlsx',
      mediaCover: false
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

// 清除选中项的访问记录
function handleClearRecent() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.warning({
    title: $t('page.disk.recent.remove'),
    content: `确定要删除 ${selectedIds.length} 条访问记录吗？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // TODO: 调用后端 API 删除选中记录
      recentList.value = recentList.value.filter(item => !selectedIds.includes(item.recordId));
      selectedFiles.value = [];
      window.$message?.success('已删除访问记录');
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
      // TODO: 调用后端 API 清空所有记录
      recentList.value = [];
      selectedFiles.value = [];
      window.$message?.success('已清空全部访问记录');
    }
  });
}

// 处理文件双击
function handleFileDblClick(_file: Api.Disk.FileItem) {
  // TODO: 跳转到文件原位置或打开文件
  window.$message?.info('跳转到原位置功能开发中');
}

// 处理文件操作
function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'download':
      window.$message?.info('下载功能开发中');
      break;
    case 'delete':
      selectedFiles.value = [file.fileId];
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