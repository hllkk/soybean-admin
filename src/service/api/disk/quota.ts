import { request } from '@/service/request';

/** 获取用户配额信息 */
export function fetchGetQuota() {
  return request<Api.Disk.QuotaInfo>({
    url: '/disk/quota',
    method: 'get'
  });
}

/** 校验上传配额 */
export function fetchCheckQuota(fileSize: number) {
  return request<Api.Disk.QuotaCheckResponse>({
    url: '/disk/quota/check',
    method: 'post',
    data: { fileSize }
  });
}