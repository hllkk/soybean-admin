import { request } from '@/service/request';

/** 获取收藏列表 */
export function fetchGetFavoriteList(params: Api.Disk.FavoriteListParams) {
  return request<Api.Disk.FavoriteList>({
    url: '/disk/favorite/list',
    method: 'get',
    params
  });
}

/** 添加收藏 */
export function fetchAddFavorite(fileIds: number[]) {
  return request<boolean>({
    url: '/disk/favorite/add',
    method: 'put',
    data: { fileIds }
  });
}

/** 取消收藏 */
export function fetchRemoveFavorite(fileIds: number[]) {
  return request<boolean>({
    url: '/disk/favorite/remove',
    method: 'put',
    data: { fileIds }
  });
}