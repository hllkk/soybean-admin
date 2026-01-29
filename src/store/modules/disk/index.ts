import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { defineStore } from 'pinia';
import { useBoolean } from '@sa/hooks';
import { fetchGetFileList } from '@/service/api/disk/list';
import { suffix } from '@/utils/file';
import { SetupStoreId } from '@/enum';
import { useAuthStore } from '../auth';
import { generateUniqueName, packageDownload, parseFileName, singleDownload } from './shared';

export const useDiskStore = defineStore(SetupStoreId.Disk, () => {
  const fileShowMode = ref<UnionKey.FileListMode>('grid');
  const isDragUploadEnabled = ref(true);
  const selectedFileId = ref<CommonType.IdType>('');
  const creatingItem = ref<Api.Disk.FileItem | null>(null);
  const renamingItem = ref<Api.Disk.FileItem | null>(null);
  const openingItem = ref<Api.Disk.FileItem | null>(null);
  const selectedFileIds = ref<CommonType.IdType[]>([]);
  const queryType = ref<SimpleUploader.Uploader.FileListQueryType>('all');
  const fileList = ref<Api.Disk.FileItem[]>([]);
  const fileListLength = ref(0);
  const basePath = ref('/');
  const pathList = ref<Array<{ folder: string; shareBase?: string }>>([]);
  const pageIndex = ref(1);
  const pageSize = ref(50);
  const total = ref(0);
  const audioPreviewVisible = ref(false);
  const audioPreviewRow = ref<Api.Disk.FileItem | null>(null);
  const imagePreviewVisible = ref(false);
  const imagePreviewRow = ref<Api.Disk.FileItem | null>(null);
  const videoPreviewVisible = ref(false);
  const videoPreviewRow = ref<Api.Disk.FileItem | null>(null);
  const textPreviewVisible = ref(false);
  const textPreviewRow = ref<Api.Disk.FileItem | null>(null);
  const iframePreviewVisible = ref(false);
  const iframePreviewRow = ref<Api.Disk.FileItem | null>(null);

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const { bool: panelVisible, setTrue: openPanel, setFalse: closePanel } = useBoolean();

  const path = ref<string>((route.query.path as string) || '');

  const isFinished = computed(() => fileList.value.length >= total.value && total.value > 0);

  watch(
    () => route.query.path,
    newPath => {
      const newPathValue = (newPath as string) || '';
      if (path.value !== newPathValue) {
        path.value = newPathValue;

        // 根据新的路径更新pathList
        pathList.value = [];
        if (newPathValue) {
          newPathValue.split('/').forEach(folder => {
            if (folder) {
              pathList.value.push({ folder });
            }
          });
        }
        getFileList();
      }
    }
  );

  function setUploadDragEnabled(value: boolean) {
    isDragUploadEnabled.value = value;
  }

  function setCreatingItem(item: Api.Disk.FileItem | null) {
    creatingItem.value = item;
  }

  function addFile(file: Api.Disk.FileItem) {
    fileList.value.unshift(file);
  }

  function setSelectedFileId(fileId: string) {
    selectedFileId.value = fileId;
  }

  function setRenamingItem(item: Api.Disk.FileItem | null) {
    renamingItem.value = item;
  }

  function cancelRenameItem() {
    setRenamingItem(null);
  }

  function confirmCreateItem(inputName: string): Api.Disk.FileItem | null {
    if (!creatingItem.value) return null;

    if (creatingItem.value.isDir) {
      const finalName = generateUniqueName(fileList.value, inputName.trim(), true);
      const newItem: Api.Disk.FileItem = {
        id: Date.now().toString(),
        name: finalName,
        isDir: true,
        size: 0,
        extendName: '',
        updateTime: new Date().toISOString()
      };
      addFile(newItem);
      setSelectedFileId(newItem.id);
      setCreatingItem(null);
      return newItem;
    }

    const { name: baseName, extension } = parseFileName(inputName);
    let finalExtension = extension;

    if (!finalExtension && creatingItem.value.extendName) {
      finalExtension = creatingItem.value.extendName;
    }

    const finalName = generateUniqueName(fileList.value, baseName, false, finalExtension);
    const newItem: Api.Disk.FileItem = {
      id: Date.now().toString(),
      name: finalName,
      isDir: false,
      size: 0,
      extendName: finalExtension || '',
      updateTime: new Date().toISOString()
    };
    addFile(newItem);
    setSelectedFileId(newItem.id);
    setCreatingItem(null);
    return newItem;
  }

  function cancelCreateItem() {
    setCreatingItem(null);
  }

  function confirmRenameItem(inputName: string): Api.Disk.FileItem | null {
    if (!renamingItem.value) return null;

    const fileIndex = fileList.value.findIndex(f => f.id === renamingItem.value!.id);
    if (fileIndex === -1) return null;

    const file = fileList.value[fileIndex];

    if (file.isDir) {
      const finalName = generateUniqueName(fileList.value, inputName.trim(), true, '', renamingItem.value.id);
      file.name = finalName;
      setRenamingItem(null);
      return file;
    }

    const { name: baseName, extension } = parseFileName(inputName);
    let finalExtension = extension;

    if (!finalExtension && file.extendName) {
      finalExtension = file.extendName;
    }

    const finalName = generateUniqueName(fileList.value, baseName, false, finalExtension, renamingItem.value.id);
    file.name = finalName;
    file.extendName = finalExtension || '';
    setRenamingItem(null);
    return file;
  }

  function setQueryType(type: SimpleUploader.Uploader.FileListQueryType) {
    queryType.value = type;
  }

  function toggleFileSelection(fileId: CommonType.IdType) {
    const index = selectedFileIds.value.indexOf(fileId);
    if (index > -1) {
      selectedFileIds.value.splice(index, 1);
    } else {
      selectedFileIds.value.push(fileId);
    }
  }

  function setSelectedFileIds(ids: CommonType.IdType[]) {
    selectedFileIds.value = ids;
  }

  function getQueryPath() {
    let finalPath = basePath.value;
    if (finalPath && finalPath.endsWith('/')) {
      finalPath = finalPath.slice(0, -1);
    }

    const currentPath = path.value || '';
    if (currentPath) {
      finalPath += currentPath;
    }

    return encodeURIComponent(finalPath);
  }

  async function getUploadParams() {
    return {
      folder: route.query.folder,
      currentDirectory: getQueryPath(),
      userId: authStore.userInfo.userId
    };
  }

  async function getFileListParams() {
    return {
      userId: authStore.userInfo.userId,
      currentDirectory: getQueryPath(),
      folder: route.query.folder,
      queryType: queryType.value,
      page: pageIndex.value,
      size: pageSize.value
    };
  }

  async function getFileList(isLoadMore = false) {
    if (!isLoadMore) {
      pageIndex.value = 1;
    }
    const params = await getFileListParams();
    const { data, error } = await fetchGetFileList(params);
    if (error) {
      return;
    }
    if (data) {
      if (isLoadMore) {
        fileList.value.push(...data.list);
      } else {
        fileList.value = data.list;
      }
      total.value = data.total;
      fileListLength.value = data.total;
    }
  }

  function setPageSize(size: number) {
    pageSize.value = size;
  }

  function handleSelectFile(item: Api.Disk.FileItem) {
    openingItem.value = item;
    if (item.isDir) {
      handleOpenFolder(item);
    } else {
      handleOpenFile(item);
    }
  }

  function handleOpenFolder(item: Api.Disk.FileItem) {
    // 获取当前路径的完整路径（包括basePath）
    const currentFullPath = path.value ? `/${path.value}` : '/';

    // 构建新的路径，确保格式正确
    let newPath = '';
    if (currentFullPath === '/') {
      newPath = `/${item.name}`;
    } else {
      newPath = `${currentFullPath}/${item.name}`;
    }

    // 规范化路径，确保没有双斜杠
    newPath = newPath.replace(/\/\//g, '/');

    // 移除开头的斜杠，因为path.value存储的是相对路径（不包含开头斜杠）
    path.value = newPath.substring(1);

    // 更新pathList
    pathList.value.push({ folder: item.name });

    pageIndex.value = 1;

    // 构建查询参数
    const encodedPath = encodeURIComponent(path.value);
    const finalBasePath =
      basePath.value && basePath.value.length > 1 ? `&basePath=${encodeURIComponent(basePath.value)}` : '';
    const finalQueryParams = `?path=${encodedPath}${finalBasePath}`;

    router.push(finalQueryParams);
    getFileList();
  }

  function handleOpenFile(item: Api.Disk.FileItem) {
    if (item.contentType?.startsWith('image')) {
      imagePreviewVisible.value = true;
      imagePreviewRow.value = item;
      return;
    }
    if (item.contentType?.includes('audio')) {
      audioPreviewVisible.value = true;
      audioPreviewRow.value = item;
      return;
    }
    if (item.contentType?.includes('video')) {
      videoPreviewVisible.value = true;
      videoPreviewRow.value = item;
      return;
    }
    if (suffix.simText.includes(item.extendName)) {
      textPreviewVisible.value = true;
      textPreviewRow.value = item;
      return;
    }
    if (suffix.compressedFile.includes(item.extendName)) {
      window.$message?.info(`压缩文件暂不支持预览，请下载后查看`);
      return;
    }
    if (item.contentType?.includes('office') || suffix.iframePreviewFile.includes(item.extendName)) {
      iframePreviewVisible.value = true;
      iframePreviewRow.value = item;
      return;
    }
    window.$message?.warning(`不支持的文件类型: ${item.name}`);
  }

  async function handleDownloadFile(item: Api.Disk.FileItem) {
    const fileIds = item.isDir ? [item.id] : selectedFileIds.value;
    if (item.isDir || fileIds.length > 1) {
      // 进行打包下载
      await packageDownload(authStore.userInfo.userId, fileIds);
      return;
    }
    await singleDownload(authStore.userInfo.userId, item);
  }

  function toggleFileShowMode() {
    fileShowMode.value = fileShowMode.value === 'grid' ? 'list' : 'grid';
  }

  async function handleShareFile(item: Api.Disk.FileItem) {
    // 判断item的id是否在选择列表中
    if (!selectedFileIds.value.includes(item.id)) {
      selectedFileIds.value.push(item.id);
    }
    // 调用接口实现文件的分享
  }

  async function handleDeleteFile(item: Api.Disk.FileItem) {
    // 判断item的id是否在选择列表中
    if (!selectedFileIds.value.includes(item.id)) {
      selectedFileIds.value.push(item.id);
    }
    // 调用接口实现文件的删除
  }

  function clearSelectedFiles() {
    selectedFileIds.value = [];
  }

  return {
    fileShowMode,
    toggleFileShowMode,
    fileList,
    fileListLength,
    isDragUploadEnabled,
    setUploadDragEnabled,
    creatingItem,
    setCreatingItem,
    confirmCreateItem,
    cancelCreateItem,
    selectedFileIds,
    toggleFileSelection,
    renamingItem,
    setRenamingItem,
    confirmRenameItem,
    cancelRenameItem,
    setSelectedFileIds,
    clearSelectedFiles,
    getUploadParams,
    getFileList,
    queryType,
    setQueryType,
    panelVisible,
    openPanel,
    closePanel,
    handleSelectFile,
    basePath,
    path,
    pathList,
    pageIndex,
    pageSize,
    total,
    isFinished,
    setPageSize,
    handleDownloadFile,
    handleShareFile,
    handleDeleteFile,
    audioPreviewVisible,
    audioPreviewRow,
    imagePreviewVisible,
    imagePreviewRow,
    videoPreviewVisible,
    videoPreviewRow,
    textPreviewVisible,
    textPreviewRow,
    iframePreviewVisible,
    iframePreviewRow
  };
});
