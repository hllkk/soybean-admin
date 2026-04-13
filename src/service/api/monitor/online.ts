import { request } from '@/service/request';

/** 获取在线设备列表 */
export function fetchGetOnlineDeviceList() {
  return request<Api.Monitor.OnlineDevice[]>({
    url: '/monitor/online/list',
    method: 'get'
  });
}

/** 强制下线指定设备 */
export function fetchKickOutCurrentDevice(tokenId: string) {
  return request<boolean>({
    url: `/monitor/online/${tokenId}`,
    method: 'delete'
  });
}