import { request } from '../../request';

// 预览文本文件
export function fetchPreviewTextFile(params: Api.Disk.PreviewTextFileRequest) {
  return request<Api.Disk.PreviewTextFileResponse>({
    url: '/preview/text',
    method: 'get',
    params
  });
}

// 通过路径预览文本文件
export function fetchPreviewTextFileByPath(params: Api.Disk.PreviewTextFileRequest) {
  return request<Api.Disk.PreviewTextFileByPathResponse>({
    url: '/preview/path/text',
    method: 'get',
    params
  });
}

// 访问分享的文本文件
export function fetchSharedPreviewTextFile(params: Api.Disk.PreviewTextFileRequest) {
  return request<Api.Disk.AccessSharedTextFileResponse>({
    url: '/preview/shared/text',
    method: 'get',
    params
  });
}
