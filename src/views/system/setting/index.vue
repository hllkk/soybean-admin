<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useLoading } from '@sa/hooks';
import { useAppStore } from '@/store/modules/app';
import { useSettingStore } from '@/store/modules/setting';
import SettingsTabs from './modules/settings-tabs.vue';
import GeneralSettings from './components/general-settings/general-settings.vue';
import AuthenticationSettings from './components/authentication-settings/authentication-settings.vue';
import SecuritySettings from './components/security-settings/security-settings.vue';
import LdapSettings from './components/ldap-settings/ldap-settings.vue';
import ChannelsSettings from './components/channels-settings/channels-settings.vue';

defineOptions({
  name: 'SystemSetting'
});

const appStore = useAppStore();
const settingStore = useSettingStore();
const { loading: saveLoading, startLoading, endLoading } = useLoading();

const showSideDrawder = ref(false);
const clickStatus = ref<Api.System.SettingsClickStatus>('general');
const title = ref('常规设置');

// 从设置Store中获取各个模块的设置数据
const generalSettings = computed(() => settingStore.generalSettings);
const authenticationSettings = computed(() => settingStore.authenticationSettings);
const securitySettings = computed(() => settingStore.securitySettings);
const ldapSettings = computed(() => settingStore.ldapSettings);
const channelsSettings = computed(() => settingStore.channelsSettings);

const isMobile = computed(() => appStore.isMobile);

function changeStatus(status: Api.System.SettingsClickStatus) {
  clickStatus.value = status;
  switch (status) {
    case 'general':
      title.value = '常规配置';
      break;
    case 'authentication':
      title.value = '认证配置';
      break;
    case 'security':
      title.value = '安全配置';
      break;
    case 'ldap':
      title.value = 'LDAP配置';
      break;
    case 'channels':
      title.value = '通知渠道配置';
      break;
    default:
      title.value = '常规配置';
      break;
  }
}

async function handleSave() {
  startLoading();
  try {
    let result = null;
    switch (clickStatus.value) {
      case 'general':
        result = { general: generalSettings.value };
        break;
      case 'authentication':
        result = { authentication: authenticationSettings.value };
        break;
      case 'security':
        result = { security: securitySettings.value };
        break;
      case 'ldap':
        result = { ldap: ldapSettings.value };
        break;
      case 'channels':
        result = { channels: channelsSettings.value };
        break;
      default:
        break;
    }
    if (result) {
      // 访问后端接口进行配置更新
      await settingStore.updateSettings(result);
    } else {
      window.$message?.error('系统配置内容不能为空');
    }
  } catch (error) {
    window.$message?.error(`保存失败, ${error}`);
  } finally {
    endLoading();
  }
}

// 初始化加载设置数据
onMounted(async () => {
  await settingStore.getSystemSettings();
});
</script>

<template>
  <div class="flex flex-col flex-1">
    <NButton
      v-if="isMobile"
      size="small"
      class="mb-10px rounded-md bg-gray-100 bg-opacity-60"
      @click="showSideDrawder = !showSideDrawder"
    >
      <template #icon>
        <icon-mdi-menu class="text-info" />
      </template>
    </NButton>
    <div class="flex flex-1 flex-row">
      <div v-if="!isMobile" class="w-1/5 flex-none">
        <SettingsTabs :click-status="clickStatus" @change-status="changeStatus" />
      </div>
      <div v-else class="flex-none">
        <NDrawer :show="showSideDrawder" :default-height="400" placement="bottom">
          <SettingsTabs :click-status="clickStatus" @change-status="changeStatus" />
        </NDrawer>
      </div>

      <NCard :title="title" :bordered="false" class="ml-4">
        <template #header-extra>
          <NButton type="info" class="dark:text-white" :loading="saveLoading" @click="handleSave">
            {{ $t('common.save') }}
          </NButton>
        </template>
        <NDivider />
        <GeneralSettings v-show="clickStatus === 'general'" v-model:model="generalSettings" />
        <AuthenticationSettings v-show="clickStatus === 'authentication'" v-model:model="authenticationSettings" />
        <SecuritySettings v-show="clickStatus === 'security'" v-model:model="securitySettings" />
        <LdapSettings v-show="clickStatus === 'ldap'" v-model:model="ldapSettings" />
        <ChannelsSettings v-show="clickStatus === 'channels'" v-model:model="channelsSettings" />
      </NCard>
    </div>
  </div>
</template>
