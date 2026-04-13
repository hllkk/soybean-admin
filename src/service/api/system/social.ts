import { request } from '@/service/request';

/** 获取社交账号绑定列表 */
export function fetchGetSocialList() {
  return request<Api.System.Social[]>({
    url: '/system/social/list',
    method: 'get'
  });
}

/** 绑定社交账号（简化版：直接传递第三方账号信息） */
export function fetchSocialAuthBinding(data: {
  source: Api.System.SocialSource;
  authId: string;
  accessToken?: string;
  refreshToken?: string;
  nickName?: string;
  avatar?: string;
  email?: string;
}) {
  return request<boolean>({
    url: '/system/social/bind',
    method: 'post',
    data
  });
}

/** 解绑社交账号 */
export function fetchSocialAuthUnbinding(socialId: CommonType.IdType) {
  return request<boolean>({
    url: `/system/social/${socialId}`,
    method: 'delete'
  });
}