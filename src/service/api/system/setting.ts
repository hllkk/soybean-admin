import { request } from '@/service/request';

/** 获取系统设置 */
export function fetchGetSystemSettings() {
  return request<Api.SystemManage.Settings>({
    url: '/system/settings',
    method: 'get'
  });
}

/** 获取验证码状态（公开接口） */
export function fetchGetCaptchaStatus() {
  return request<{ enabled: boolean; type: string }>({
    url: '/system/settings/captchaStatus',
    method: 'get'
  });
}

/** 更新系统设置 */
export function fetchUpdateSystemSettings(settings: Api.SystemManage.Settings) {
  return request<void>({
    url: '/system/settings',
    method: 'put',
    data: settings
  });
}

/** 上传 Logo */
export function fetchUploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<string>({
    url: '/system/settings/upload/logo',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 上传 Favicon */
export function fetchUploadFavicon(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<string>({
    url: '/system/settings/upload/favicon',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}