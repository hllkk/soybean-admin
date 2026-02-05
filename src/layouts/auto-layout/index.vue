<script setup lang="ts">
import { computed } from 'vue';
import { useRouteStore } from '@/store/modules/route';
import BaseLayout from '../base-layout/index.vue';
import DiskLayout from '../disk-layout/index.vue';

defineOptions({
  name: 'AutoLayout'
});

const routeStore = useRouteStore();

const layout = computed(() => {
  const module = routeStore.currentModule;
  if (module === 'disk') {
    return DiskLayout;
  }
  return BaseLayout;
});
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
