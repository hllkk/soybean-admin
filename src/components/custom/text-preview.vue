<script lang="ts" setup>
import { ref } from 'vue';

// 文本预览组件
defineOptions({
  name: 'TextPreview'
});

const visible = ref(false);
</script>

<template>
  <div v-if="visible" class="size-full">454564564564</div>
</template>
