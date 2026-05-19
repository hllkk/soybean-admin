<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({ name: 'MonacoDiffEditor' });

const props = defineProps<{
  original: string;
  modified: string;
  language?: string;
}>();

const themeStore = useThemeStore();
const containerRef = ref<HTMLElement | null>(null);
const editorRef = shallowRef<monaco.editor.IStandaloneDiffEditor | null>(null);

const initEditor = () => {
  if (!containerRef.value) return;
  // 容器宽度不足时 Monaco 会自动降级为 inline 模式，确保有足够宽度
  if (containerRef.value.offsetWidth < 200) return;

  editorRef.value = monaco.editor.createDiffEditor(containerRef.value, {
    theme: themeStore.darkMode ? 'vs-dark' : 'vs',
    automaticLayout: true,
    readOnly: true,
    renderSideBySide: true,
    useInlineViewWhenSpaceIsLimited: false,
    scrollBeyondLastLine: false,
    fontSize: 14,
    minimap: { enabled: false },
    originalEditable: false,
    diffAlgorithm: 'advanced'
  });

  const originalModel = monaco.editor.createModel(props.original, props.language || 'plaintext');
  const modifiedModel = monaco.editor.createModel(props.modified, props.language || 'plaintext');
  editorRef.value.setModel({ original: originalModel, modified: modifiedModel });
};

watch(
  () => props.original,
  newValue => {
    if (editorRef.value) {
      const model = editorRef.value.getModel();
      if (model) {
        model.original.setValue(newValue);
      }
    }
  }
);

watch(
  () => props.modified,
  newValue => {
    if (editorRef.value) {
      const model = editorRef.value.getModel();
      if (model) {
        model.modified.setValue(newValue);
      }
    }
  }
);

watch(
  () => props.language,
  newValue => {
    if (editorRef.value) {
      const model = editorRef.value.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model.original, newValue || 'plaintext');
        monaco.editor.setModelLanguage(model.modified, newValue || 'plaintext');
      }
    }
  }
);

watch(
  () => themeStore.darkMode,
  isDark => {
    if (editorRef.value) {
      monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }
  }
);

onMounted(async () => {
  // 等待 DOM 布局完成后再初始化，确保容器有正确的尺寸
  await nextTick();
  // 如果宽度仍不足，短暂延迟重试
  if (containerRef.value && containerRef.value.offsetWidth < 200) {
    setTimeout(initEditor, 100);
  } else {
    initEditor();
  }
});

onUnmounted(() => {
  if (editorRef.value) {
    const model = editorRef.value.getModel();
    if (model) {
      model.original.dispose();
      model.modified.dispose();
    }
    editorRef.value.dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full overflow-hidden"></div>
</template>
