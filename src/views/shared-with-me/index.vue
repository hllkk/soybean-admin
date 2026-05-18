<script setup lang="ts">
import ShareListPage from './modules/share-list-page.vue';

defineOptions({ name: 'SharedWithMePage' });
</script>

<template>
  <ShareListPage share-type="user" :show-filter="true" />
</template>
