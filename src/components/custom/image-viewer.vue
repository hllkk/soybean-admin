<script lang="ts" setup>
import { ref } from 'vue';

// 图片预览组件
defineOptions({
  name: 'ImageView'
});

const visible = ref(false);
</script>

<template>
  <div v-if="visible">image</div>
</template>
