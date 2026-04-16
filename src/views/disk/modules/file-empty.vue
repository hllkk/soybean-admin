<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'FileEmpty'
});

const diskStore = useDiskStore();

// 当前查询的文件类型
const queryType = computed(() => diskStore.currentFileType);

// 根据文件类型生成空状态文案
const emptyText = computed(() => {
  const typeMap: Record<string, string> = {
    all: '',
    image: '图片',
    document: '文档',
    video: '视频',
    audio: '音频',
    other: '其他'
  };
  const typeName = typeMap[queryType.value] || '';
  return typeName ? $t('page.disk.file.emptyWithType', { type: typeName }) : $t('page.disk.file.empty');
});

// 是否显示上传提示
const showUploadTip = computed(() => queryType.value === 'all');
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center py-40px">
    <!-- 空状态图标 -->
    <div class="mb-16px opacity-60">
      <icon-local-kongkong class="text-[var(--n-text-color-disabled)] size-60" />
    </div>

    <!-- 空状态文案 -->
    <div class="text-center">
      <p class="text-16px text-[var(--n-text-color-disabled)] mb-8px">
        {{ emptyText }}
      </p>
      <p v-if="showUploadTip" class="text-14px text-[var(--n-text-color-3)]">
        {{ $t('page.disk.file.emptyUploadTip') }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
