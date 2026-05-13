<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'GroupSharePage'
});
</script>

<template>
  <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <div class="flex-center h-300px">
        <NEmpty :description="$t('route.group-share')" />
      </div>
    </NCard>
  </div>
</template>
