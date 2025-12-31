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
    url: 'file/check-exist',
    method: 'get',
    params
  });
}
