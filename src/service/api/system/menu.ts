import { request } from '@/service/request';

/** 获取菜单列表 */
export function fetchGetMenuList(params?: Api.System.MenuSearchParams, signal?: AbortSignal) {
  return request<Api.System.MenuList>({
    url: '/menu/list',
    method: 'get',
    params,
    signal
  });
}

/** 获取菜单对应的按钮列表 */
export function fetchGetMenuBtnList(menuId: CommonType.IdType, signal?: AbortSignal) {
  return request<Api.System.MenuButtonList>({
    url: `/button/${menuId}`,
    method: 'get',
    signal
  });
}
