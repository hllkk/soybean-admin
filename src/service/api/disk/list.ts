import { request } from '../../request';

export function fetchGetFileList(params: Api.Disk.GetFileListRequest) {
  return request<Api.Disk.FileItem[]>({
    url: 'file/list',
    method: 'get',
    params
  });
}
