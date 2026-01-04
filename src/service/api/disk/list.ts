import qs from 'qs';
import { request } from '../../request';

export function fetchGetFileList(params: Api.Disk.GetFileListRequest) {
  return request<Api.Disk.FileItem[]>({
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

export function fetchCreateFolder(params: Api.Disk.CreateFolderRequest) {
  return request({
    url: 'file/uploadFolder',
    method: 'post',
    data: params,
    paramsSerializer: p => {
      return qs.stringify(p, { arrayFormat: 'repeat' });
    }
  });
}

export function fetchNewFolder(params: any) {
  return request({
    url: 'file/newFolder',
    method: 'post',
    data: params
  });
}
