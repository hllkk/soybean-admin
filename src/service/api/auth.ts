import { request } from "../request";

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 * @param captchaToken Captcha token (optional, required when captcha is enabled)
 */
export function fetchLogin(userName: string, password: string, captchaToken?: string) {
  return request<Api.Auth.LoginToken>({
    url: "/auth/login",
    method: "post",
    data: {
      userName,
      password,
      captchaToken
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: "/auth/getUserInfo" });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: "/auth/refreshToken",
    method: "post",
    data: {
      refreshToken
    }
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: "/auth/error", params: { code, msg } });
}

/** Fetch WeChat Work login QR code info (returns OAuth URL + sceneId) */
export function fetchWecomQrCode() {
  return request<Api.Auth.WecomQrCodeInfo>({
    url: "/auth/wecomLogin",
    method: "get"
  });
}

/** Poll QR code login status */
export function fetchQrCodeStatus(sceneId: string) {
  return request<Api.Auth.QrCodeStatus>({
    url: "/auth/qrCodeStatus",
    method: "get",
    params: { sceneId }
  });
}
