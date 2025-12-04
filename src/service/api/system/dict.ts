import { request } from '@/service/request';

/** 获取字典选择框列表 */
export function fetchGetDictTypeOption() {
  return request<Api.System.DictType[]>({
    url: '/dict/type/option',
    method: 'get'
  });
}

/** 批量删除字典类型 */
export function fetchBatchDeleteDictType(dictIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/dict/type/${dictIds.join(',')}`,
    method: 'delete'
  });
}

/** 刷新缓存 */
export function fetchRefreshCache() {
  return request<boolean>({
    url: `/dict/type/refreshCache`,
    method: 'delete'
  });
}

/** 根据字典类型查询字典数据信息 */
export function fetchGetDictDataByType(dictType: string) {
  return request<Api.System.DictData[]>({
    url: `/dict/data/type/${dictType}`,
    method: 'get'
  });
}

/** 获取字典数据列表 */
export function fetchGetDictDataList(params?: Api.System.DictDataSearchParams) {
  return request<Api.System.DictDataList>({
    url: '/dict/data/list',
    method: 'get',
    params
  });
}

/** 批量删除字典数据 */
export function fetchBatchDeleteDictData(dictCodes: CommonType.IdType[]) {
  return request<boolean>({
    url: `/dict/data/${dictCodes.join(',')}`,
    method: 'delete'
  });
}
