<script setup lang="ts">
import { ref, computed } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import type { SettingConfig } from './types';
import SettingMenu from './components/SettingMenu.vue';
import GeneralSetting from './components/GeneralSetting.vue';
import SecuritySetting from './components/SecuritySetting.vue';
import LdapSetting from './components/LdapSetting.vue';
import DiskSetting from './components/DiskSetting.vue';
import NotifySetting from './components/NotifySetting.vue';
import AuthSetting from './components/AuthSetting.vue';

defineOptions({
  name: 'SettingsPage'
});

const loading = ref(false);
const activeKey = ref('general');

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('lg');

// Config data with all default values
const config = ref<SettingConfig>({
  general: {
    siteName: 'OPS管理系统',
    siteDescription: '企业运维管理平台',
    logo: '',
    favicon: '',
    defaultPassword: '',
    defaultRole: 'user',
    captchaEnabled: false,
    captchaType: 'click',
    captchaTolerance: 5
  },
  security: {
    passwordMinLength: 6,
    passwordRequireSpecial: false,
    loginFailLockCount: 5,
    loginFailLockTime: 30,
    ipValidationEnabled: false,
    ipValidationMode: 'blacklist',
    ipBlacklist: '',
    ipWhitelist: ''
  },
  ldap: {
    enabled: false,
    server: '',
    bindUser: '',
    bindPassword: '',
    baseOU: '',
    searchPageSize: 100,
    fieldMapping: '',
    syncEnabled: false,
    syncDefaultEnabled: true,
    syncStrategy: 'incremental',
    conflictStrategy: 'skip'
  },
  disk: {
    maxUploadSize: 100,
    allowedFileTypes: '.jpg,.png,.pdf,.doc,.zip',
    storageQuota: 10,
    diskName: '',
    diskLogo: '',
    shareLinkPasswordRequired: false,
    shareLinkPasswordMinLength: 6,
    uploadLinkPasswordRequired: false,
    uploadLinkPasswordMinLength: 6,
    syncEnabled: false,
    onlyOfficeEnabled: false,
    onlyOfficeUrl: '',
    onlyOfficeSecret: '',
    onlyOfficeCallbackUrl: '',
    videoTranscodeEnabled: false,
    ffmpegPath: '',
    transcodeThreads: 4,
    transcodePreset: 'medium'
  },
  notify: {
    smtpHost: '',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
    smsEnabled: false,
    smsGateway: '',
    feishuEnabled: false,
    feishuAppId: '',
    feishuAppSecret: '',
    webhookUrl: ''
  },
  auth: {
    weworkEnabled: false,
    weworkDomainFileName: '',
    weworkDomainFileContent: '',
    wechatEnabled: false,
    giteeEnabled: false,
    githubEnabled: false
  }
});

const menuTitleMap: Record<string, string> = {
  general: '常规配置',
  security: '安全配置',
  ldap: 'LDAP配置',
  disk: '网盘配置',
  notify: '通知渠道',
  auth: '认证配置'
};

const currentTitle = computed(() => menuTitleMap[activeKey.value]);

async function handleSave() {
  loading.value = true;
  try {
    // TODO: Call API to save settings
    await new Promise(resolve => setTimeout(resolve, 500));
    window.$message?.success('保存成功');
  } catch {
    window.$message?.error('保存失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="h-full overflow-hidden">
    <!-- Mobile layout -->
    <template v-if="isMobile">
      <NCard :bordered="false" class="card-wrapper h-full">
        <NCollapse :default-expanded-names="['menu']">
          <NCollapseItem name="menu" title="配置选项">
            <SettingMenu v-model:active-key="activeKey" />
          </NCollapseItem>
        </NCollapse>

        <NDivider style="margin: 12px 0" />

        <div class="flex justify-between items-center mb-16px">
          <div class="text-16px font-600">{{ currentTitle }}</div>
          <NButton type="primary" :loading="loading" @click="handleSave">保存</NButton>
        </div>

        <div class="overflow-auto" style="height: calc(100% - 180px)">
          <GeneralSetting v-if="activeKey === 'general'" v-model:config="config.general" />
          <SecuritySetting v-else-if="activeKey === 'security'" v-model:config="config.security" />
          <LdapSetting v-else-if="activeKey === 'ldap'" v-model:config="config.ldap" />
          <DiskSetting v-else-if="activeKey === 'disk'" v-model:config="config.disk" />
          <NotifySetting v-else-if="activeKey === 'notify'" v-model:config="config.notify" />
          <AuthSetting v-else-if="activeKey === 'auth'" v-model:config="config.auth" />
        </div>
      </NCard>
    </template>

    <!-- Desktop layout -->
    <template v-else>
      <NSplit :default-size="0.22" :min="0.18" :max="0.3" class="h-full">
        <template #1>
          <NCard :bordered="false" class="card-wrapper h-full">
            <SettingMenu v-model:active-key="activeKey" />
          </NCard>
        </template>
        <template #2>
          <NCard :bordered="false" class="card-wrapper h-full">
            <!-- Header -->
            <div class="flex justify-between items-center pb-16px" style="border-bottom: 2px solid #e8e8e8">
              <div class="text-16px font-600">{{ currentTitle }}</div>
              <NButton type="primary" :loading="loading" @click="handleSave">保存</NButton>
            </div>

            <!-- Content area -->
            <div class="overflow-auto pt-16px" style="height: calc(100% - 60px)">
              <GeneralSetting v-if="activeKey === 'general'" v-model:config="config.general" />
              <SecuritySetting v-else-if="activeKey === 'security'" v-model:config="config.security" />
              <LdapSetting v-else-if="activeKey === 'ldap'" v-model:config="config.ldap" />
              <DiskSetting v-else-if="activeKey === 'disk'" v-model:config="config.disk" />
              <NotifySetting v-else-if="activeKey === 'notify'" v-model:config="config.notify" />
              <AuthSetting v-else-if="activeKey === 'auth'" v-model:config="config.auth" />
            </div>
          </NCard>
        </template>
      </NSplit>
    </template>
  </div>
</template>

<style scoped>
.card-wrapper {
  border-radius: 8px;
}
</style>