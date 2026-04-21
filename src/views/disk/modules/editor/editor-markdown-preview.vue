<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({ name: 'EditorMarkdownPreview' });

interface Props {
  content: string;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement>();
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function renderPreview() {
  if (!containerRef.value || !props.content) return;

  Vditor.preview(containerRef.value, props.content, {
    mode: isDark.value ? 'dark' : 'light',
    theme: {
      current: isDark.value ? 'dark' : 'light'
    },
    hljs: {
      lineNumber: true,
      style: isDark.value ? 'dracula' : 'github'
    },
    speech: { enable: false },
    anchor: 0
  });
}

// 防抖渲染
watch(
  () => props.content,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderPreview, 300);
  }
);

// 主题变化时重新渲染
watch(isDark, () => {
  renderPreview();
});

onMounted(() => {
  renderPreview();
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
});
</script>

<template>
  <div class="markdown-preview-container">
    <div class="preview-header">
      <span class="label">预览</span>
    </div>
    <div ref="containerRef" class="preview-content" />
  </div>
</template>

<style scoped>
.markdown-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--n-color-modal, #1a1a1a);
}

.preview-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color, #333);
  flex-shrink: 0;
}

.preview-header .label {
  font-size: 12px;
  color: var(--n-text-color-disabled, #888);
  text-transform: uppercase;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.preview-content :deep(.vditor-reset) {
  font-size: 14px;
  line-height: 1.6;
  color: var(--n-text-color, #d4d4d4);
}

.preview-content :deep(.vditor-reset h1),
.preview-content :deep(.vditor-reset h2),
.preview-content :deep(.vditor-reset h3) {
  color: var(--n-text-color, #e8e8e8);
  border-bottom: 1px solid var(--n-border-color, #444);
}

.preview-content :deep(.vditor-reset code) {
  background: var(--n-color-target, #2d2d2d);
  padding: 2px 6px;
  border-radius: 4px;
}

.preview-content :deep(.vditor-reset pre) {
  background: var(--n-color-target, #2d2d2d);
  border-radius: 6px;
  padding: 12px;
}
</style>