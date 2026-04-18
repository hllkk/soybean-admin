import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';

export const useDiskStore = defineStore(SetupStoreId.Disk, () => {
  // 当前选中的文件类型
  const currentFileType = ref<Api.Disk.FileType>('all');

  // 当前路径（面包屑）
  const currentPath = ref<Api.Disk.FileItem[]>([]);

  // 当前父文件夹ID
  const currentParentId = ref<CommonType.IdType | null>(null);

  // 视图模式
  const viewMode = ref<'grid' | 'list'>('grid');

  // 排序设置
  const sortSettings = ref<{
    field: 'name' | 'size' | 'modifyTime' | 'type' | null;
    order: 'asc' | 'desc';
  }>({
    field: null,
    order: 'asc'
  });

  // 传输列表
  const transferList = ref<Api.Disk.TransferItem[]>([]);

  // 选中的文件
  const selectedFiles = ref<CommonType.IdType[]>([]);

  // 计算属性：面包屑路径显示
  const breadcrumbPath = computed(() => {
    return currentPath.value.map(item => item.fileName);
  });

  // 计算属性：是否有上传任务
  const hasUploadTask = computed(() => {
    return transferList.value.some(
      item => item.transferType === 'upload' && item.status !== 'completed'
    );
  });

  // 切换文件类型
  function setFileType(type: Api.Disk.FileType) {
    currentFileType.value = type;
    currentParentId.value = null;
    currentPath.value = [];
    selectedFiles.value = [];
  }

  // 进入文件夹
  function enterFolder(folder: Api.Disk.FileItem) {
    currentParentId.value = folder.fileId;
    currentPath.value.push(folder);
    selectedFiles.value = [];
  }

  // 返回上一级
  function goBack(index?: number) {
    if (index !== undefined) {
      currentPath.value = currentPath.value.slice(0, index + 1);
      currentParentId.value = currentPath.value.length > 0
        ? currentPath.value[currentPath.value.length - 1].fileId
        : null;
    } else {
      currentPath.value.pop();
      currentParentId.value = currentPath.value.length > 0
        ? currentPath.value[currentPath.value.length - 1].fileId
        : null;
    }
    selectedFiles.value = [];
  }

  // 切换视图模式
  function setViewMode(mode: 'grid' | 'list') {
    viewMode.value = mode;
  }

  // 设置排序
  function setSort(field: 'name' | 'size' | 'modifyTime' | 'type' | null, order: 'asc' | 'desc') {
    sortSettings.value = { field, order };
  }

  // 添加传输项
  function addTransferItem(item: Api.Disk.TransferItem) {
    transferList.value.push(item);
  }

  // 更新传输项
  function updateTransferItem(transferId: string, updates: Partial<Api.Disk.TransferItem>) {
    const index = transferList.value.findIndex(item => item.transferId === transferId);
    if (index !== -1) {
      transferList.value[index] = { ...transferList.value[index], ...updates };
    }
  }

  // 移除传输项
  function removeTransferItem(transferId: string) {
    transferList.value = transferList.value.filter(item => item.transferId !== transferId);
  }

  // 清空已完成的传输项
  function clearCompletedTransfers() {
    transferList.value = transferList.value.filter(item => item.status !== 'completed');
  }

  // 设置选中文件
  function setSelectedFiles(fileIds: CommonType.IdType[]) {
    selectedFiles.value = fileIds;
  }

  // 清空选中
  function clearSelection() {
    selectedFiles.value = [];
  }

  // 获取上传中的任务数
  const uploadingCount = computed(() =>
    transferList.value.filter(item => item.transferType === 'upload' && item.status !== 'completed').length
  );

  // 批量添加上传任务
  function addUploadTasks(items: Api.Disk.TransferItem[]) {
    transferList.value.push(...items);
  }

  // 清空所有传输项（包括已完成）
  function clearAllTransfers() {
    transferList.value = [];
  }

  // 重置所有状态
  function $reset() {
    currentFileType.value = 'all';
    currentPath.value = [];
    currentParentId.value = null;
    viewMode.value = 'grid';
    sortSettings.value = { field: null, order: 'asc' };
    transferList.value = [];
    selectedFiles.value = [];
  }

  return {
    // state
    currentFileType,
    currentPath,
    currentParentId,
    viewMode,
    sortSettings,
    transferList,
    selectedFiles,
    // computed
    breadcrumbPath,
    hasUploadTask,
    uploadingCount,
    // actions
    setFileType,
    enterFolder,
    goBack,
    setViewMode,
    setSort,
    addTransferItem,
    updateTransferItem,
    removeTransferItem,
    clearCompletedTransfers,
    setSelectedFiles,
    clearSelection,
    addUploadTasks,
    clearAllTransfers,
    $reset
  };
});

export default useDiskStore;