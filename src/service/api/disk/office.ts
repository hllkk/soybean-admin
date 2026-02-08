import type { IConfig } from '@onlyoffice/document-editor-vue';
import { request } from '../../request';

/**
 * 获取OnlyOffice配置
 * @param fileId 文件ID
 */
export function fetchGetOnlyOfficeConfig(fileId: string | number) {
  return request<Api.Disk.OnlyOfficeConfig>({
    url: `/office/config/${fileId}`,
    method: 'get'
  });
}

/**
 * 获取Office的JWT
 *
 */
export function fetchGetOfficeJWT(data?: IConfig) {
  return request<string>({
    url: `/office/signature`,
    method: 'post',
    data
  });
}
