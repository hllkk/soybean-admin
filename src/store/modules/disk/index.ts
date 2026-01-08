import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useBoolean } from '@sa/hooks';
import { fetchGetFileList } from '@/service/api/disk/list';
import { useRouterPush } from '@/hooks/common/router';
import { SetupStoreId } from '@/enum';
import { useAuthStore } from '../auth';
import { generateUniqueName, parseFileName } from './shared';

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

  const route = useRoute();
  const authStore = useAuthStore();
  const { bool: panelVisible, setTrue: openPanel, setFalse: closePanel } = useBoolean();
  const { routerPushByKey } = useRouterPush();

  const path = computed(() => {
    const paramPath = typeof route.params.path === 'string' ? route.params.path : '';
    if (!paramPath) return '';
    const pathWithSpace = paramPath.replace(/\+/g, ' ');
    return decodeURIComponent(pathWithSpace);
  });

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

  function handleSelectFile(item: Api.Disk.FileItem) {
    openingItem.value = item;
    if (item.isDir) {
      handleOpenFolder(item);
    } else {
      handleOpenFile(item);
    }
  }

  function handleOpenFolder(item: Api.Disk.FileItem) {
    const notHomePage = route.path.length > 1;

    if (notHomePage && `${path.value}/` !== (item.filePath || '') && basePath.value.length === 1) {
      basePath.value = item.filePath || '/';
    }

    let newPath = `${path.value}/${item.name}`;
    newPath = newPath.replace(/\\/g, '/');
    newPath = newPath.replace(/\/\//g, '/');
    newPath = newPath.replace(basePath.value, '/');

    const pathListItem = { folder: item.name };
    pathList.value.push(pathListItem);

    pageIndex.value = 1;

    routerPushByKey('disk', {
      query: {
        path: newPath,
        ...(basePath.value && basePath.value.length > 1 ? { basePath: basePath.value } : {})
      }
    });

    getFileList();
  }

  function handleOpenFile(item: Api.Disk.FileItem) {
    console.log(item);
  }

  function initPathListFromRoute() {
    const paramPath = typeof route.params.path === 'string' ? route.params.path : '';
    if (paramPath && paramPath !== '/') {
      const pathWithSpace = paramPath.replace(/\+/g, ' ');
      const decodedPath = decodeURI(pathWithSpace);
      pathList.value = [];
      decodedPath.split('/').forEach((pathName, index) => {
        if (index > 0 && pathName) {
          pathList.value.push({ folder: pathName });
        }
      });
    } else {
      pathList.value = [];
    }
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
    renamingItem,
    setRenamingItem,
    confirmRenameItem,
    cancelRenameItem,
    setSelectedFileIds,
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
    initPathListFromRoute
  };
});
