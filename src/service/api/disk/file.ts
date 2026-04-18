import { request } from '@/service/request';

/** 获取文件列表 */
export function fetchGetFileList(params?: Api.Disk.FileSearchParams) {
  return request<Api.Disk.FileList>({
    url: '/disk/file/list',
    method: 'get',
    params
  });
}

/** 上传文件 */
export function fetchUploadFile(data: Api.Disk.UploadFileParams) {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('parentId', String(data.parentId ?? 0));

  return request<boolean>({
    url: '/disk/file/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 新建文件夹 */
export function fetchCreateFolder(data: Api.Disk.CreateFolderParams) {
  return request<boolean>({
    url: '/disk/file/folder',
    method: 'post',
    data
  });
}

/** 删除文件 */
export function fetchDeleteFile(fileId: CommonType.IdType) {
  return request<boolean>({
    url: `/disk/file/${fileId}`,
    method: 'delete'
  });
}

/** 批量删除文件 */
export function fetchBatchDeleteFile(fileIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/disk/file/${fileIds.join(',')}`,
    method: 'delete'
  });
}

/** 移动文件 */
export function fetchMoveFile(fileId: CommonType.IdType, targetFolderId: CommonType.IdType) {
  return request<boolean>({
    url: '/disk/file/move',
    method: 'put',
    data: { fileId, targetFolderId }
  });
}

/** 重命名文件 */
export function fetchRenameFile(fileId: CommonType.IdType, newName: string) {
  return request<boolean>({
    url: '/disk/file/rename',
    method: 'put',
    data: { fileId, newName }
  });
}

/** 秒传检测 */
export function fetchCheckFile(data: Api.Disk.FileCheckParams) {
  return request<Api.Disk.FileCheckResponse>({
    url: '/disk/file/check',
    method: 'post',
    data
  });
}

/** 分片上传 */
export function fetchUploadChunk(data: Api.Disk.ChunkUploadParams) {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('fileHash', data.fileHash);
  formData.append('chunkIndex', String(data.chunkIndex));
  formData.append('totalChunks', String(data.totalChunks));
  formData.append('fileName', data.fileName);
  formData.append('parentId', String(data.parentId));

  return request<boolean>({
    url: '/disk/file/chunk',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 合并分片 */
export function fetchMergeChunks(data: Api.Disk.MergeChunksParams) {
  return request<Api.Disk.MergeChunksResponse>({
    url: '/disk/file/merge',
    method: 'post',
    data
  });
}