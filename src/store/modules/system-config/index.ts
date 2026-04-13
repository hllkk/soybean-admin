import { ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchGetSystemSettings } from '@/service/api/system/setting';

export const useSystemConfigStore = defineStore('system-config', () => {
  const config = ref<Api.SystemManage.GeneralSettings | null>(null);

  // 默认配置
  const DEFAULT_CONFIG = {
    systemName: 'OPS管理系统',
    systemDescription: '企业运维管理平台',
    logoUrl: '',
    faviconUrl: ''
  };

  /** 从后端获取配置 */
  async function fetchConfig() {
    const { data, error } = await fetchGetSystemSettings();

    if (!error && data) {
      config.value = data.general || null;
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
    return config.value?.verifyInaccuracy || 5;
  }

  return {
    config,
    fetchConfig,
    getSystemName,
    getLogoUrl,
    getFaviconUrl,
    getSystemDescription,
    isVerifyCodeEnabled,
    getVerifyCodeType,
    getVerifyInaccuracy
  };
});