<script lang="ts" setup>
import { computed, toRefs, watch } from 'vue';
import { useAppStore } from '@/store/modules/app';
import DiskBaseSettings from './modules/base-settings.vue';
import DiskPersonalizationSettings from './modules/personalization-settings.vue';
import OnlyOfficeSettings from './modules/onlyoffice-settings.vue';
import VideoTranscodeSettings from './modules/transcode-settings.vue';

defineOptions({
  name: 'DiskSettings'
});

const props = defineProps<{
  model: Api.System.DiskSettings;
}>();

const { model } = toRefs(props);

// 确保对象存在
watch(
  () => model.value,
  () => {
    if (!model.value.onlyOffice) {
      model.value.onlyOffice = { enable: false };
    }
    if (!model.value.videoTranscode) {
      model.value.videoTranscode = { enable: false };
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
    <NTabPane name="base" tab="基础配置">
      <DiskBaseSettings :model="model" />
    </NTabPane>
    <NTabPane name="personalization" tab="个性化配置">
      <DiskPersonalizationSettings :model="model" />
    </NTabPane>
    <NTabPane name="onlyoffice" tab="OnlyOffice 配置">
      <OnlyOfficeSettings :model="model.onlyOffice || {}" />
    </NTabPane>
    <NTabPane name="transcode" tab="视频转码配置">
      <VideoTranscodeSettings :model="model.videoTranscode || {}" />
    </NTabPane>
  </NTabs>
</template>
