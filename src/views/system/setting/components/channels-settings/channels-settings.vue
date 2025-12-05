<script lang="ts" setup>
import { computed, toRefs } from 'vue';
import { useAppStore } from '@/store/modules/app';
import MailSettings from './mail-settings.vue';

defineOptions({
  name: 'ChannelsSettings'
});

const props = defineProps<{
  model: Api.System.ChannelsSettings;
}>();

const { model } = toRefs(props);

const appStore = useAppStore();

const tabsPlacement = computed(() => {
  return appStore.isMobile ? 'top' : 'left';
});
</script>

<template>
  <NTabs type="line" :placement="tabsPlacement" animated>
    <NTabPane name="email" tab="邮件">
      <MailSettings :model="model" />
    </NTabPane>
    <NTabPane name="wecom" tab="企业微信">待开发</NTabPane>
    <NTabPane name="dingtalk" tab="钉钉">待开发</NTabPane>
    <NTabPane name="feishu" tab="飞书">待开发</NTabPane>
  </NTabs>
</template>
