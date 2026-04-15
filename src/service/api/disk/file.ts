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