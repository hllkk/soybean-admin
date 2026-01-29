import qs from 'qs';
import { getServiceBaseURL } from '@/utils/service';
import { request } from '../../request';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const simpleUploadURL = `${baseURL}/file/upload`;

export function fetchGetFileList(params: Api.Disk.GetFileListRequest) {
  return request<Api.Disk.FileListPagedResponse>({
    url: 'file/list',
    method: 'get',
    params
  });
}

export function fetchCheckExist(params: Api.Disk.CheckExistRequest) {
  return request<Api.Disk.CheckExistResponse>({
    url: 'file/checkExist',
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
    url: 'file/merge',
    method: 'post',
    data: params
  });
}

export function fetchNewFolder(params: any) {
  return request({
    url: 'file/newFolder',
    method: 'post',
    data: params
  });
}

export function fetchIsAllowDownload(params: { fileIds: CommonType.IdType[]; userId: CommonType.IdType }) {
  return request<Api.Disk.IsAllowDownloadResponse>({
    url: 'file/isAllowDownload',
    method: 'post',
    data: params
  });
}

export function fetchIsAllowPackageDownload(params: { fileIds: CommonType.IdType[]; userId: CommonType.IdType }) {
  return request<Api.Disk.IsAllowPackageDownloadResponse>({
    url: 'file/isAllowPackageDownload',
    method: 'post',
    data: params
  });
}
