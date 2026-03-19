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
    url: "/api/v1/auth/login",
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
  return request<Api.Auth.UserInfo>({ url: "/api/v1/auth/getUserInfo" });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: "/api/v1/auth/refreshToken",
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
  return request({ url: "/api/v1/auth/error", params: { code, msg } });
}
