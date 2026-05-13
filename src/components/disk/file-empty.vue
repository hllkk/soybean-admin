<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'FileEmpty'
});

interface Props {
  /** Custom empty text, overrides diskStore-based auto text */
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: undefined
});

const diskStore = useDiskStore();

const queryType = computed(() => diskStore.currentFileType);

const emptyText = computed(() => {
  if (props.description) return props.description;

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

const showUploadTip = computed(() => !props.description && queryType.value === 'all');
</script>

<template>
  <div class="flex flex-col items-center justify-center" style="min-height: calc(100vh - 320px);">
    <div class="mb-16px opacity-60">
      <icon-local-kongkong class="text-[var(--n-text-color-disabled)] size-60" />
    </div>

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
