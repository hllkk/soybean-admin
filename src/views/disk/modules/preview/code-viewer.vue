<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getMonacoLanguage } from '@/utils/file-type';

defineOptions({ name: 'CodeViewer' });

interface Props {
  url: string;
  fileName: string;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLDivElement>();
const loading = ref(true);
const errorMsg = ref('');
const content = ref('');
let editor: any = null;

const language = computed(() => getMonacoLanguage(props.fileName));

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

onMounted(async () => {
  try {
    const response = await fetch(props.url);
    if (!response.ok) {
      errorMsg.value = `加载失败: ${response.statusText}`;
      loading.value = false;
      return;
    }

    const text = await response.text();
    if (text.length > MAX_FILE_SIZE) {
      content.value = text.slice(0, MAX_FILE_SIZE) + '\n\n... 文件过大，仅显示前 1MB ...';
    } else {
      content.value = text;
    }

    // Dynamic import monaco-editor
    const monaco = await import('monaco-editor');

    if (containerRef.value) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      editor = monaco.editor.create(containerRef.value, {
        value: content.value,
        language: language.value,
        theme: isDark ? 'vs-dark' : 'vs',
        readOnly: true,
        minimap: { enabled: content.value.length < 100000 },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        automaticLayout: true,
        fontSize: 13,
        renderLineHighlight: 'none'
      });
    }
  } catch (err) {
    errorMsg.value = `加载失败: ${err instanceof Error ? err.message : '未知错误'}`;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  editor?.dispose();
  editor = null;
});
</script>

<template>
  <div class="code-viewer-container">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <NSpin size="large" />
    </div>
    <div v-else-if="errorMsg" class="flex items-center justify-center h-full text-red-400">
      {{ errorMsg }}
    </div>
    <div v-else ref="containerRef" class="code-editor" />
  </div>
</template>

<style scoped>
.code-viewer-container {
  width: 100%;
  height: 100%;
}

.code-editor {
  width: 100%;
  height: 100%;
}
</style>
