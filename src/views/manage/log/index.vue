<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({
  name: 'LogManagePage'
});

const router = useRouter();

// 默认重定向到操作日志
onMounted(() => {
  router.replace('/manage/log/operation');
});
</script>

<template>
  <div class="h-full flex-center">
    <NSpin size="large" />
  </div>
</template>

<style scoped></style>