import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import { localStg } from '@/utils/storage';
import { router } from '@/router';
import { fetchResolvePath } from '@/service/api/disk/file';

const STORAGE_KEY = 'diskTransferList' as const;

/** Active statuses that cannot survive a page refresh */
const ACTIVE_STATUSES: Api.Disk.TransferItem['status'][] = [
  'pending', 'hashing', 'checking', 'uploading', 'transferring', 'merging'
];

function restoreTransferList(): Api.Disk.TransferItem[] {
  const saved = localStg.get(STORAGE_KEY);
  if (!saved || !Array.isArray(saved)) return [];

  return saved.map(item => {
    // Mark active items as interrupted on restore
    if (ACTIVE_STATUSES.includes(item.status)) {
      return {
        ...item,
        status: 'failed' as const,
        error: '页面刷新导致上传中断，请重试'
      };
    }
    return item;
  });
}

function persistTransferList(list: Api.Disk.TransferItem[]) {
  localStg.set(STORAGE_KEY, list);
}

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

  // 传输列表（从 localStorage 恢复）
  const transferList = ref<Api.Disk.TransferItem[]>(restoreTransferList());

  // 当前目录文件列表（由 DiskPage 同步）
  const currentFileList = ref<Api.Disk.FileItem[]>([]);

  // 选中的文件
  const selectedFiles = ref<CommonType.IdType[]>([]);

  // 内联创建状态
  const creatingType = ref<'file' | 'folder' | null>(null);

  // 内联重命名状态
  const renamingFileId = ref<CommonType.IdType | null>(null);
  const renamingName = ref('');

  // 移动/复制弹窗状态
  const moveCopyDialogVisible = ref(false);
  const moveCopyMode = ref<'copy' | 'move'>('copy');
  const moveCopyFiles = ref<Api.Disk.FileItem[]>([]);

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
    syncStoreToUrl();
  }

  // 进入文件夹
  function enterFolder(folder: Api.Disk.FileItem) {
    currentParentId.value = folder.fileId;
    currentPath.value.push(folder);
    selectedFiles.value = [];
    syncStoreToUrl();
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
    syncStoreToUrl();
  }

  // 重置路径到根目录
  function resetPath() {
    currentPath.value = [];
    currentParentId.value = null;
    selectedFiles.value = [];
    syncStoreToUrl();
  }

  // 计算当前路径字符串
  function getCurrentPathString(): string {
    if (currentPath.value.length === 0) return '/';
    return '/' + currentPath.value.map(f => f.fileName).join('/');
  }

  // 同步Store状态到URL（使用query参数，避免路由组件重建）
  function syncStoreToUrl() {
    const pathStr = getCurrentPathString();

    if (pathStr !== '/') {
      router.push({ name: 'disk', query: { path: pathStr } });
    } else {
      router.push({ name: 'disk' });
    }
  }

  // 从URL恢复路径状态（接收已解码的路径）
  async function restoreFromPath(decodedPath: string): Promise<boolean> {
    if (!decodedPath || decodedPath === '/') {
      currentParentId.value = null;
      currentPath.value = [];
      return true;
    }

    try {
      const { data } = await fetchResolvePath(decodedPath);
      if (data) {
        currentParentId.value = data.fileId;
        // 从面包屑构建currentPath（排除根目录项：fileId为null或0）
        currentPath.value = data.breadcrumb
          .filter(b => b.fileId !== null && b.fileId !== 0)
          .map(b => ({
            fileId: b.fileId!,
            fileName: b.fileName,
            filePath: b.filePath,
            fileType: 'folder',
            fileSize: 0,
            isFolder: true,
            createTime: '',
            updateTime: '',
            modifyTime: '',
            createBy: '',
            updateBy: '',
            parentId: null
          }));
        return true;
      }
    } catch {
      // 路径解析失败，返回false
    }
    return false;
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

  // 开始内联创建
  function startCreating(type: 'file' | 'folder') {
    creatingType.value = type;
  }

  // 取消内联创建
  function cancelCreating() {
    creatingType.value = null;
  }

  // 开始内联重命名
  function startRenaming(fileId: CommonType.IdType, currentName: string) {
    renamingFileId.value = fileId;
    renamingName.value = currentName;
  }

  // 取消内联重命名
  function cancelRenaming() {
    renamingFileId.value = null;
    renamingName.value = '';
  }

  // 打开移动/复制弹窗
  function openMoveCopyDialog(mode: 'copy' | 'move', files: Api.Disk.FileItem[]) {
    moveCopyMode.value = mode;
    moveCopyFiles.value = [...files];
    moveCopyDialogVisible.value = true;
  }

  // 关闭移动/复制弹窗
  function closeMoveCopyDialog() {
    moveCopyDialogVisible.value = false;
    moveCopyFiles.value = [];
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

  // 持久化：transferList 变化时自动保存到 localStorage
  watch(transferList, list => persistTransferList(list), { deep: true });

  return {
    // state
    currentFileType,
    currentPath,
    currentParentId,
    viewMode,
    sortSettings,
    transferList,
    currentFileList,
    selectedFiles,
    creatingType,
    renamingFileId,
    renamingName,
    moveCopyDialogVisible,
    moveCopyMode,
    moveCopyFiles,
    // computed
    breadcrumbPath,
    hasUploadTask,
    uploadingCount,
    // actions
    setFileType,
    enterFolder,
    goBack,
    resetPath,
    setViewMode,
    setSort,
    addTransferItem,
    updateTransferItem,
    removeTransferItem,
    clearCompletedTransfers,
    setSelectedFiles,
    clearSelection,
    startCreating,
    cancelCreating,
    startRenaming,
    cancelRenaming,
    openMoveCopyDialog,
    closeMoveCopyDialog,
    addUploadTasks,
    clearAllTransfers,
    $reset,
    // URL同步
    getCurrentPathString,
    syncStoreToUrl,
    restoreFromPath
  };
});

export default useDiskStore;