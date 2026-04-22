<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({ name: 'MonacoEditor' });

const props = defineProps<{
  modelValue: string;
  language?: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save'): void;
}>();

const themeStore = useThemeStore();
const containerRef = ref<HTMLElement | null>(null);
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);

// 初始化编辑器
const initEditor = () => {
  if (!containerRef.value) return;

  editorRef.value = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language || 'plaintext',
    theme: themeStore.darkMode ? 'vs-dark' : 'vs',
    readOnly: props.readOnly,
    automaticLayout: true,
    minimap: {
      enabled: true
    },
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"Fira Code", "Consolas", "Courier New", monospace'
  });

  // 监听内容变化
  editorRef.value.onDidChangeModelContent(() => {
    const value = editorRef.value?.getValue() || '';
    if (value !== props.modelValue) {
      emit('update:modelValue', value);
    }
  });

  // 监听保存快捷键
  editorRef.value.addCommand(monaco.KeyMod.CtrlCmd || monaco.KeyCode.KeyS, () => {
    emit('save');
  });
};

// 监听值变化
watch(
  () => props.modelValue,
  newValue => {
    if (editorRef.value) {
      const currentValue = editorRef.value.getValue();
      if (newValue !== currentValue) {
        // 使用 pushEditOperations 或 setValue
        // 这里为了简单直接 setValue，如果是流式追加，可能需要优化光标位置
        // 但考虑到这是 preview 组件，全量更新也是可接受的，或者后续优化追加逻辑
        // 对于流式加载，通常是追加到最后

        // 保持光标位置
        const position = editorRef.value.getPosition();
        editorRef.value.setValue(newValue);
        if (position) {
          editorRef.value.setPosition(position);
        }
      }
    }
  }
);

// 监听语言变化
watch(
  () => props.language,
  newValue => {
    if (editorRef.value) {
      monaco.editor.setModelLanguage(editorRef.value.getModel()!, newValue || 'plaintext');
    }
  }
);

// 监听主题变化
watch(
  () => themeStore.darkMode,
  isDark => {
    if (editorRef.value) {
      monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }
  }
);

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  if (editorRef.value) {
    editorRef.value.dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full overflow-hidden"></div>
</template>

<style scoped>
:deep(.monaco-editor) {
  padding-top: 8px;
}
</style>
