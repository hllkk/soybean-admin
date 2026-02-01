<script lang="ts" setup>
import { ref } from 'vue';

// 视频预览组件
defineOptions({
  name: 'IframePreview'
});

const visible = ref(false);
</script>

<template>
  <div v-if="visible">iframe</div>
</template>
