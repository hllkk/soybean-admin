import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchGetPublicSystemSettings } from '@/service/api/system/setting';

export const useSystemConfigStore = defineStore('system-config', () => {
  const config = ref<Api.SystemManage.PublicSettings | null>(null);

  // 默认配置
  const DEFAULT_CONFIG = {
    systemName: 'OPS管理系统',
    systemDescription: '企业运维管理平台',
    logoUrl: '',
    faviconUrl: ''
  };

  /** 从后端获取配置 */
  async function fetchConfig() {
    const { data, error } = await fetchGetPublicSystemSettings();

    if (!error && data) {
      config.value = data;
    } else {
      // 获取失败时使用默认值，不阻塞启动
      config.value = null;
    }
  }

  /** 获取系统名称 */
  function getSystemName(): string {
    return config.value?.systemName || DEFAULT_CONFIG.systemName;
  }

  /** 获取 Logo URL */
  function getLogoUrl(): string | null {
    return config.value?.logoUrl || null;
  }

  /** 获取 Favicon URL */
  function getFaviconUrl(): string | null {
    return config.value?.faviconUrl || null;
  }

  /** 获取系统描述 */
  function getSystemDescription(): string {
    return config.value?.systemDescription || DEFAULT_CONFIG.systemDescription;
  }

  /** 是否启用验证码 */
  function isVerifyCodeEnabled(): boolean {
    return config.value?.enableVerifyCode || false;
  }

  /** 获取验证码类型 */
  function getVerifyCodeType(): string {
    return config.value?.verifyCodeType || 'click';
  }

  /** 获取验证码误差 */
  function getVerifyInaccuracy(): number {
    return config.value?.verifyInaccuracy || 40;
  }

  /** 获取验证码长度 */
  function getVerifyCodeLen(): number {
    return config.value?.verifyCodeLen || 4;
  }

  /** 获取验证码过期时间 */
  function getVerifyCodeExp(): number {
    return config.value?.verifyCodeExp || 5;
  }

  /** 获取验证码Token过期时间 */
  function getVerifyCodeTokenExp(): number {
    return config.value?.verifyCodeTokenExp || 5;
  }

  /** 企业微信是否启用 */
  function isWecomEnabled(): boolean {
    return config.value?.enableWecom || false;
  }

  /** 微信是否启用 */
  function isWechatEnabled(): boolean {
    return config.value?.enableWechat || false;
  }

  /** Gitee 是否启用 */
  function isGiteeEnabled(): boolean {
    return config.value?.enableGitee || false;
  }

  /** Github 是否启用 */
  function isGithubEnabled(): boolean {
    return config.value?.enableGithub || false;
  }

  /** 是否有任意第三方登录启用 */
  const hasAnyThirdPartyLogin = computed(() => isWecomEnabled() || isWechatEnabled() || isGiteeEnabled() || isGithubEnabled());

  return {
    config,
    fetchConfig,
    getSystemName,
    getLogoUrl,
    getFaviconUrl,
    getSystemDescription,
    isVerifyCodeEnabled,
    getVerifyCodeType,
    getVerifyInaccuracy,
    getVerifyCodeLen,
    getVerifyCodeExp,
    getVerifyCodeTokenExp,
    isWecomEnabled,
    isWechatEnabled,
    isGiteeEnabled,
    isGithubEnabled,
    hasAnyThirdPartyLogin
  };
});