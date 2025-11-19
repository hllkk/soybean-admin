import { request } from '@/service/request';

/** 获取部门树列表 */
export function fetchGetDeptTree() {
  return request<Api.Common.CommonTreeRecord>({
    url: '/dept/tree',
    method: 'get'
  });
}

/** 获取部门列表 */
export function fetchGetDeptList(params?: Api.System.DeptSearchParams) {
  return request<Api.System.Dept[]>({
    url: '/dept/list',
    method: 'get',
    params
  });
}
