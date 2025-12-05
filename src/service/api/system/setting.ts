import { request } from '../../request';

/** 获取系统设置 */
export function fetchGetSystemSettings() {
  return request<Api.System.SystemSettings>({
    url: '/system/settings',
    method: 'get'
  });
}

/** 更新系统设置 */
export function fetchUpdateSystemSettings(settings: Partial<Api.System.SystemSettings>) {
  return request<Api.System.SystemSettings>({
    url: '/system/settings',
    method: 'put',
    data: settings
  });
}
