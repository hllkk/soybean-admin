<script lang="ts" setup>
import { computed, toRefs } from 'vue';
import { useAppStore } from '@/store/modules/app';
import WecomSettings from './wecom-settings.vue';
import WechatSettings from './wechat-settings.vue';
import GiteeSettings from './gitee-settings.vue';

defineOptions({
  name: 'AuthenticationSettings'
});

const props = defineProps<{
  model: Api.System.AuthenticationSettings;
}>();

const { model } = toRefs(props);

const appStore = useAppStore();

const tabsPlacement = computed(() => {
  return appStore.isMobile ? 'top' : 'left';
});
</script>

<template>
  <NTabs type="line" :placement="tabsPlacement" animated>
    <NTabPane name="wecom" tab="企业微信">
      <WecomSettings :model="model.wecom || {}" />
    </NTabPane>
    <NTabPane name="wechat" tab="微信">
      <WechatSettings :model="model.wechat || {}" />
    </NTabPane>
    <NTabPane name="gitee" tab="Gitee">
      <GiteeSettings :model="model.gitee || {}" />
    </NTabPane>
  </NTabs>
</template>
