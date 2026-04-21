<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { getMonacoLanguage } from '@/utils/file-type';
import { localStg } from '@/utils/storage';
import { fetchSaveFileContent } from '@/service/api/disk/file';

defineOptions({ name: 'CodeViewer' });

interface Props {
  url: string;
  fileName: string;
  fileId?: string | number;
  isEditMode?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'content-modified', isModified: boolean): void;
}>();

const containerRef = ref<HTMLDivElement>();
const loading = ref(true);
const errorMsg = ref('');
const content = ref('');
const originalContent = ref('');
const isModified = ref(false);
const isSaving = ref(false);
let editor: any = null;
let monacoInstance: any = null;

const language = computed(() => getMonacoLanguage(props.fileName));

const MAX_FILE_SIZE = 1 * 1024 * 1024;

async function initEditor() {
  if (!containerRef.value || !content.value) return;

  monacoInstance = await import('monaco-editor');

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  editor = monacoInstance.editor.create(containerRef.value, {
    value: content.value,
    language: language.value,
    theme: isDark ? 'vs-dark' : 'vs',
    readOnly: !props.isEditMode,
    minimap: { enabled: content.value.length < 100000 },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    automaticLayout: true,
    fontSize: 13,
    renderLineHighlight: 'none'
  });

  originalContent.value = content.value;

  editor.onDidChangeModelContent(() => {
    const current = editor.getValue();
    const modified = current !== originalContent.value;
    if (isModified.value !== modified) {
      isModified.value = modified;
      emit('content-modified', modified);
    }
  });

  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
    save();
  });
}

async function save() {
  if (!isModified.value || isSaving.value || !editor || !props.fileId) return;
  isSaving.value = true;
  try {
    const currentContent = editor.getValue();
    const { error } = await fetchSaveFileContent({
      fileId: props.fileId,
      content: currentContent
    });
    if (!error) {
      originalContent.value = currentContent;
      isModified.value = false;
      emit('content-modified', false);
      window.$message?.success('保存成功');
    }
  } finally {
    isSaving.value = false;
  }
}

watch(
  () => props.isEditMode,
  val => {
    if (editor) {
      editor.updateOptions({ readOnly: !val });
    }
  }
);

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
      content.value = text.slice(0, MAX_FILE_SIZE) + '\n\n... 文件过大，仅显示前 1MB ...';
    } else {
      content.value = text;
    }

    loading.value = false;
    await nextTick();
    await initEditor();
  } catch (err) {
    errorMsg.value = `加载失败: ${err instanceof Error ? err.message : '未知错误'}`;
    loading.value = false;
  }
});

onUnmounted(() => {
  editor?.dispose();
  editor = null;
  monacoInstance = null;
});

defineExpose({ save, isModified });
</script>

<template>
  <div class="code-viewer-container">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <NSpin size="large" />
    </div>
    <div v-else-if="errorMsg" class="flex items-center justify-center h-full text-red-400">
      {{ errorMsg }}
    </div>
    <div v-else class="code-editor-wrapper">
      <div ref="containerRef" class="code-editor" />
      <div v-if="isSaving" class="saving-overlay">
        <NSpin size="small" />
        <span class="ml-2 text-sm text-gray-400">保存中...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-viewer-container {
  width: 100%;
  height: 100%;
}

.code-editor-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.code-editor {
  width: 100%;
  height: 100%;
}

.saving-overlay {
  position: absolute;
  top: 8px;
  right: 16px;
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--n-color-modal, #fff);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>
