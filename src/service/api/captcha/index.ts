import { request } from "../../request";

/** 验证码响应 */
export interface CaptchaResponse {
  captchaKey: string;
  image: string;
  thumb: string;
}

/** 点击坐标 */
export interface ClickDot {
  key: number;
  index: number;
  x: number;
  y: number;
}

/** 验证验证码请求 */
export interface VerifyCaptchaRequest {
  captchaKey: string;
  clickDots: ClickDot[];
}

/** 验证验证码响应 */
export interface VerifyCaptchaResponse {
  captchaToken: string;
  expiresIn: number;
}

/** 获取验证码 */
export function fetchCaptcha() {
  return request<CaptchaResponse>({
    url: "/auth/captcha",
    method: "post"
  });
}

/** 刷新验证码 */
export function fetchCaptchaRefresh(captchaKey: string) {
  return request<CaptchaResponse>({
    url: "/auth/captchaRefresh",
    method: "post",
    data: { captchaKey }
  });
}

/** 验证验证码 */
export function fetchCaptchaVerify(data: VerifyCaptchaRequest) {
  return request<VerifyCaptchaResponse>({
    url: "/auth/captchaVerify",
    method: "post",
    data
  });
}
