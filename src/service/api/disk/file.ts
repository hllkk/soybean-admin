import { useAuthStore } from '@/store/modules/auth';
import { useDiskStore } from '@/store/modules/disk';
import { request } from '@/service/request';

/** 获取文件列表 */
export function fetchGetFileList(params?: Api.Disk.FileSearchParams) {
  const diskStore = useDiskStore();
  const userId = Number(useAuthStore().userInfo.userId);

  const currentDirectory = diskStore.currentPath.length > 0
    ? `/${diskStore.currentPath.map(item => item.fileName).join('/')}`
    : '/';

  const queryType = params?.fileType && params.fileType !== 'all' ? params.fileType : '';

  return request<any>({
    url: '/file-meta/list',
    method: 'get',
    params: {
      userId,
      currentDirectory,
      queryType,
      page: params?.pageNum || 1,
      pageSize: params?.pageSize || 50,
      sortBy: params?.sortField === 'modifyTime' ? 'time' : params?.sortField,
      sortOrder: params?.sortOrder
    }
  });
}

/** 将后端 FileListResponse 转换为前端 FileItem 格式 */
export function mapBackendFileList(backendData: { list: any[]; total: number }) {
  const list: Api.Disk.FileItem[] = (backendData.list || []).map(item => ({
    createBy: '',
    createTime: item.createTime || '',
    updateBy: '',
    updateTime: item.updateTime || '',
    fileId: item.id,
    fileName: item.name,
    fileType: item.contentType || (item.isDir ? 'folder' : 'other'),
    fileSize: item.size,
    fileExtension: item.extendName,
    parentId: null,
    filePath: item.filePath,
    modifyTime: item.updateTime,
    isFolder: item.isDir,
    icon: item.isDir ? 'material-symbols:folder' : getFileIcon(item.extendName)
  }));

  return { rows: list, total: backendData.total || 0 };
}

function getFileIcon(ext?: string): string {
  if (!ext) return 'material-symbols:description';
  const lower = ext.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(lower)) return 'material-symbols:image';
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'].includes(lower)) return 'material-symbols:videocam';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(lower)) return 'material-symbols:audiotrack';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'md'].includes(lower)) return 'material-symbols:description';
  return 'material-symbols:description';
}

/** 秒传/断点检测 (GET /file-meta/upload) */
export function fetchCheckFile(params: Api.Disk.FileCheckParams) {
  return request<Api.Disk.FileCheckResponse>({
    url: '/file-meta/upload',
    method: 'get',
    params
  });
}

/** 上传文件/分片 (POST /file-meta/upload) */
export function fetchUploadChunk(data: Api.Disk.ChunkUploadParams) {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('identifier', data.identifier);
  formData.append('chunkNumber', String(data.chunkNumber));
  formData.append('chunkSize', String(data.chunkSize));
  formData.append('currentChunkSize', String(data.currentChunkSize));
  formData.append('totalSize', String(data.totalSize));
  formData.append('filename', data.fileName);
  formData.append('relativePath', data.relativePath);
  formData.append('totalChunks', String(data.totalChunks));
  formData.append('userId', String(data.userId));

  if (data.currentDirectory) formData.append('currentDirectory', data.currentDirectory);
  if (data.isFolder) formData.append('isFolder', 'true');
  if (data.folderPath) formData.append('folderPath', data.folderPath);

  return request<{ pass: boolean; upload: boolean; merge: boolean }>({
    url: '/file-meta/upload',
    method: 'post',
    data: formData,
    timeout: 5 * 60 * 1000,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 合并分片 (POST /file-meta/merge) */
export function fetchMergeChunks(data: Api.Disk.MergeChunksParams) {
  return request<boolean>({
    url: '/file-meta/merge',
    method: 'post',
    data,
    timeout: 5 * 60 * 1000
  });
}

/** 新建文件夹 */
export function fetchCreateFolder(data: Api.Disk.CreateFolderParams) {
  return request<boolean>({
    url: '/file-meta/createFolder',
    method: 'post',
    data
  });
}

/** 重命名文件 */
export function fetchRenameFile(fileId: CommonType.IdType, newName: string) {
  return request<boolean>({
    url: '/file-meta/rename',
    method: 'post',
    data: { fileId, newName }
  });
}

/** 删除文件(移到回收站) */
export function fetchDeleteFile(fileIds: CommonType.IdType[]) {
  return request<{ success: boolean; message: string }>({
    url: '/file-meta/delete',
    method: 'delete',
    data: { fileIds }
  });
}

/** 移动文件 */
export function fetchMoveFile(fileId: CommonType.IdType, targetFolderId: CommonType.IdType) {
  return request<boolean>({
    url: '/file-meta/move',
    method: 'put',
    data: { fileId, targetFolderId }
  });
}

/** 路径解析 - 用于URL导航恢复 */
export function fetchResolvePath(path: string) {
  return request<Api.Disk.PathResolveResponse>({
    url: '/file-meta/path-resolve',
    method: 'get',
    params: { path }
  });
}
