import { request } from '@/service/request';

/** 获取角色信息列表 */
export function fetchGetRoleList(params?: Api.System.RoleSearchParams) {
  return request<Api.System.RoleList>({
    url: '/role/list',
    method: 'get',
    params
  });
}

/** 获取角色选择框列表 */
export function fetchGetRoleSelect(roleIds?: CommonType.IdType[]) {
  return request<Api.System.Role[]>({
    url: '/role/select',
    method: 'get',
    params: { roleIds }
  });
}
