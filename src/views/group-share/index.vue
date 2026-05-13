<script setup lang="ts">
import { $t } from '@/locales';
import FileEmpty from '@/components/disk/file-empty.vue';

defineOptions({
  name: 'GroupSharePage'
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-0 overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper flex-1-hidden">
      <FileEmpty :description="$t('page.disk.groupShare.empty')" />
    </NCard>
  </div>
</template>
