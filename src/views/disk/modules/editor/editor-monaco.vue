<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { getMonacoLanguage } from '@/utils/file-type';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({ name: 'EditorMonaco' });

interface Props {
  content: string;
  fileName: string;
  fileId: CommonType.IdType;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), { readOnly: false });

const emit = defineEmits<{
  (e: 'change', content: string): void;
  (e: 'save'): void;
}>();

const containerRef = ref<HTMLDivElement>();
const loading = ref(true);
const editorRef = ref<any>(null);
const monacoRef = ref<any>(null);

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);
const language = computed(() => getMonacoLanguage(props.fileName));

async function initEditor() {
  if (!containerRef.value) return;

  monacoRef.value = await import('monaco-editor');

  editorRef.value = monacoRef.value.editor.create(containerRef.value, {
    value: props.content,
    language: language.value,
    theme: isDark.value ? 'vs-dark' : 'vs',
    readOnly: props.readOnly,
    minimap: { enabled: props.content.length < 100000 },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    renderLineHighlight: 'all',
    folding: true,
    foldingStrategy: 'auto',
    tabSize: 2
  });

  // 监听内容变化
  editorRef.value.onDidChangeModelContent(() => {
    const newContent = editorRef.value.getValue();
    emit('change', newContent);
  });

  // 注册保存快捷键
  editorRef.value.addCommand(
    monacoRef.value.KeyMod.CtrlCmd | monacoRef.value.KeyCode.KeyS,
    () => emit('save')
  );

  loading.value = false;
}

// 监听 readOnly 变化
watch(
  () => props.readOnly,
  val => {
    if (editorRef.value) {
      editorRef.value.updateOptions({ readOnly: val });
    }
  }
);

// 监听主题变化
watch(isDark, val => {
  if (monacoRef.value && editorRef.value) {
    monacoRef.value.editor.setTheme(val ? 'vs-dark' : 'vs');
  }
});

// 监听内容变化（外部更新）
watch(
  () => props.content,
  val => {
    if (editorRef.value && editorRef.value.getValue() !== val) {
      editorRef.value.setValue(val);
    }
  }
);

// 监听语言变化
watch(language, val => {
  if (editorRef.value && monacoRef.value) {
    monacoRef.value.editor.setModelLanguage(editorRef.value.getModel(), val);
  }
});

onMounted(async () => {
  await nextTick();
  await initEditor();
});

onUnmounted(() => {
  editorRef.value?.dispose();
  editorRef.value = null;
});

defineExpose({
  getContent: () => editorRef.value?.getValue() || '',
  focus: () => editorRef.value?.focus()
});
</script>

<template>
  <div class="editor-monaco-container">
    <div v-if="loading" class="loading-overlay">
      <NSpin size="large" />
    </div>
    <div ref="containerRef" class="monaco-editor" />
  </div>
</template>

<style scoped>
.editor-monaco-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--n-color-modal, #1e1e1e);
  z-index: 10;
}

.monaco-editor {
  width: 100%;
  height: 100%;
}
</style>