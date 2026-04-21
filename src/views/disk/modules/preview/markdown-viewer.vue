<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { localStg } from '@/utils/storage';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({ name: 'MarkdownViewer' });

interface Props {
  url: string;
  fileName: string;
}

const props = defineProps<Props>();

const themeStore = useThemeStore();
const containerRef = ref<HTMLDivElement>();
const loading = ref(true);
const errorMsg = ref('');
const content = ref('');

const isDark = computed(() => themeStore.darkMode);

const MAX_FILE_SIZE = 2 * 1024 * 1024;

async function renderMarkdown() {
  if (!containerRef.value || !content.value) return;

  Vditor.preview(containerRef.value, content.value, {
    mode: isDark.value ? 'dark' : 'light',
    theme: {
      current: isDark.value ? 'dark' : 'light'
    },
    hljs: {
      lineNumber: true,
      style: isDark.value ? 'dracula' : 'github'
    },
    speech: { enable: false }
  });
}

onMounted(async () => {
  try {
    const token = localStg.get('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(props.url, { headers });
    if (!response.ok) {
      errorMsg.value = `加载失败: ${response.statusText}`;
      loading.value = false;
      return;
    }

    const text = await response.text();
    if (text.length > MAX_FILE_SIZE) {
      content.value = text.slice(0, MAX_FILE_SIZE) + '\n\n> 文件过大，仅显示前 2MB';
    } else {
      content.value = text;
    }

    loading.value = false;
    await renderMarkdown();
  } catch (err) {
    errorMsg.value = `加载失败: ${err instanceof Error ? err.message : '未知错误'}`;
    loading.value = false;
  }
});

watch(isDark, () => {
  renderMarkdown();
});

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
});
</script>

<template>
  <div class="markdown-viewer-container">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <NSpin size="large" />
    </div>
    <div v-else-if="errorMsg" class="flex items-center justify-center h-full text-red-400">
      {{ errorMsg }}
    </div>
    <div v-else ref="containerRef" class="markdown-content" />
  </div>
</template>

<style scoped>
.markdown-viewer-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.markdown-content {
  padding: 20px 32px;
  max-width: 960px;
  margin: 0 auto;
}

.markdown-content :deep(.vditor-reset) {
  font-size: 15px;
  line-height: 1.7;
}

.markdown-content :deep(.vditor-reset pre) {
  border-radius: 6px;
}

.markdown-content :deep(.vditor-reset img) {
  max-width: 100%;
  border-radius: 4px;
}

.markdown-content :deep(.vditor-reset table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-content :deep(.vditor-reset th),
.markdown-content :deep(.vditor-reset td) {
  border: 1px solid var(--n-border-color, #e0e0e6);
  padding: 8px 12px;
}

.markdown-content :deep(.vditor-reset th) {
  background-color: var(--n-color-modal, #f5f5f5);
}
</style>
