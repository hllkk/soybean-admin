import { request } from '@/service/request';

/** 获取岗位选择框列表 */
export function fetchGetPostSelect(deptId?: CommonType.IdType, postIds?: CommonType.IdType[]) {
  return request<Api.System.Post[]>({
    url: '/post/options',
    method: 'get',
    params: { postIds, deptId }
  });
}
