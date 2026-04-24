import { request } from '@/service/request';

/** 创建分享 */
export function fetchCreateShare(data: Api.Disk.CreateShareParams) {
  return request<Api.Disk.ShareResult>({
    url: '/share/create',
    method: 'post',
    data
  });
}

/** 获取分享信息 */
export function fetchGetShareInfo(fileId: CommonType.IdType) {
  return request<Api.Disk.ShareResult>({
    url: '/share/info',
    method: 'post',
    data: { fileId }
  });
}

/** 取消分享 */
export function fetchCancelShare(shareId: number) {
  return request<boolean>({
    url: '/share/cancel',
    method: 'post',
    data: { shareId }
  });
}