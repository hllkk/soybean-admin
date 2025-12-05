<script lang="ts" setup>
import { computed, toRefs, watch } from 'vue';
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

// 确保wecom对象存在
watch(
  () => model.value,
  () => {
    if (!model.value.wecom) {
      model.value.wecom = {};
    }
    if (!model.value.wechat) {
      model.value.wechat = {};
    }
    if (!model.value.gitee) {
      model.value.gitee = {};
    }
  },
  { immediate: true }
);

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
