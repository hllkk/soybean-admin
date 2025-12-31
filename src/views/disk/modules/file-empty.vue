<script lang="ts" setup>
import { computed } from 'vue';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'FileEmpty'
});

const diskStore = useDiskStore();
const queryType = computed(() => diskStore.queryType);

const noFileText = computed(() => {
  switch (queryType.value) {
    case 'all':
      return '';
    case 'image':
      return '图片';
    case 'video':
      return '视频';
    case 'audio':
      return '音频';
    case 'document':
      return '文档';
    case 'other':
      return '其他';
    default:
      return '';
  }
});
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center">
    <div class="mb-4">
      <icon-local-kongkong class="text-90 transition-all duration-300 hover:scale-110" />
    </div>

    <span class="select-none text-sm text-gray-600 font-medium">
      {{ noFileText ? `还没有${noFileText}文件呢~` : '还没有文件呢~' }}~
    </span>
  </div>
</template>
