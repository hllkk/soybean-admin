import { request } from '@/service/request';

/** 获取菜单列表 */
export function fetchGetMenuList(params?: Api.System.MenuSearchParams, signal?: AbortSignal) {
  return request<Api.System.MenuList>({
    url: '/system/menu/list',
    method: 'get',
    params,
    signal
  });
}

/** 新增菜单 */
export function fetchCreateMenu(data: Api.System.MenuOperateParams) {
  return request<boolean>({
    url: '/system/menu',
    method: 'post',
    data
  });
}

/** 修改菜单 */
export function fetchUpdateMenu(data: Api.System.MenuOperateParams) {
  return request<boolean>({
    url: '/system/menu',
    method: 'put',
    data
  });
}

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

/** 删除菜单 */
export function fetchDeleteMenu(menuId: CommonType.IdType) {
  return request<boolean>({
    url: `/system/menu/${menuId}`,
    method: 'delete'
  });
}

/** 级联删除菜单 */
export function fetchCascadeDeleteMenu(menuIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/system/menu/cascade/${menuIds.join(',')}`,
    method: 'delete'
  });
}

/** 获取菜单详情 */
export function fetchGetMenuDetail(id: CommonType.IdType) {
  return request<Api.System.MenuDetail>({
    url: `/system/menu/${id}`,
    method: 'get'
  });
}

/** 更新菜单排序 */
export function fetchUpdateMenuSort(data: { menuId: CommonType.IdType; orderBy: number }) {
  return request<boolean>({
    url: '/system/menu/sort',
    method: 'put',
    data
  });
}

/** 创建按钮权限 */
export function fetchCreateButton(data: Api.System.ButtonOperateParams) {
  return request<boolean>({
    url: '/system/menu/button',
    method: 'post',
    data
  });
}

/** 更新按钮权限 */
export function fetchUpdateButton(data: Api.System.ButtonOperateParams) {
  return request<boolean>({
    url: '/system/menu/button',
    method: 'put',
    data
  });
}

/** 删除按钮权限 */
export function fetchDeleteButton(id: CommonType.IdType) {
  return request<boolean>({
    url: `/system/menu/button/${id}`,
    method: 'delete'
  });
}
