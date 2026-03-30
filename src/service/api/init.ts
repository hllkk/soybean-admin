import { request } from '../request';

/**
 * 检查数据库是否需要初始化
 */
export function fetchCheckDB() {
  return request<Api.Init.CheckDBResponse>({
    url: '/init/checkDB',
    method: 'get'
  });
}

/**
 * 初始化数据库
 * @param data 初始化参数
 */
export function fetchInitDB(data: Api.Init.InitDBRequest) {
  return request<boolean>({
    url: '/init/initDB',
    method: 'post',
    data
  });
}
