<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { UploadFileInfo, UploadInst } from 'naive-ui';
import { fetchCheckExist, fetchMergeFile, fetchUploadFolder, simpleUploadURL } from '@/service/api/disk/list';
import { getAuthorization } from '@/service/request/shared';
import { useAppStore } from '@/store/modules/app';
import { useDiskStore } from '@/store/modules/disk';
import { encodeIfNeeded, formatFileSize, formatNetSpeed, isPath } from '@/utils/file';
import { $t } from '@/locales';

defineOptions({
  name: 'GlobalNaiveUploader'
});

type UploadStatus = 'success' | 'error' | 'uploading' | 'paused' | 'waiting' | 'merging';

type UploadItemBase = {
  id: string;
  name: string;
  status: UploadStatus;
  currentSpeed: number;
};

type UploadFileItem = UploadItemBase & {
  isFolder: false;
  file: File;
  relativePath: string;
  size: number;
  lastModified: number;
  uploadedBytes: number;
};

type UploadFolderItem = UploadItemBase & {
  isFolder: true;
  childrenIds: string[];
};

type UploadItem = UploadFileItem | UploadFolderItem;

const CHUNK_SIZE = 2 * 1024 * 1024;
const SIMULTANEOUS_UPLOADS = 3;
const MAX_CHUNK_RETRIES = 3;

const appStore = useAppStore();
const diskStore = useDiskStore();
const route = useRoute();

const uploadRef = ref<UploadInst | null>(null);
const uploadFileList = ref<UploadFileInfo[]>([]);

const dragover = ref(false);
const isDragStart = ref(false);
const enableDragUpload = ref(true);
const fileListScrollTop = ref(0);
const dragoverLoop = ref<number | null>(null);

const selectDirectory = ref(false);
const netSpeed = ref('');
const process = ref(-10);
const isUploading = ref(false);

const isShrink = ref(false);
const processAreaStyle = ref<Record<string, string>>({
  right: '66px',
  bottom: '66px',
  width: '92px',
  height: '92px',
  opacity: '1'
});

const items = ref<Map<string, UploadItem>>(new Map());
const rootIds = ref<string[]>([]);

const fileStatusMap = ref<Map<string, UploadStatus>>(new Map());

const activeControllers = ref<
  Map<string, { pause: () => void; resume: () => void; cancel: () => void; isUploading: () => boolean }>
>(new Map());

const statusConfig = {
  success: { text: '成功', color: '#10b981', bgColor: '#d1fae5' },
  merging: { text: '合并中', color: '#f59e0b', bgColor: '#fef3c7' },
  error: { text: '失败', color: '#ef4444', bgColor: '#fee2e2' },
  uploading: { text: '上传中', color: '#3b82f6', bgColor: '#dbeafe' },
  paused: { text: '已暂停', color: '#f59e0b', bgColor: '#fef3c7' },
  waiting: { text: '等待中', color: '#6b7280', bgColor: '#f3f4f6' }
} as const;

function setFileStatus(id: string, status: UploadStatus) {
  fileStatusMap.value.set(id, status);
  const item = items.value.get(id);
  if (item) item.status = status;
}

function removeFileStatus(id: string) {
  fileStatusMap.value.delete(id);
}

function getStatusConfig(status: UploadStatus | undefined) {
  if (!status) return null;
  return statusConfig[status];
}

function setPageTitle(speed: string) {
  if (process.value === -10 || process.value === 100 || diskStore.fileListLength === 0) {
    document.title = route.meta.i18nKey ? $t(route.meta.i18nKey) : document.title;
  } else {
    document.title = `${process.value}% | ${speed}`;
  }
}

function updateOverallProgress() {
  let totalSize = 0;
  let uploaded = 0;
  let speed = 0;

  const addFileStats = (fileItem: UploadFileItem) => {
    totalSize += fileItem.size;
    uploaded += fileItem.uploadedBytes;
    speed += fileItem.status === 'uploading' ? fileItem.currentSpeed : 0;
  };

  for (const rootId of rootIds.value) {
    const root = items.value.get(rootId);
    if (!root) {
      //
    } else if (root.isFolder) {
      for (const childId of root.childrenIds) {
        const child = items.value.get(childId);
        if (child && !child.isFolder) addFileStats(child);
      }
    } else {
      addFileStats(root);
    }
  }

  if (!totalSize) {
    process.value = rootIds.value.length ? 0 : -10;
    netSpeed.value = formatNetSpeed(0, false);
    isUploading.value = false;
    window.onbeforeunload = null;
    setPageTitle('');
    return;
  }

  const percent = Math.trunc((uploaded / totalSize) * 100);
  process.value = Math.min(100, Math.max(0, percent));
  netSpeed.value = formatNetSpeed(speed, false);
  isUploading.value = speed > 0;
  setPageTitle(netSpeed.value);

  if (process.value > 0 && process.value < 100 && isUploading.value) {
    window.onbeforeunload = () => {
      return '还有文件正在上传, 确定退出吗?';
    };
  } else {
    window.onbeforeunload = null;
  }
}

function expand() {
  if (appStore.isMobile) return;
  isShrink.value = false;
  processAreaStyle.value.opacity = '0';
  setTimeout(() => {
    processAreaStyle.value.width = '0';
    processAreaStyle.value.height = '0';
  }, 300);
}

function shrink() {
  isShrink.value = true;
  processAreaStyle.value.opacity = '1';
  processAreaStyle.value.width = '92px';
  processAreaStyle.value.height = '92px';
}

function getFileIcon(fileType: string | null | undefined, fileName?: string) {
  if (!fileType) return 'disk-list_file';

  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
  const iconMap = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    excel: ['xls', 'xlsx', 'csv'],
    ppt: ['ppt', 'pptx'],
    word: ['doc', 'docx'],
    pdf: ['pdf'],
    zip: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    code: ['html', 'css', 'js', 'json', 'xml', 'ts', 'tsx', 'vue', 'jsx', 'php', 'py', 'go'],
    font: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
    exe: ['exe', 'msi', 'dmg', 'iso', 'apk', 'sh'],
    text: ['txt', 'md', 'log']
  };

  const typeIconMap: Record<string, string> = {
    'image/': 'disk-list_image',
    'video/': 'disk-list_video',
    'audio/': 'disk-list_audio',
    'application/pdf': 'disk-list_pdf',
    'application/zip': 'disk-list_zip',
    'application/x-zip': 'disk-list_zip'
  };

  for (const [typePrefix, icon] of Object.entries(typeIconMap)) {
    if (fileType.startsWith(typePrefix)) return icon;
  }

  if (ext) {
    for (const [category, extensions] of Object.entries(iconMap)) {
      if (extensions.includes(ext)) {
        const categoryIcon: Record<string, string> = {
          image: 'disk-list_image',
          video: 'disk-list_video',
          audio: 'disk-list_audio',
          excel: 'disk-list_excel',
          ppt: 'disk-list_ppt',
          word: 'disk-list_word',
          pdf: 'disk-list_pdf',
          zip: 'disk-list_zip',
          code: 'disk-list_code',
          font: 'disk-list_font',
          exe: 'disk-list_exe',
          text: 'disk-list_file'
        };
        return categoryIcon[category] || 'disk-list_file';
      }
    }
  }

  return 'disk-list_file';
}

function getRootFolderName(fullPath: string) {
  const normalized = fullPath.replace(/\\/g, '/');
  const first = normalized.split('/')[0];
  return first || '';
}

function getRelativePathFromUploadFile(file: UploadFileInfo) {
  const fullPath = file.fullPath || '';
  if (fullPath && isPath(fullPath)) {
    return fullPath.replace(/\\/g, '/');
  }
  return file.name;
}

function createFolderHierarchyFromFiles(files: UploadFileInfo[]) {
  const folderSet = new Set<string>();
  files.forEach(f => {
    const fullPath = f.fullPath || '';
    if (!fullPath || !isPath(fullPath)) return;
    const normalized = fullPath.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length <= 1) return;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const folderPath = parts.slice(0, i + 1).join('/');
      folderSet.add(folderPath);
    }
  });
  return Array.from(folderSet).sort((a, b) => a.split('/').length - b.split('/').length);
}

function getProgressStorageKey(identifier: string) {
  return `disk-upload-progress:${identifier}`;
}

function readUploadedChunkNumbers(identifier: string): number[] {
  try {
    const raw = window.localStorage.getItem(getProgressStorageKey(identifier));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { uploadedChunks?: number[] };
    return Array.isArray(parsed.uploadedChunks) ? parsed.uploadedChunks : [];
  } catch {
    return [];
  }
}

function writeUploadedChunkNumbers(identifier: string, uploadedChunks: Set<number>) {
  const payload = { uploadedChunks: Array.from(uploadedChunks.values()).sort((a, b) => a - b) };
  window.localStorage.setItem(getProgressStorageKey(identifier), JSON.stringify(payload));
}

function removeUploadedChunkNumbers(identifier: string) {
  window.localStorage.removeItem(getProgressStorageKey(identifier));
}

function generateIdentifier(relativePath: string, size: number) {
  return `${size}-${relativePath}`;
}

async function checkServerChunkStatus(params: {
  identifier: string;
  filename: string;
  relativePath: string;
  totalChunks: number;
  totalSize: number;
  currentChunkSize: number;
  chunkNumber: number;
  extraQuery: Record<string, any>;
}) {
  const url = new URL(simpleUploadURL);
  const search = new URLSearchParams();
  Object.entries(params.extraQuery).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    search.set(k, String(v));
  });
  search.set('chunkNumber', String(params.chunkNumber));
  search.set('chunkSize', String(CHUNK_SIZE));
  search.set('currentChunkSize', String(params.currentChunkSize));
  search.set('totalSize', String(params.totalSize));
  search.set('identifier', params.identifier);
  search.set('filename', params.filename);
  search.set('relativePath', params.relativePath);
  search.set('totalChunks', String(params.totalChunks));
  url.search = search.toString();

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: getAuthorization() || ''
    }
  });
  const json = (await res.json()) as { data?: Api.Disk.CheckExistResponse; message?: string };
  return json.data;
}

function uploadChunk(params: {
  file: File;
  identifier: string;
  filename: string;
  relativePath: string;
  totalChunks: number;
  totalSize: number;
  chunkNumber: number;
  chunk: Blob;
  extraQuery: Record<string, any>;
  onChunkProgress: (chunkNumber: number, uploaded: number) => void;
  registerXhr: (xhr: XMLHttpRequest) => void;
  unregisterXhr: (xhr: XMLHttpRequest) => void;
}) {
  return new Promise<{ data?: Api.Disk.CheckExistResponse; message?: string }>((resolve, reject) => {
    const url = new URL(simpleUploadURL);
    const search = new URLSearchParams();
    Object.entries(params.extraQuery).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      search.set(k, String(v));
    });
    url.search = search.toString();

    const xhr = new XMLHttpRequest();
    params.registerXhr(xhr);
    xhr.open('POST', url.toString(), true);
    const auth = getAuthorization();
    if (auth) xhr.setRequestHeader('Authorization', auth);
    xhr.responseType = 'text';

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) params.onChunkProgress(params.chunkNumber, e.loaded);
    };

    xhr.onerror = () => {
      params.unregisterXhr(xhr);
      reject(new Error('chunk upload error'));
    };
    xhr.onabort = () => {
      params.unregisterXhr(xhr);
      reject(new Error('chunk upload aborted'));
    };
    xhr.onload = () => {
      params.unregisterXhr(xhr);
      try {
        const json = JSON.parse(xhr.responseText) as { data?: Api.Disk.CheckExistResponse; message?: string };
        if (!json.data) {
          reject(new Error(json.message || '上传失败'));
          return;
        }
        resolve(json);
      } catch (e) {
        reject(e);
      }
    };

    const formData = new FormData();
    formData.append('chunkNumber', String(params.chunkNumber));
    formData.append('chunkSize', String(CHUNK_SIZE));
    formData.append('currentChunkSize', String(params.chunk.size));
    formData.append('totalSize', String(params.totalSize));
    formData.append('identifier', params.identifier);
    formData.append('filename', params.filename);
    formData.append('relativePath', params.relativePath);
    formData.append('totalChunks', String(params.totalChunks));
    formData.append('file', params.chunk, params.filename);
    xhr.send(formData);
  });
}

function createFileController(args: {
  itemId: string;
  folderId: string | null;
  identifier: string;
  relativePath: string;
  file: File;
  lastModified: number;
  extraQuery: Record<string, any>;
}) {
  let paused = false;
  let canceled = false;
  let needMerge = false;
  const activeXhrs = new Set<XMLHttpRequest>();
  const inProgressChunkBytes = new Map<number, number>();
  const uploadedChunks = new Set<number>();

  function registerXhr(xhr: XMLHttpRequest) {
    activeXhrs.add(xhr);
  }
  function unregisterXhr(xhr: XMLHttpRequest) {
    activeXhrs.delete(xhr);
  }

  function abortAll() {
    activeXhrs.forEach(xhr => {
      try {
        xhr.abort();
      } catch {
        //
      }
    });
    activeXhrs.clear();
    inProgressChunkBytes.clear();
  }

  function computeUploadedBytes() {
    let bytes = 0;
    const persisted = readUploadedChunkNumbers(args.identifier);
    persisted.forEach(n => uploadedChunks.add(n));
    for (const chunkNumber of uploadedChunks.values()) {
      const start = (chunkNumber - 1) * CHUNK_SIZE;
      const end = Math.min(args.file.size, chunkNumber * CHUNK_SIZE);
      bytes += Math.max(0, end - start);
    }
    for (const b of inProgressChunkBytes.values()) bytes += b;
    return Math.min(args.file.size, bytes);
  }

  function updateItem(uploadedBytes: number, speedBytesPerSecond: number) {
    const item = items.value.get(args.itemId);
    if (item && !item.isFolder) {
      item.uploadedBytes = uploadedBytes;
      item.currentSpeed = speedBytesPerSecond;
    }

    if (args.folderId) {
      const folder = items.value.get(args.folderId);
      if (folder && folder.isFolder) {
        let folderUploaded = 0;
        let folderSize = 0;
        let folderSpeed = 0;
        for (const childId of folder.childrenIds) {
          const child = items.value.get(childId);
          if (child && !child.isFolder) {
            folderSize += child.size;
            folderUploaded += child.uploadedBytes;
            folderSpeed += child.status === 'uploading' ? child.currentSpeed : 0;
          }
        }
        folder.currentSpeed = folderSpeed;
        const canUpdateStatus = folder.status !== 'paused' && folder.status !== 'error';
        if (folderSize > 0 && canUpdateStatus) {
          setFileStatus(folder.id, folderUploaded >= folderSize ? 'success' : 'uploading');
        }
        if (folderSize > 0 && folderUploaded >= folderSize && folder.status !== 'error') {
          setFileStatus(folder.id, 'success');
        }
      }
    }

    updateOverallProgress();
  }

  async function run() {
    paused = false;
    canceled = false;
    needMerge = false;

    const item = items.value.get(args.itemId);
    if (!item || item.isFolder) return;
    setFileStatus(args.itemId, 'uploading');

    const totalChunks = Math.max(1, Math.ceil(args.file.size / CHUNK_SIZE));
    const firstChunkSize = Math.min(CHUNK_SIZE, args.file.size);

    const serverState = await checkServerChunkStatus({
      identifier: args.identifier,
      filename: args.file.name,
      relativePath: args.relativePath,
      totalChunks,
      totalSize: args.file.size,
      currentChunkSize: firstChunkSize,
      chunkNumber: 1,
      extraQuery: args.extraQuery
    });

    if (serverState?.pass) {
      removeUploadedChunkNumbers(args.identifier);
      setFileStatus(args.itemId, 'success');
      updateItem(args.file.size, 0);
      diskStore.getFileList();
      if (args.folderId) {
        const folder = items.value.get(args.folderId);
        if (folder && folder.isFolder) {
          const allSuccess = folder.childrenIds.every(id => items.value.get(id)?.status === 'success');
          if (allSuccess) window.$message?.success('文件夹上传成功');
        }
      } else {
        window.$message?.success('上传成功');
      }
      return;
    }

    (serverState?.resume || []).forEach(n => uploadedChunks.add(n));
    readUploadedChunkNumbers(args.identifier).forEach(n => uploadedChunks.add(n));
    writeUploadedChunkNumbers(args.identifier, uploadedChunks);

    let lastUploadedBytes = computeUploadedBytes();
    let lastTs = performance.now();
    updateItem(lastUploadedBytes, 0);

    const chunkNumbers: number[] = [];
    for (let i = 1; i <= totalChunks; i += 1) {
      if (!uploadedChunks.has(i)) chunkNumbers.push(i);
    }

    let cursor = 0;

    function handleChunkProgress(chunkNumber: number, uploaded: number) {
      inProgressChunkBytes.set(chunkNumber, uploaded);
      const nowBytes = computeUploadedBytes();
      const nowTs = performance.now();
      const deltaBytes = Math.max(0, nowBytes - lastUploadedBytes);
      const deltaMs = Math.max(1, nowTs - lastTs);
      const speedBytesPerSecond = (deltaBytes / deltaMs) * 1000;
      lastUploadedBytes = nowBytes;
      lastTs = nowTs;
      updateItem(nowBytes, speedBytesPerSecond);
    }

    async function uploadChunkWithRetries(chunkNumber: number, chunk: Blob, attempt = 0) {
      try {
        return await uploadChunk({
          file: args.file,
          identifier: args.identifier,
          filename: args.file.name,
          relativePath: args.relativePath,
          totalChunks,
          totalSize: args.file.size,
          chunkNumber,
          chunk,
          extraQuery: args.extraQuery,
          onChunkProgress: handleChunkProgress,
          registerXhr,
          unregisterXhr
        });
      } catch (e) {
        if (attempt >= MAX_CHUNK_RETRIES) throw e;
        return uploadChunkWithRetries(chunkNumber, chunk, attempt + 1);
      }
    }

    async function processNextChunk(): Promise<void> {
      if (paused || canceled) return;
      const next = chunkNumbers[cursor];
      cursor += 1;
      if (!next) return;

      const start = (next - 1) * CHUNK_SIZE;
      const end = Math.min(args.file.size, next * CHUNK_SIZE);
      const blob = args.file.slice(start, end);

      inProgressChunkBytes.set(next, 0);
      const res = await uploadChunkWithRetries(next, blob);
      if (res.data?.merge) needMerge = true;
      uploadedChunks.add(next);
      inProgressChunkBytes.delete(next);
      writeUploadedChunkNumbers(args.identifier, uploadedChunks);
      const nowBytes = computeUploadedBytes();
      updateItem(nowBytes, 0);

      await processNextChunk();
    }

    const workers = Array.from({ length: SIMULTANEOUS_UPLOADS }).map(() => processNextChunk());
    await Promise.all(workers);
    if (paused || canceled) return;

    if (needMerge) {
      setFileStatus(args.itemId, 'merging');
      const mergeParams: Api.Disk.FileMergeRequest = {
        fileName: encodeIfNeeded(args.file.name),
        relativePath: encodeIfNeeded(args.relativePath),
        identifier: args.identifier,
        folder: route.query.folder,
        currentDirectory: encodeIfNeeded(String(args.extraQuery.currentDirectory || '')),
        userId: args.extraQuery.userId,
        totalSize: args.file.size,
        isFolder: Boolean(args.folderId),
        lastModified: args.lastModified,
        fileId: args.extraQuery.fileId || ''
      };
      await fetchMergeFile(mergeParams);
    }

    removeUploadedChunkNumbers(args.identifier);
    setFileStatus(args.itemId, 'success');
    updateItem(args.file.size, 0);
    diskStore.getFileList();

    if (args.folderId) {
      const folder = items.value.get(args.folderId);
      if (folder && folder.isFolder) {
        const allSuccess = folder.childrenIds.every(id => items.value.get(id)?.status === 'success');
        if (allSuccess) window.$message?.success('文件夹上传成功');
      }
    } else {
      window.$message?.success('上传成功');
    }
  }

  return {
    pause() {
      paused = true;
      abortAll();
      setFileStatus(args.itemId, 'paused');
      if (args.folderId) {
        const folder = items.value.get(args.folderId);
        if (folder && folder.isFolder) setFileStatus(folder.id, 'paused');
      }
      updateOverallProgress();
    },
    resume() {
      if (canceled) return;
      run().catch(err => {
        const msg = err instanceof Error ? err.message : String(err);
        window.$message?.error(`上传失败: ${msg}`);
        setFileStatus(args.itemId, 'error');
        if (args.folderId) {
          const folder = items.value.get(args.folderId);
          if (folder && folder.isFolder) setFileStatus(folder.id, 'error');
        }
        updateOverallProgress();
      });
    },
    cancel() {
      canceled = true;
      paused = false;
      abortAll();
      removeUploadedChunkNumbers(args.identifier);
      removeFileStatus(args.itemId);
      activeControllers.value.delete(args.itemId);
      items.value.delete(args.itemId);

      if (args.folderId) {
        const folder = items.value.get(args.folderId);
        if (folder && folder.isFolder) {
          folder.childrenIds = folder.childrenIds.filter(id => id !== args.itemId);
          if (folder.childrenIds.length === 0) {
            items.value.delete(args.folderId);
            fileStatusMap.value.delete(args.folderId);
            rootIds.value = rootIds.value.filter(id => id !== args.folderId);
          }
        }
      } else {
        rootIds.value = rootIds.value.filter(id => id !== args.itemId);
      }

      diskStore.fileListLength = rootIds.value.length;
      updateOverallProgress();
      if (rootIds.value.length === 0) diskStore.closePanel();
    },
    isUploading() {
      return !paused && !canceled && activeXhrs.size > 0;
    }
  };
}

function cancelAll() {
  for (const controller of activeControllers.value.values()) controller.cancel();
  activeControllers.value.clear();
  items.value.clear();
  fileStatusMap.value.clear();
  rootIds.value = [];
  diskStore.fileListLength = 0;
  process.value = -10;
  netSpeed.value = '';
  isUploading.value = false;
  window.onbeforeunload = null;
  setPageTitle('');
}

function handleClose() {
  if (process.value === -10 || process.value === 100 || diskStore.fileListLength === 0) {
    cancelAll();
    diskStore.closePanel();
  } else {
    window.$dialog?.warning({
      title: '关闭',
      content: '还有文件正在上传,确定要关闭吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick() {
        cancelAll();
        diskStore.closePanel();
      },
      onNegativeClick() {
        window.$dialog?.destroyAll();
      }
    });
  }
}

function handlePause(id: string) {
  activeControllers.value.get(id)?.pause();
}

function handleResume(id: string) {
  activeControllers.value.get(id)?.resume();
}

function handleCancel(id: string) {
  activeControllers.value.get(id)?.cancel();
}

async function startSelectFile() {
  selectDirectory.value = false;
  await nextTick();
  uploadRef.value?.openOpenFileDialog();
}

async function startSelectFolder() {
  selectDirectory.value = true;
  await nextTick();
  uploadRef.value?.openOpenFileDialog();
}

async function prepareAndStartUploads(newFiles: UploadFileInfo[]) {
  if (!newFiles.length) return;

  diskStore.openPanel();

  const uploadParams = await diskStore.getUploadParams();

  const filenames: string[] = [];
  newFiles.forEach(f => {
    filenames.push(f.name);
    const fullPath = f.fullPath || '';
    if (fullPath && isPath(fullPath)) {
      const rootFolder = getRootFolderName(fullPath);
      if (rootFolder) filenames.push(rootFolder);
    }
  });

  const query = { filenames, ...uploadParams };
  const { data, error } = await fetchCheckExist(query);
  if (error) {
    window.$message?.error(`文件存在检查失败: ${error}`);
    cancelAll();
    diskStore.closePanel();
    return;
  }

  let override = false;
  if (data?.exist) {
    const confirmed = await new Promise<boolean>(resolve => {
      window.$dialog?.destroyAll();
      window.$dialog?.warning({
        title: '文件已存在',
        content: '是否覆盖已存在的文件？',
        positiveText: '覆盖',
        negativeText: '取消',
        onPositiveClick() {
          override = true;
          resolve(true);
        },
        onNegativeClick() {
          resolve(false);
        }
      });
    });

    if (!confirmed) {
      cancelAll();
      diskStore.closePanel();
      return;
    }
  }

  const folders = createFolderHierarchyFromFiles(newFiles);
  function createFolders(): Promise<void> {
    return folders.reduce<Promise<void>>((promise, folderPath) => {
      return promise.then(() => {
        const normalized = folderPath.replace(/\\/g, '/');
        const parts = normalized.split('/').filter(Boolean);
        const folderName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');
        const createFolderParams: Api.Disk.CreateFolderParams = {
          isFolder: true,
          folderPath: encodeIfNeeded(parentPath),
          fileName: encodeIfNeeded(folderName),
          folder: route.query.folder,
          currentDirectory: encodeIfNeeded(uploadParams.currentDirectory || ''),
          userId: uploadParams.userId,
          override: override || undefined
        };
        return fetchUploadFolder(createFolderParams).then(() => undefined);
      });
    }, Promise.resolve());
  }
  if (folders.length) {
    await createFolders();
  }

  const extraQuery = { isFolder: false, ...uploadParams };
  const folderGroups = new Map<string, { folderId: string; children: UploadFileInfo[] }>();

  for (const fileInfo of newFiles) {
    const file = fileInfo.file!;
    const relativePath = getRelativePathFromUploadFile(fileInfo);
    const identifier = generateIdentifier(relativePath, file.size);
    const fileId = fileInfo.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const fullPath = fileInfo.fullPath || '';
    const isFolderUpload = fullPath && isPath(fullPath);
    let folderId: string | null = null;

    if (isFolderUpload) {
      const folderName = getRootFolderName(fullPath);
      if (folderName) {
        let group = folderGroups.get(folderName);
        if (!group) {
          const newFolderId = `folder-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const folderItem: UploadFolderItem = {
            id: newFolderId,
            name: folderName,
            isFolder: true,
            childrenIds: [],
            status: 'waiting',
            currentSpeed: 0
          };
          items.value.set(newFolderId, folderItem);
          rootIds.value.push(newFolderId);
          setFileStatus(newFolderId, 'waiting');
          group = { folderId: newFolderId, children: [] };
          folderGroups.set(folderName, group);
        }
        folderId = group.folderId;
        group.children.push(fileInfo);
      }
    }

    const uploadItem: UploadFileItem = {
      id: fileId,
      name: fileInfo.name,
      isFolder: false,
      file,
      relativePath,
      size: file.size,
      lastModified: file.lastModified || 0,
      uploadedBytes: 0,
      status: 'waiting',
      currentSpeed: 0
    };

    items.value.set(fileId, uploadItem);
    setFileStatus(fileId, 'waiting');

    if (folderId) {
      const folderItem = items.value.get(folderId);
      if (folderItem && folderItem.isFolder) folderItem.childrenIds.push(fileId);
    } else {
      rootIds.value.push(fileId);
    }

    const controller = createFileController({
      itemId: fileId,
      folderId,
      identifier,
      relativePath,
      file,
      lastModified: uploadItem.lastModified,
      extraQuery: {
        lastModified: uploadItem.lastModified,
        ...extraQuery
      }
    });

    if (controller) activeControllers.value.set(fileId, controller);
  }

  diskStore.fileListLength = rootIds.value.length;
  updateOverallProgress();

  for (const id of Array.from(activeControllers.value.keys())) {
    const item = items.value.get(id);
    if (item && !item.isFolder && item.status === 'waiting') {
      activeControllers.value.get(id)?.resume();
    }
  }
}

async function handleUploadChange(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  const settled = options.fileList.filter(f => f.file);
  if (!settled.length) return;
  await prepareAndStartUploads(settled);
  uploadRef.value?.clear();
  uploadFileList.value = [];
}

function handleDragstart(e: DragEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('.sortable-chosen')) {
    diskStore.setUploadDragEnabled(false);
    return;
  }

  const isDraggableFile = target.dataset.draggableFile === 'true';

  if (enableDragUpload.value && diskStore.isDragUploadEnabled) {
    if (isDraggableFile) isDragStart.value = true;
    if (!isDraggableFile || fileListScrollTop.value !== 0) e.preventDefault();
  }
}

function handleDragenter(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) return;
  e.stopPropagation();
  e.preventDefault();
  dragover.value = true;
}

function handleDragover(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) return;
  e.stopPropagation();
  e.preventDefault();
  if (dragoverLoop.value) clearInterval(dragoverLoop.value);
  if (!isDragStart.value) dragover.value = true;
  dragoverLoop.value = window.setInterval(() => {
    dragover.value = false;
  }, 100);
}

function handleDrop(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) return;
  e.stopPropagation();
  e.preventDefault();
  dragover.value = false;
}

const hasItems = computed(() => rootIds.value.length > 0);
const displayItems = computed(() => {
  const result: UploadItem[] = [];
  for (const id of rootIds.value) {
    const item = items.value.get(id);
    if (item) result.push(item);
  }
  return result;
});

function fileSizeText(item: UploadItem) {
  if (item.isFolder) {
    let total = 0;
    for (const childId of item.childrenIds) {
      const child = items.value.get(childId);
      if (child && !child.isFolder) {
        total += child.size;
      }
    }
    return formatFileSize(total);
  }
  return formatFileSize(item.size);
}

function itemProgress(item: UploadItem) {
  if (item.isFolder) {
    let total = 0;
    let uploaded = 0;
    for (const childId of item.childrenIds) {
      const child = items.value.get(childId);
      if (child && !child.isFolder) {
        total += child.size;
        uploaded += child.uploadedBytes;
      }
    }
    if (!total) return 0;
    return Math.trunc((uploaded / total) * 100);
  }
  if (!item.size) return item.status === 'success' ? 100 : 0;
  return Math.trunc((item.uploadedBytes / item.size) * 100);
}

function itemSpeed(item: UploadItem) {
  return formatNetSpeed(item.currentSpeed, false);
}

function canPause(item: UploadItem) {
  return item.status === 'uploading';
}

function canResume(item: UploadItem) {
  return item.status !== 'uploading' && item.status !== 'success' && item.status !== 'merging';
}

onMounted(() => {
  diskStore.setUploadDragEnabled(true);
  const dropbox = document.body;
  dropbox.addEventListener('dragstart', handleDragstart);
  dropbox.addEventListener('dragenter', handleDragenter, false);
  dropbox.addEventListener('dragover', handleDragover, false);
  dropbox.addEventListener('drop', handleDrop, false);
});

onUnmounted(() => {
  const dropbox = document.body;
  dropbox.removeEventListener('dragstart', handleDragstart);
  dropbox.removeEventListener('dragenter', handleDragenter);
  dropbox.removeEventListener('dragover', handleDragover);
  dropbox.removeEventListener('drop', handleDrop);
  window.onbeforeunload = null;
});
</script>

<template>
  <div class="fixed bottom-8px right-15px z-1002">
    <NUpload
      ref="uploadRef"
      v-model:file-list="uploadFileList"
      :default-upload="false"
      :show-file-list="false"
      :directory="selectDirectory"
      directory-dnd
      accept="*"
      multiple
      @change="handleUploadChange"
    >
      <NUploadDragger v-if="dragover && enableDragUpload" class="uploader-drop left-0 top-0 size-full text-center">
        <span class="relative top-48% text-[34px] text-[#00000099] font-bold">上传文件到当前目录下</span>
      </NUploadDragger>

      <NButton id="global-uploader-btn-file" text @click="startSelectFile">选择文件</NButton>
      <NButton id="global-uploader-btn-folder" text @click="startSelectFolder">选择文件夹</NButton>
    </NUpload>

    <Transition name="panel-fade">
      <div
        v-show="diskStore.panelVisible && !isShrink && !appStore.isMobile"
        class="fixed bottom-[2%] right-[2%] h-300px w-720px overflow-hidden border-[1px] border-[#e2e2e2] rounded-[7px_7px_0_0] border-solid bg-[#fff] c-black shadow-[0_0_10px_0_rgba(0,0,0,0.2)] .dark:bg-[#1e1e1e]"
      >
        <div class="h-3rem flex border-b-1px border-gray-3 p-[0_10px]">
          <h2 class="ml-3% select-none text-14px line-height-[3rem] dark:text-[#fff]">传输列表</h2>
          <div class="flex-[1] text-right">
            <NButton v-if="diskStore.fileListLength > 0" text class="ml-0 p-[16px_5px] text-25px" @click="shrink">
              <template #icon>
                <icon-ep-position />
              </template>
            </NButton>
            <NButton text class="ml-0 p-[16px_5px] text-25px" @click="handleClose">
              <template #icon>
                <icon-ep-circle-close />
              </template>
            </NButton>
          </div>
        </div>

        <ul class="file-list">
          <li v-for="item in displayItems" :key="item.id" class="file-item">
            <div class="file-icon">
              <SvgIcon v-if="item.isFolder" local-icon="disk-list_folder" class="text-36px" />
              <SvgIcon v-else :local-icon="getFileIcon(item.file.type, item.name)" class="text-36px" />
            </div>

            <div class="file-info">
              <div class="file-name-row">
                <div class="file-name select-none">{{ item.name }}</div>
                <div
                  v-if="getStatusConfig(item.status)"
                  class="file-status"
                  :style="{
                    color: getStatusConfig(item.status)?.color,
                    backgroundColor: getStatusConfig(item.status)?.bgColor
                  }"
                >
                  {{ getStatusConfig(item.status)?.text }}
                </div>
              </div>

              <div class="file-progress">
                <div class="progress-bar bg-primary" :style="{ width: itemProgress(item) + '%' }" />
              </div>

              <div class="file-meta">
                <span class="file-size select-none">{{ fileSizeText(item) }}</span>
                <span v-if="item.status === 'uploading'" class="file-speed select-none">{{ itemSpeed(item) }}</span>
                <span v-else class="file-speed select-none">0 KB/s</span>
              </div>
            </div>

            <div class="file-actions">
              <NButton
                v-if="canPause(item)"
                text
                class="action-btn"
                size="small"
                @click="item.isFolder ? item.childrenIds.forEach(handlePause) : handlePause(item.id)"
              >
                <template #icon>
                  <icon-ep-video-pause />
                </template>
              </NButton>
              <NButton
                v-else-if="canResume(item)"
                text
                class="action-btn"
                size="small"
                @click="item.isFolder ? item.childrenIds.forEach(handleResume) : handleResume(item.id)"
              >
                <template #icon>
                  <icon-ep-video-play />
                </template>
              </NButton>
              <NButton
                text
                class="action-btn"
                size="small"
                @click="item.isFolder ? item.childrenIds.slice().forEach(handleCancel) : handleCancel(item.id)"
              >
                <template #icon>
                  <icon-ep-close />
                </template>
              </NButton>
            </div>
          </li>

          <div
            v-if="!hasItems"
            class="flex flex-col items-center justify-center py-18 text-gray-500 lt-sm:py-8 dark:text-gray-400"
          >
            <icon-ep-upload class="mb-2 text-4xl opacity-50 lt-sm:mb-1 lt-sm:text-3xl" />
            暂无待传输文件
          </div>
        </ul>
      </div>
    </Transition>

    <Transition name="ball-fade">
      <div
        v-show="diskStore.panelVisible && (isShrink || appStore.isMobile)"
        class="process-area"
        :style="processAreaStyle"
        @click="expand"
      >
        <div class="process-anime">
          <div class="cube-a" :style="{ top: -process - 65 + '%' }"></div>
          <div class="cube-b" :style="{ top: -process - 65 + '%' }"></div>

          <div v-if="hasItems && process < 100" class="process-info">
            <div class="process">{{ process }}%</div>
            <div v-if="isUploading" class="net-speed">{{ netSpeed }}</div>
          </div>

          <div v-if="hasItems && process >= 100" class="done">
            <svg xmlns="http://www.w3.org/2000/svg" class="done-icon" viewBox="0 0 50 50">
              <path d="M 13.1 21.2 l 5.1 5.2 l 12.7 -12.8" class="checkmark__check"></path>
            </svg>
          </div>

          <div v-if="!hasItems" class="empty-state select-none">暂无文件</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
#global-uploader-btn-file {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}

#global-uploader-btn-folder {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}

.uploader-drop {
  position: fixed;
  background-color: #ffffff99;
  border: 3px dashed #00000099;
}
</style>

<style scoped lang="scss">
.file-list {
  position: relative;
  max-height: 252px;
  overflow-x: hidden;
  list-style-type: none;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
}

.file-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.file-status {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.file-progress {
  height: 3px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;

  .progress-bar {
    height: 100%;
    transition: width 0.3s ease;
  }
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.file-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.action-btn {
  padding: 4px;
  color: #64748b;

  &:hover {
    color: #3b82f6;
  }
}

.process-area {
  position: fixed;
  z-index: 9999;
  cursor: pointer;
}

.process-anime {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.cube-a,
.cube-b {
  position: absolute;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--n-color, #18a058);
  opacity: 0.2;
  transition: top 0.3s ease;
}

.cube-b {
  opacity: 0.35;
}

.process-info {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #1e293b;
}

.process {
  font-size: 18px;
  font-weight: 600;
}

.net-speed {
  font-size: 12px;
  color: #64748b;
}

.done {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.done-icon {
  width: 32px;
  height: 32px;
}

.checkmark__check {
  fill: none;
  stroke: #10b981;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
}
</style>
