import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useBoolean } from '@sa/hooks';
import { fetchGetFileList } from '@/service/api/disk/list';
import { SetupStoreId } from '@/enum';
import { useAuthStore } from '../auth';
import { generateUniqueName, parseFileName } from './shared';

export const useDiskStore = defineStore(SetupStoreId.Disk, () => {
  const fileShowMode = ref<UnionKey.FileListMode>('grid');
  const isDragUploadEnabled = ref(true);
  const selectedFileId = ref<CommonType.IdType>('');
  const creatingItem = ref<Api.Disk.FileItem | null>(null);
  const selectedFileIds = ref<CommonType.IdType[]>([]);
  const queryType = ref<SimpleUploader.Uploader.FileListQueryType>('all');
  const fileListLength = ref(0);

  const route = useRoute();
  const authStore = useAuthStore();
  const { bool: panelVisible, setTrue: openPanel, setFalse: closePanel } = useBoolean();

  const fileList = ref<Api.Disk.FileItem[]>([]);

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
    const basePath = typeof route.query.basePath === 'string' ? route.query.basePath : '/';
    const path = typeof route.query.path === 'string' ? route.query.path : '';

    let finalPath = basePath;
    if (finalPath && finalPath.endsWith('/')) {
      finalPath = finalPath.slice(0, -1);
    }

    return encodeURIComponent(finalPath + path);
  }

  async function getUploadParams() {
    return {
      folder: route.query.searchOpenFolder || route.query.folder,
      currentDirectory: getQueryPath(),
      userId: authStore.userInfo.userId
    };
  }

  async function getFileListParams() {
    return {
      userId: authStore.userInfo.userId,
      currentDirectory: getQueryPath(),
      folder: route.query.searchOpenFolder || route.query.folder,
      queryType: queryType.value
    };
  }

  async function getFileList() {
    const params = await getFileListParams();
    const { data, error } = await fetchGetFileList(params);
    if (error) {
      return;
    }
    fileList.value = data || [];
  }

  return {
    fileShowMode,
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
    setSelectedFileIds,
    getUploadParams,
    getFileList,
    queryType,
    setQueryType,
    panelVisible,
    openPanel,
    closePanel
  };
});
