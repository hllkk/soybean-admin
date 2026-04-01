import { request } from '@/service/request';


/** 获取角色菜单权限 */
export function fetchGetRoleMenuTreeSelect(roleId: CommonType.IdType, module?: string) {
  return request<Api.System.RoleMenuTreeSelect>({
    url: `/system/menu/roleMenuTreeselect/${roleId}`,
    method: 'get',
    params: module ? { module } : undefined
  });
}

/** 获取菜单树 */
export function fetchGetMenuTreeSelect(module?: string) {
  return request<Api.System.MenuList>({
    url: 'system/menu/treeselect',
    method: 'get',
    params: module ? { module } : undefined
  });
}
