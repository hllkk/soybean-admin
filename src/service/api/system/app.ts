import { request } from '@/service/request';

/** 获取应用列表 */
export function fetchGetAppList() {
  return request<Api.System.AppList>({
    url: '/system/app/list',
    method: 'get'
  });
}