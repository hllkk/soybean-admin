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
 * 注意：初始化可能需要较长时间，设置较长的超时时间
 */
export function fetchInitDB(data: Api.Init.InitDBRequest) {
  return request<void>({
    url: '/init/initDB',
    method: 'post',
    data,
    timeout: 5 * 60 * 1000 // 5分钟超时，初始化可能需要较长时间
  });
}
