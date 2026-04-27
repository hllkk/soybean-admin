import { request } from '@/service/request';

/** Sync WeChat Work organization structure (departments + users) */
export function fetchSyncWecomStructure() {
  return request<string>({
    url: '/wecom/syncStructure',
    method: 'post'
  });
}
