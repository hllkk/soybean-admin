import { computed, effectScope, onScopeDispose } from 'vue';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchGetSystemSettings, fetchUpdateSystemSettings } from '@/service/api/system/setting';
import { SetupStoreId } from '@/enum';
import {
  authenticationDefaultData,
  channelsDefaultData,
  generalDefaultData,
  ldapDefaultData,
  securityDefaultData,
  useSettingModule
} from './shared';

export const useSettingStore = defineStore(SetupStoreId.Setting, () => {
  const scope = effectScope();
  const { loading: settingLoading, startLoading, endLoading } = useLoading();

  // 使用模块化的方式管理各个设置项
  const general = useSettingModule(generalDefaultData);
  const authentication = useSettingModule(authenticationDefaultData);
  const security = useSettingModule(securityDefaultData);
  const ldap = useSettingModule(ldapDefaultData);
  const channels = useSettingModule(channelsDefaultData);

  // 创建计算属性以便在组件中直接访问数据
  const generalSettings = computed(() => general.data.value);
  const authenticationSettings = computed(() => authentication.data.value);
  const securitySettings = computed(() => security.data.value);
  const ldapSettings = computed(() => ldap.data.value);
  const channelsSettings = computed(() => channels.data.value);

  // 从后端获取系统设置
  async function getSystemSettings() {
    startLoading();
    try {
      const { data, error } = await fetchGetSystemSettings();

      if (!error && data) {
        // 正确更新每个模块的设置
        if (data.general) general.update(data.general);
        if (data.authentication) authentication.update(data.authentication);
        if (data.security) security.update(data.security);
        if (data.ldap) ldap.update(data.ldap);
        if (data.channels) channels.update(data.channels);
      }
    } finally {
      endLoading();
    }
  }

  // 更新系统设置
  async function updateSettings(settings: Partial<Api.System.SystemSettings>) {
    const { error } = await fetchUpdateSystemSettings(settings);

    if (!error) {
      // 更新本地状态
      if (settings.general) general.update(settings.general);
      if (settings.authentication) authentication.update(settings.authentication);
      if (settings.security) security.update(settings.security);
      if (settings.ldap) ldap.update(settings.ldap);
      if (settings.channels) channels.update(settings.channels);
    }

    return { error };
  }

  // 批量操作方法
  const resetAll = () => {
    general.reset();
    authentication.reset();
    security.reset();
    ldap.reset();
    channels.reset();
  };

  const resetModule = (moduleName: 'general' | 'authentication' | 'security' | 'ldap' | 'channels') => {
    switch (moduleName) {
      case 'general':
        general.reset();
        break;
      case 'authentication':
        authentication.reset();
        break;
      case 'security':
        security.reset();
        break;
      case 'ldap':
        ldap.reset();
        break;
      case 'channels':
        channels.reset();
        break;
      default:
        break;
    }
  };

  // 清理作用域
  onScopeDispose(() => {
    scope.stop();
  });

  return {
    // 各个模块的数据
    general: general.data,
    authentication: authentication.data,
    security: security.data,
    ldap: ldap.data,
    channels: channels.data,
    // 为了组件兼容性，提供带Settings后缀的计算属性
    generalSettings,
    authenticationSettings,
    securitySettings,
    ldapSettings,
    channelsSettings,
    // 加载状态
    settingLoading,
    // 操作方法
    resetAll,
    resetModule,
    getSystemSettings,
    updateSettings
  };
});
