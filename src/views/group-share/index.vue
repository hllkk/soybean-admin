<script setup lang="ts">
import { h, ref, computed, nextTick } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { NTag } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import {
  fetchGetSharedWithMeList,
  fetchGetSharedFolderContents,
  fetchCancelInternalShare,
  fetchIsAllowDownload,
  fetchIsAllowPackageDownload,
  fetchRenameFile,
  fetchGetShareInfo,
  fetchAddRecent,
  fetchGenerateStreamToken
} from '@/service/api/disk';
import { getPreviewCategory } from '@/utils/file-type';
import { formatFileSize } from '@/utils/format';
import { getServiceBaseURL } from '@/utils/service';
import FileIcon from '../disk/modules/file-icon.vue';
import MoveCopyDialog from '../disk/modules/move-copy-dialog.vue';
import ShareDialog from '../disk/modules/share-dialog.vue';
import FileEmpty from '@/components/disk/file-empty.vue';
import FilePreviewOverlay from '@/components/preview/file-preview-overlay.vue';
import ImagePreview from '@/components/preview/image-preview.vue';
import VideoPreview from '@/components/preview/video-preview.vue';
import AudioPreview from '@/components/preview/audio-preview.vue';
import TextPreview from '@/components/preview/text-preview.vue';

defineOptions({
  name: 'GroupSharePage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();
const { SvgIconVNode } = useSvgIcon();

const shareList = ref<Api.Disk.SharedWithMeItem[]>([]);
const total = ref(0);
const pagination = ref({ pageNum: 1, pageSize: 20 });
const checkedRowKeys = ref<number[]>([]);

// 文件夹浏览状态
const browsingFolder = ref<Api.Disk.SharedWithMeItem | null>(null);
const folderContents = ref<Api.Disk.FileItem[]>([]);
const folderTotal = ref(0);
const folderPagination = ref({ pageNum: 1, pageSize: 50 });
const folderPath = ref('');

// 重命名
const renamingFile = ref<Api.Disk.FileItem | null>(null);

// 右键菜单
const ctxMenuVisible = ref(false);
const ctxMenuX = ref(0);
const ctxMenuY = ref(0);
const ctxMenuFile = ref<Api.Disk.SharedWithMeItem | null>(null);
const ctxMenuFolderFile = ref<Api.Disk.FileItem | null>(null);

// 预览状态
const previewVisible = ref(false);
const previewFile = ref<Api.Disk.PreviewFileInfo | null>(null);
const imagePreviewRef = ref<InstanceType<typeof ImagePreview>>();
const videoPreviewVisible = ref(false);
const videoPreviewFile = ref<Api.Disk.FileItem | null>(null);
const videoStreamToken = ref('');
const audioPreviewVisible = ref(false);
const audioPreviewFile = ref<Api.Disk.FileItem | null>(null);
const isAudioCompact = ref(false);

// 分享
const existingShareInfo = ref<Api.Disk.ShareResult | null>(null);

const checkedCount = computed(() => checkedRowKeys.value.length);

// 是否在浏览文件夹模式
const isBrowsingFolder = computed(() => browsingFolder.value !== null);

// 当前显示的列表
const currentList = computed(() => {
  if (isBrowsingFolder.value) {
    return folderContents.value;
  }
  return shareList.value.map(convertToFileItem);
});

function contentTypeToFileType(contentType: string, isFolder: boolean): string {
  if (isFolder) return 'folder';
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('image')) return 'image';
  if (ct.includes('video')) return 'video';
  if (ct.includes('audio')) return 'audio';
  if (ct.includes('pdf') || ct.includes('document') || ct.includes('word') || ct.includes('text')) return 'document';
  if (ct.includes('spreadsheet') || ct.includes('excel') || ct.includes('xls')) return 'document';
  if (ct.includes('presentation') || ct.includes('ppt') || ct.includes('powerpoint')) return 'document';
  if (ct.includes('zip') || ct.includes('rar') || ct.includes('7z') || ct.includes('tar') || ct.includes('compressed'))
    return 'other';
  return 'other';
}

function convertToFileItem(item: Api.Disk.SharedWithMeItem): Api.Disk.FileItem {
  return {
    fileId: item.fileId,
    fileName: item.fileName,
    fileType: contentTypeToFileType(item.contentType, item.isFolder),
    fileExtension: item.contentType ? item.contentType.split('/').pop() : undefined,
    fileSize: item.size,
    filePath: '',
    parentId: null,
    isFolder: item.isFolder,
    modifyTime: item.createdAt,
    createTime: item.createdAt,
    updateTime: item.createdAt,
    createBy: '',
    updateBy: ''
  };
}

const fileList = computed(() => shareList.value.map(convertToFileItem));

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const permissionLabelMap: Record<string, string> = {
  DOWNLOAD: '下载',
  UPLOAD: '上传',
  PUT: '编辑',
  DELETE: '删除'
};

const permissionTagTypeMap: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  DOWNLOAD: 'success',
  UPLOAD: 'info',
  PUT: 'warning',
  DELETE: 'error'
};

// 面包屑导航
const breadcrumbItems = computed(() => {
  if (!browsingFolder.value) return [];
  const items: { name: string; path: string }[] = [{ name: browsingFolder.value.fileName, path: '' }];
  if (folderPath.value) {
    const parts = folderPath.value.split('/').filter(Boolean);
    // 跳过第一个部分（共享文件夹本身）
    for (let i = 1; i < parts.length; i++) {
      items.push({ name: parts[i], path: parts.slice(0, i + 1).join('/') });
    }
  }
  return items;
});

// 右键菜单选项 - 共享列表
const ctxMenuOptions = computed<DropdownOption[]>(() => [
  {
    label: $t('page.disk.contextMenu.open'),
    key: 'open',
    icon: SvgIconVNode({ icon: 'mdi:open-in-new', fontSize: 18 })
  },
  {
    label: $t('page.disk.contextMenu.download'),
    key: 'download',
    icon: SvgIconVNode({ icon: 'mdi:download-outline', fontSize: 18 })
  },
  {
    label: $t('page.disk.contextMenu.rename'),
    key: 'rename',
    icon: SvgIconVNode({ icon: 'mdi:pencil-outline', fontSize: 18 })
  },
  {
    label: $t('page.disk.contextMenu.copy'),
    key: 'copy',
    icon: SvgIconVNode({ icon: 'mdi:content-copy', fontSize: 18 })
  },
  {
    label: $t('page.disk.contextMenu.move'),
    key: 'move',
    icon: SvgIconVNode({ icon: 'mdi:folder-move-outline', fontSize: 18 })
  },
  {
    label: $t('page.disk.contextMenu.share'),
    key: 'share',
    icon: SvgIconVNode({ icon: 'mdi:share-outline', fontSize: 18 })
  },
  { type: 'divider', key: 'd1' },
  {
    label: '退出共享',
    key: 'exitShare',
    icon: SvgIconVNode({ icon: 'mdi:link-off', fontSize: 18 })
  }
]);

// 右键菜单选项 - 文件夹内文件
const folderCtxMenuOptions = computed<DropdownOption[]>(() => [
  {
    label: $t('page.disk.contextMenu.open'),
    key: 'open',
    icon: SvgIconVNode({ icon: 'mdi:open-in-new', fontSize: 18 })
  },
  {
    label: $t('page.disk.contextMenu.download'),
    key: 'download',
    icon: SvgIconVNode({ icon: 'mdi:download-outline', fontSize: 18 })
  }
]);

// 共享列表表格列
const shareColumns = [
  {
    type: 'selection' as const,
    width: 48
  },
  {
    key: 'fileName',
    title: '文件名',
    width: 280,
    render(row: Api.Disk.SharedWithMeItem) {
      const isRenaming = diskStore.renamingFileId === row.fileId;
      if (isRenaming) {
        return h('div', { class: 'flex items-center gap-8px' }, [
          h(FileIcon, {
            fileType: contentTypeToFileType(row.contentType, row.isFolder),
            extension: row.contentType,
            size: 'medium'
          }),
          h('input', {
            class:
              'flex-1 min-w-0 h-28px px-8px text-14px border border-primary rounded outline-none bg-transparent',
            value: row.fileName,
            onKeyup: (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                handleRenameConfirm(input.value);
              } else if (e.key === 'Escape') {
                diskStore.cancelRenaming();
                renamingFile.value = null;
              }
            },
            onBlur: (e: FocusEvent) => {
              const input = e.target as HTMLInputElement;
              if (input.value.trim() && input.value.trim() !== row.fileName) {
                handleRenameConfirm(input.value);
              } else {
                diskStore.cancelRenaming();
                renamingFile.value = null;
              }
            },
            autofocus: true
          })
        ]);
      }
      return h('div', { class: 'flex items-center gap-8px group' }, [
        h(FileIcon, {
          fileType: contentTypeToFileType(row.contentType, row.isFolder),
          extension: row.contentType,
          size: 'medium'
        }),
        h('span', { class: 'flex-1 truncate', style: 'min-width:0' }, row.fileName),
        h(
          'button',
          {
            class:
              'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:opacity-80 p-0 bg-transparent border-none shrink-0',
            title: '退出共享',
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              handleCancelSingle(row.fileShareId, row.fileName);
            }
          },
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            width: '16',
            height: '16',
            class: 'text-error'
          }, [
            h('path', {
              d: 'M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5',
              stroke: 'currentColor',
              'stroke-width': '2',
              'stroke-linecap': 'round',
              fill: 'none'
            })
          ])
        )
      ]);
    }
  },
  {
    key: 'shareUserName',
    title: '分享者',
    width: 120,
    render(row: Api.Disk.SharedWithMeItem) {
      return h('span', { class: 'text-13px opacity-70' }, row.shareUserName);
    }
  },
  {
    key: 'permissions',
    title: '权限',
    width: 180,
    render(row: Api.Disk.SharedWithMeItem) {
      return h(
        'div',
        { class: 'flex flex-wrap gap-4px' },
        row.permissions.map(p =>
          h(
            NTag,
            { size: 'small', type: permissionTagTypeMap[p] || 'default' },
            () => permissionLabelMap[p] || p
          )
        )
      );
    }
  },
  {
    key: 'size',
    title: '大小',
    width: 100,
    align: 'right' as const,
    render(row: Api.Disk.SharedWithMeItem) {
      if (row.isFolder) return '-';
      return h('span', { class: 'text-13px opacity-70' }, formatFileSize(row.size));
    }
  },
  {
    key: 'createdAt',
    title: '分享时间',
    width: 130,
    render(row: Api.Disk.SharedWithMeItem) {
      return h('span', { class: 'text-13px opacity-70' }, formatDateTime(row.createdAt));
    }
  },
  {
    key: 'expireDate',
    title: '过期时间',
    width: 150,
    align: 'center' as const,
    render(row: Api.Disk.SharedWithMeItem) {
      return h('span', { class: 'text-13px opacity-70' }, row.expireDate ? formatDateTime(row.expireDate) : '永久');
    }
  }
];

// 文件夹内容表格列
const folderColumns = [
  {
    key: 'fileName',
    title: '文件名',
    render(row: Api.Disk.FileItem) {
      return h('div', { class: 'flex items-center gap-8px' }, [
        h(FileIcon, {
          fileType: row.isDir ? 'folder' : contentTypeToFileType(row.contentType || '', false),
          extension: row.fileExtension || row.extendName,
          size: 'medium'
        }),
        h('span', { class: 'flex-1 truncate', style: 'min-width:0' }, row.fileName || row.name)
      ]);
    }
  },
  {
    key: 'fileSize',
    title: '大小',
    width: 100,
    align: 'right' as const,
    render(row: Api.Disk.FileItem) {
      if (row.isDir || row.isFolder) return '-';
      return formatFileSize(row.fileSize || row.size || 0);
    }
  },
  {
    key: 'updateTime',
    title: '修改时间',
    width: 150,
    render(row: Api.Disk.FileItem) {
      return h('span', { class: 'text-13px opacity-70' }, row.updateTime || row.modifyTime);
    }
  }
];

const rowKey = (row: Api.Disk.SharedWithMeItem) => row.fileShareId;
const folderRowKey = (row: Api.Disk.FileItem) => row.fileId;

const showEmpty = computed(() => {
  if (isBrowsingFolder.value) {
    return folderContents.value.length === 0 && !loading.value;
  }
  return shareList.value.length === 0 && !loading.value;
});

// 行属性：双击和右键菜单 - 共享列表
function getShareRowProps(row: Api.Disk.SharedWithMeItem) {
  return {
    style: 'cursor: pointer',
    ondblclick: () => handleShareFileDblClick(row),
    oncontextmenu: (e: MouseEvent) => {
      e.preventDefault();
      handleContextMenu(e, row);
    }
  };
}

// 行属性：双击和右键菜单 - 文件夹内容
function getFolderRowProps(row: Api.Disk.FileItem) {
  return {
    style: 'cursor: pointer',
    ondblclick: () => handleFolderFileDblClick(row),
    oncontextmenu: (e: MouseEvent) => {
      e.preventDefault();
      handleFolderContextMenu(e, row);
    }
  };
}

// 音频播放列表 - 使用当前列表
const currentAudioPlaylist = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  return currentList.value
    .filter(file => !file.isFolder && !file.isDir && getPreviewCategory(file.fileName || file.name || '') === 'audio')
    .map(file => ({
      id: file.fileId,
      title: (file.fileName || file.name || '').replace(/\.[^.]+$/, ''),
      artist: '未知歌手',
      album: '',
      cover: '',
      src: `${baseURL}/preview/file/${file.fileId}`,
      duration: undefined,
      lyrics: undefined
    }));
});

const currentAudioIndex = computed(() => {
  if (!audioPreviewFile.value) return 0;
  return currentAudioPlaylist.value.findIndex(item => String(item.id) === String(audioPreviewFile.value?.fileId));
});

const videoStreamBaseUrl = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return `${baseURL}/stream/video/${videoPreviewFile.value?.fileId}`;
});

// 获取共享列表数据
async function getData() {
  startLoading();
  checkedRowKeys.value = [];
  const { data, error } = await fetchGetSharedWithMeList({
    ...pagination.value,
    shareType: 'dept'
  });
  endLoading();

  if (!error && data) {
    shareList.value = data.rows || [];
    total.value = data.total;
  }
}

// 获取共享文件夹内容
async function getFolderContents(path?: string) {
  if (!browsingFolder.value) return;
  startLoading();
  const newPath = path ?? folderPath.value;
  const { data, error } = await fetchGetSharedFolderContents({
    fileId: browsingFolder.value.fileId,
    path: newPath,
    pageNum: folderPagination.value.pageNum,
    pageSize: folderPagination.value.pageSize
  });
  endLoading();

  if (!error && data) {
    folderContents.value = data.rows || [];
    folderTotal.value = data.total;
    folderPath.value = newPath;
  }
}

// 进入共享文件夹
function enterSharedFolder(item: Api.Disk.SharedWithMeItem) {
  browsingFolder.value = item;
  folderPath.value = '';
  folderPagination.value.pageNum = 1;
  getFolderContents();
}

// 返回共享列表
function exitSharedFolder() {
  browsingFolder.value = null;
  folderContents.value = [];
  folderPath.value = '';
}

// 面包屑点击
function handleBreadcrumbClick(path: string) {
  if (path === '') {
    // 点击根文件夹
    folderPath.value = '';
    folderPagination.value.pageNum = 1;
    getFolderContents('');
  } else {
    folderPagination.value.pageNum = 1;
    getFolderContents(path);
  }
}

// 右键菜单 - 共享列表
function handleContextMenu(e: MouseEvent, row: Api.Disk.SharedWithMeItem) {
  e.preventDefault();
  ctxMenuX.value = e.clientX;
  ctxMenuY.value = e.clientY;
  ctxMenuFile.value = row;
  ctxMenuFolderFile.value = null;
  ctxMenuVisible.value = true;
}

// 右键菜单 - 文件夹内容
function handleFolderContextMenu(e: MouseEvent, row: Api.Disk.FileItem) {
  e.preventDefault();
  ctxMenuX.value = e.clientX;
  ctxMenuY.value = e.clientY;
  ctxMenuFile.value = null;
  ctxMenuFolderFile.value = row;
  ctxMenuVisible.value = true;
}

function handleCtxMenuSelect(key: string) {
  ctxMenuVisible.value = false;

  // 处理文件夹内容的右键菜单
  if (ctxMenuFolderFile.value) {
    const file = ctxMenuFolderFile.value;
    switch (key) {
      case 'open':
        handleFolderFileDblClick(file);
        break;
      case 'download':
        if (!file.isDir) {
          handleFolderFileDownload(file);
        }
        break;
    }
    return;
  }

  // 处理共享列表的右键菜单
  const item = ctxMenuFile.value;
  if (!item) return;

  const file = convertToFileItem(item);
  switch (key) {
    case 'open':
      handleShareFileDblClick(item);
      break;
    case 'download':
      handleDownload([file]);
      break;
    case 'rename':
      diskStore.startRenaming(item.fileId, item.fileName);
      renamingFile.value = file;
      break;
    case 'copy':
      diskStore.openMoveCopyDialog('copy', [file]);
      break;
    case 'move':
      diskStore.openMoveCopyDialog('move', [file]);
      break;
    case 'share':
      handleShareFile(file);
      break;
    case 'exitShare':
      handleCancelSingle(item.fileShareId, item.fileName);
      break;
  }
}

// 双击共享列表文件
async function handleShareFileDblClick(item: Api.Disk.SharedWithMeItem) {
  if (item.isFolder) {
    // 进入文件夹浏览
    enterSharedFolder(item);
    return;
  }

  const file = convertToFileItem(item);
  fetchAddRecent(file.fileId);

  const category = getPreviewCategory(file.fileName);
  switch (category) {
    case 'image':
      openImagePreview(file);
      break;
    case 'video':
      await openVideoPreview(file);
      break;
    case 'audio':
      openAudioPreview(file);
      break;
    case 'office':
    case 'pdf':
      previewFile.value = {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileExtension: file.fileExtension,
        filePath: file.filePath
      };
      previewVisible.value = true;
      break;
    case 'code':
    case 'markdown':
      diskStore.textPreviewRow = file;
      diskStore.textPreviewVisible = true;
      break;
    default:
      window.$notification?.warning({ content: '暂不支持预览此类型文件', duration: 3000 });
  }
}

// 双击文件夹内容文件
async function handleFolderFileDblClick(file: Api.Disk.FileItem) {
  if (file.isDir || file.isFolder) {
    // 进入子文件夹 - 使用 file.filePath 作为基础路径
    const newPath = folderPath.value ? `${folderPath.value}/${file.fileName || file.name}` : file.filePath;
    folderPagination.value.pageNum = 1;
    getFolderContents(newPath);
    return;
  }

  fetchAddRecent(file.fileId);

  const category = getPreviewCategory(file.fileName || file.name || '');
  switch (category) {
    case 'image':
      openFolderImagePreview(file);
      break;
    case 'video':
      await openVideoPreview(file);
      break;
    case 'audio':
      openAudioPreview(file);
      break;
    case 'office':
    case 'pdf':
      previewFile.value = {
        fileId: file.fileId,
        fileName: file.fileName || file.name || '',
        fileSize: file.fileSize || file.size || 0,
        fileExtension: file.fileExtension || file.extendName,
        filePath: file.filePath
      };
      previewVisible.value = true;
      break;
    case 'code':
    case 'markdown':
      diskStore.textPreviewRow = file;
      diskStore.textPreviewVisible = true;
      break;
    default:
      window.$notification?.warning({ content: '暂不支持预览此类型文件', duration: 3000 });
  }
}

// 文件夹内文件下载
async function handleFolderFileDownload(file: Api.Disk.FileItem) {
  const { data, error } = await fetchIsAllowDownload([file.fileId]);
  if (error || !data?.allowDownload) {
    window.$message?.error('下载失败，请稍后重试');
    return;
  }
  triggerBrowserDownload(data.downloadUrl);
}

function openImagePreview(file: Api.Disk.FileItem) {
  const images = fileList.value
    .filter(f => !f.isFolder && getPreviewCategory(f.fileName) === 'image')
    .map(f => ({ fileId: f.fileId, fileName: f.fileName }));
  const initialIndex = images.findIndex(img => String(img.fileId) === String(file.fileId));
  nextTick(() => {
    imagePreviewRef.value?.show(images, initialIndex >= 0 ? initialIndex : 0);
  });
}

function openFolderImagePreview(file: Api.Disk.FileItem) {
  const images = folderContents.value
    .filter(f => !f.isDir && getPreviewCategory(f.fileName || f.name || '') === 'image')
    .map(f => ({ fileId: f.fileId, fileName: f.fileName || f.name || '' }));
  const initialIndex = images.findIndex(img => String(img.fileId) === String(file.fileId));
  nextTick(() => {
    imagePreviewRef.value?.show(images, initialIndex >= 0 ? initialIndex : 0);
  });
}

async function openVideoPreview(file: Api.Disk.FileItem) {
  if (videoPreviewVisible.value) {
    window.$message?.info('请先关闭当前播放的视频');
    return;
  }
  const res = await fetchGenerateStreamToken(String(file.fileId));
  if (res.data) {
    videoStreamToken.value = res.data.token;
    videoPreviewFile.value = file;
    videoPreviewVisible.value = true;
  }
}

function openAudioPreview(file: Api.Disk.FileItem) {
  audioPreviewFile.value = file;
  audioPreviewVisible.value = true;
}

function handleVideoClose() {
  videoPreviewVisible.value = false;
  videoPreviewFile.value = null;
  videoStreamToken.value = '';
}

function handleVideoTokenUpdate(token: string) {
  videoStreamToken.value = token;
}

function handleAudioClose() {
  audioPreviewVisible.value = false;
  audioPreviewFile.value = null;
  isAudioCompact.value = false;
}

function handleAudioOverlayClick() {
  if (!isAudioCompact.value) {
    audioPreviewVisible.value = false;
    audioPreviewFile.value = null;
  }
}

// 下载
function triggerBrowserDownload(downloadUrl: string) {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const link = document.createElement('a');
  link.href = `${baseURL}${downloadUrl}`;
  link.style.display = 'none';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function handleDownload(files: Api.Disk.FileItem[]) {
  if (files.length === 0) return;
  if (files.length === 1 && !files[0].isFolder) {
    const { data, error } = await fetchIsAllowDownload([files[0].fileId]);
    if (error || !data?.allowDownload) {
      window.$message?.error('下载失败，请稍后重试');
      return;
    }
    triggerBrowserDownload(data.downloadUrl);
    return;
  }
  const fileIds = files.map(f => f.fileId);
  const { data, error } = await fetchIsAllowPackageDownload(fileIds);
  if (error || !data?.allowDownload) {
    window.$message?.error('下载失败，请稍后重试');
    return;
  }
  triggerBrowserDownload(data.downloadUrl);
}

// 重命名确认
async function handleRenameConfirm(newName: string) {
  if (!renamingFile.value || !newName.trim()) return;
  if (newName.trim() === renamingFile.value.fileName) {
    diskStore.cancelRenaming();
    renamingFile.value = null;
    return;
  }
  const { error } = await fetchRenameFile(renamingFile.value.fileId, newName.trim());
  if (!error) {
    window.$message?.success($t('page.disk.moveCopy.renameSuccess'));
    diskStore.cancelRenaming();
    renamingFile.value = null;
    getData();
  }
}

// 分享
async function handleShareFile(file: Api.Disk.FileItem) {
  existingShareInfo.value = null;
  const { data } = await fetchGetShareInfo(file.fileId);
  if (data) {
    existingShareInfo.value = data;
  }
  diskStore.openShareDialog(file);
}

// 退出共享
async function handleBatchCancel() {
  if (checkedRowKeys.value.length === 0) return;
  window.$dialog?.warning({
    title: '退出共享',
    content: `确定退出 ${checkedRowKeys.value.length} 个共享？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      let failCount = 0;
      for (const id of checkedRowKeys.value) {
        const { error } = await fetchCancelInternalShare(id);
        if (error) failCount++;
      }
      endLoading();
      if (failCount === 0) {
        window.$message?.success('退出成功');
      } else {
        window.$message?.warning(`${failCount} 个退出失败`);
      }
      getData();
    }
  });
}

async function handleCancelSingle(id: number, fileName: string) {
  window.$dialog?.warning({
    title: '退出共享',
    content: `确定退出共享 "${fileName}"？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchCancelInternalShare(id);
      if (!error) {
        window.$message?.success('退出成功');
        getData();
      }
    }
  });
}

function handlePageChange(page: number) {
  if (isBrowsingFolder.value) {
    folderPagination.value.pageNum = page;
    getFolderContents();
  } else {
    pagination.value.pageNum = page;
    getData();
  }
}

getData();
</script>

<template>
  <div class="min-h-500px h-full flex-col-stretch gap-0 overflow-hidden lt-lg:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper h-full flex-1-hidden">
      <div class="h-full flex flex-col">
        <!-- 文件夹浏览模式：面包屑导航 -->
        <div v-if="isBrowsingFolder" class="flex items-center gap-8px px-4px py-8px">
          <NButton size="small" quaternary @click="exitSharedFolder">
            <template #icon>
              <icon-mdi-arrow-left class="text-16px" />
            </template>
            返回
          </NButton>
          <div class="flex items-center gap-4px flex-1 overflow-hidden">
            <template v-for="(item, index) in breadcrumbItems" :key="index">
              <span v-if="index > 0" class="opacity-50">/</span>
              <NButton
                size="tiny"
                quaternary
                :disabled="index === breadcrumbItems.length - 1"
                @click="handleBreadcrumbClick(item.path)"
              >
                {{ item.name }}
              </NButton>
            </template>
          </div>
        </div>

        <!-- 共享列表模式：选中操作栏 -->
        <div v-if="!isBrowsingFolder && checkedCount > 0" class="flex items-center gap-12px px-4px py-8px">
          <span class="text-13px opacity-70">已选中 {{ checkedCount }} 项</span>
          <NButton size="small" type="error" @click="handleBatchCancel">
            退出共享
          </NButton>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 min-h-0 overflow-auto">
          <FileEmpty v-if="showEmpty" :description="isBrowsingFolder ? '文件夹为空' : $t('page.disk.groupShare.empty')" />

          <!-- PC端：表格视图 -->
          <template v-if="!showEmpty">
            <!-- 共享列表 -->
            <NDataTable
              v-if="!isBrowsingFolder"
              class="lt-sm:hidden"
              :columns="shareColumns"
              :data="shareList"
              :row-key="rowKey"
              :row-props="getShareRowProps"
              :loading="loading"
              :checked-row-keys="checkedRowKeys"
              :max-height="500"
              :scroll-x="1000"
              @update:checked-row-keys="checkedRowKeys = $event as number[]"
            />

            <!-- 文件夹内容 -->
            <NDataTable
              v-if="isBrowsingFolder"
              class="lt-sm:hidden"
              :columns="folderColumns"
              :data="folderContents"
              :row-key="folderRowKey"
              :row-props="getFolderRowProps"
              :loading="loading"
              :max-height="500"
              :scroll-x="600"
            />
          </template>

          <!-- 手机端：卡片列表视图 -->
          <NSpin v-if="!showEmpty" :show="loading" class="sm:hidden lt-sm:block">
            <!-- 共享列表卡片 -->
            <div v-if="!isBrowsingFolder && shareList.length > 0" class="flex flex-col gap-12px p-12px">
              <div
                v-for="item in shareList"
                :key="item.fileShareId"
                class="flex flex-col gap-8px p-12px rd-8px bg-gray-50 dark:bg-gray-800 cursor-pointer"
                @click="handleShareFileDblClick(item)"
              >
                <!-- 文件信息 -->
                <div class="flex items-center gap-8px">
                  <FileIcon
                    :file-type="contentTypeToFileType(item.contentType, item.isFolder)"
                    :extension="item.contentType"
                    size="medium"
                  />
                  <span class="flex-1 truncate text-14px font-medium">{{ item.fileName }}</span>
                </div>

                <!-- 分享者 + 权限 -->
                <div class="flex items-center gap-8px text-12px">
                  <span class="opacity-50">来自：</span>
                  <span class="opacity-70">{{ item.shareUserName }}</span>
                  <div class="flex flex-wrap gap-4px ml-auto">
                    <NTag
                      v-for="p in item.permissions"
                      :key="p"
                      size="small"
                      :type="permissionTagTypeMap[p] || 'default'"
                    >
                      {{ permissionLabelMap[p] || p }}
                    </NTag>
                  </div>
                </div>

                <!-- 时间信息 -->
                <div class="flex items-center justify-between text-12px opacity-60">
                  <span>{{ formatDateShort(item.createdAt) }} 分享</span>
                  <span>{{ item.expireDate ? formatDateShort(item.expireDate) + ' 过期' : '永久有效' }}</span>
                </div>

                <!-- 操作按钮 -->
                <div class="flex items-center justify-end gap-8px pt-4px">
                  <NButton size="tiny" quaternary @click.stop="handleDownload([convertToFileItem(item)])">
                    下载
                  </NButton>
                  <NButton size="tiny" quaternary @click.stop="handleShareFile(convertToFileItem(item))">
                    共享
                  </NButton>
                  <NButton size="tiny" type="error" quaternary @click.stop="handleCancelSingle(item.fileShareId, item.fileName)">
                    退出
                  </NButton>
                </div>
              </div>
            </div>

            <!-- 文件夹内容卡片 -->
            <div v-if="isBrowsingFolder && folderContents.length > 0" class="flex flex-col gap-12px p-12px">
              <!-- 返回按钮 -->
              <NButton size="small" quaternary block @click="exitSharedFolder">
                <template #icon>
                  <icon-mdi-arrow-left class="text-16px" />
                </template>
                返回共享列表
              </NButton>

              <div
                v-for="file in folderContents"
                :key="file.fileId"
                class="flex items-center gap-8px p-12px rd-8px bg-gray-50 dark:bg-gray-800 cursor-pointer"
                @click="handleFolderFileDblClick(file)"
              >
                <FileIcon
                  :file-type="file.isDir ? 'folder' : contentTypeToFileType(file.contentType || '', false)"
                  :extension="file.fileExtension || file.extendName"
                  size="medium"
                />
                <span class="flex-1 truncate text-14px font-medium">{{ file.fileName || file.name }}</span>
                <span v-if="!file.isDir" class="text-12px opacity-60">{{ formatFileSize(file.fileSize || file.size || 0) }}</span>
                <NButton
                  v-if="!file.isDir"
                  size="tiny"
                  quaternary
                  @click.stop="handleFolderFileDownload(file)"
                >
                  下载
                </NButton>
              </div>
            </div>
          </NSpin>
        </div>

        <!-- 分页 -->
        <div v-if="!isBrowsingFolder && total > pagination.pageSize" class="flex justify-end px-4px py-12px">
          <NPagination
            :page="pagination.pageNum"
            :page-count="Math.ceil(total / pagination.pageSize)"
            :page-size="pagination.pageSize"
            simple
            @update:page="handlePageChange"
          />
        </div>
        <div v-if="isBrowsingFolder && folderTotal > folderPagination.pageSize" class="flex justify-end px-4px py-12px">
          <NPagination
            :page="folderPagination.pageNum"
            :page-count="Math.ceil(folderTotal / folderPagination.pageSize)"
            :page-size="folderPagination.pageSize"
            simple
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </NCard>

    <!-- 右键菜单 -->
    <NDropdown
      :show="ctxMenuVisible"
      placement="bottom-start"
      trigger="manual"
      :x="ctxMenuX"
      :y="ctxMenuY"
      :options="isBrowsingFolder ? folderCtxMenuOptions : ctxMenuOptions"
      :menu-props="() => ({ class: 'disk-ctx-glass' })"
      @clickoutside="ctxMenuVisible = false"
      @select="handleCtxMenuSelect"
    />

    <!-- MoveCopyDialog -->
    <MoveCopyDialog @success="getData" />

    <!-- ShareDialog -->
    <ShareDialog :existing-share="existingShareInfo" @success="getData" />

    <!-- Office/PDF 预览 -->
    <FilePreviewOverlay v-model:visible="previewVisible" :file="previewFile" />

    <!-- 图片预览 -->
    <ImagePreview ref="imagePreviewRef" />

    <!-- 视频预览 -->
    <Teleport to="body">
      <VideoPreview
        v-if="videoPreviewVisible && videoPreviewFile && videoStreamToken"
        :src="videoStreamBaseUrl"
        :file-name="videoPreviewFile.fileName || videoPreviewFile.name || ''"
        :stream-token="videoStreamToken"
        @close="handleVideoClose"
        @token-update="handleVideoTokenUpdate"
      />
    </Teleport>

    <!-- 音频预览 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="audioPreviewVisible"
          class="fixed inset-0 z-9999 flex items-center justify-center"
          :class="isAudioCompact ? 'pointer-events-none' : 'bg-black/40 backdrop-blur-sm'"
          @click.self="handleAudioOverlayClick"
        >
          <AudioPreview
            v-if="audioPreviewFile && currentAudioPlaylist.length > 0"
            :playlist="currentAudioPlaylist"
            :initial-index="currentAudioIndex"
            @close="handleAudioClose"
            @compact-change="isAudioCompact = $event"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- 文本预览 -->
    <TextPreview />
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>