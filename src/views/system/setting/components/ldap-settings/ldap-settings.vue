<script lang="ts" setup>
import { computed, toRefs } from 'vue';
import { useAppStore } from '@/store/modules/app';
import LdapConfig from './ldap-config.vue';
import LdapSync from './ldap-sync.vue';

defineOptions({
  name: 'LdapSettings'
});

const props = defineProps<{
  model: Api.System.LdapSettings;
}>();

const { model } = toRefs(props);

const appStore = useAppStore();

const tabsPlacement = computed(() => {
  return appStore.isMobile ? 'top' : 'left';
});
</script>

<template>
  <NTabs type="line" :placement="tabsPlacement" animated>
    <NTabPane name="ldap" tab="连接配置">
      <LdapConfig :model="model" />
    </NTabPane>
    <NTabPane name="ldapSync" tab="同步配置">
      <LdapSync :model="model" />
    </NTabPane>
  </NTabs>
</template>
