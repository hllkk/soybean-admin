import qs from 'qs';
import { getServiceBaseURL } from '@/utils/service';
import { request } from '../../request';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const simpleUploadURL = `${baseURL}/file-meta/upload`;

export function fetchGetFileList(params: Api.Disk.GetFileListRequest) {
  return request<Api.Disk.FileListPagedResponse>({
    url: 'file-meta/list',
    method: 'get',
    params
  });
}

export function fetchCheckExist(params: Api.Disk.CheckExistRequest) {
  return request<Api.Disk.CheckExistResponse>({
    url: 'file-meta/checkExist',
    method: 'post',
    data: params
  });
}

export function fetchUploadFolder(params: Api.Disk.CreateFolderParams) {
  return request({
    url: 'folder/upload',
    method: 'post',
    data: params,
    paramsSerializer: p => {
      return qs.stringify(p, { arrayFormat: 'repeat' });
    }
  });
}

export function fetchMergeFile(params: Api.Disk.FileMergeRequest) {
  return request({
    url: 'file-meta/merge',
    method: 'post',
    data: params
  });
}

export function fetchCreateFile(params: Api.Disk.CreateFileRequest) {
  return request<Api.Disk.FileItem>({
    url: 'file-meta/create',
    method: 'post',
    data: params
  });
}

export function fetchCreateFolder(params: Api.Disk.CreateFolderRequest) {
  return request<Api.Disk.FileItem>({
    url: 'file-meta/createFolder',
    method: 'post',
    data: params
  });
}

export function fetchIsAllowDownload(params: { fileIds: CommonType.IdType[]; userId: CommonType.IdType }) {
  return request<Api.Disk.IsAllowDownloadResponse>({
    url: 'file-meta/isAllowDownload',
    method: 'post',
    data: params
  });
}

export function fetchIsAllowPackageDownload(params: { fileIds: CommonType.IdType[]; userId: CommonType.IdType }) {
  return request<Api.Disk.IsAllowPackageDownloadResponse>({
    url: 'file-meta/isAllowPackageDownload',
    method: 'post',
    data: params
  });
}

export function fetchUpdateFileContent(params: { fileId: string; content: string }) {
  return request({
    url: 'file-meta/updateContent',
    method: 'post',
    data: params
  });
}

export function fetchCreateShare(params: Api.Disk.CreateShareRequest) {
  return request<Api.Disk.ShareInfo>({
    url: 'share/create',
    method: 'post',
    data: params
  });
}

export function fetchUpdateShare(params: Api.Disk.UpdateShareRequest & { shareId: number }) {
  return request<Api.Disk.ShareInfo>({
    url: 'share/update',
    method: 'post',
    data: params
  });
}

export function fetchCancelShare(params: Api.Disk.CancelShareRequest) {
  return request<boolean>({
    url: 'share/cancel',
    method: 'post',
    data: params
  });
}

export function fetchRenameFile(params: Api.Disk.RenameFileRequest) {
  return request({
    url: 'file-meta/rename',
    method: 'post',
    data: params
  });
}

export function fetchGetShareInfo(params: Api.Disk.GetShareInfoRequest) {
  return request<Api.Disk.ShareInfo>({
    url: 'share/info',
    method: 'post',
    data: params
  });
}

export function fetchCheckSubShareConflict(params: Api.Disk.CheckShareConflictRequest) {
  return request<Api.Disk.ShareConflictResponse>({
    url: 'share/conflict',
    method: 'post',
    data: params
  });
}

/** 获取OnlyOffice配置 */
export function fetchGetOnlyOfficeConfig() {
  return request<Api.Disk.OnlyOfficeBackendConfig>({
    url: `/office/config`,
    method: 'get'
  });
}
