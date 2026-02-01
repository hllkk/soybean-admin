<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({ name: 'VditorEditor' });

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save'): void;
}>();

const themeStore = useThemeStore();
const vditorRef = ref<HTMLElement | null>(null);
const vditorInstance = ref<Vditor | null>(null);

const stopWatchTheme = watch(
  () => themeStore.darkMode,
  val => {
    const theme = val ? 'dark' : 'classic';
    vditorInstance.value?.setTheme(theme, val ? 'dark' : 'light');
  }
);

onMounted(() => {
  if (!vditorRef.value) return;

  vditorInstance.value = new Vditor(vditorRef.value, {
    value: props.modelValue,
    mode: 'ir', // Instant Rendering mode
    theme: themeStore.darkMode ? 'dark' : 'classic',
    height: '100%',
    cache: {
      enable: false
    },
    input: value => {
      emit('update:modelValue', value);
    },
    preview: {
      theme: {
        current: themeStore.darkMode ? 'dark' : 'light'
      }
    },
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      'link',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      '|',
      'upload',
      'record',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'edit-mode',
      'content-theme',
      'code-theme',
      'export',
      {
        name: 'more',
        toolbar: ['fullscreen', 'both', 'preview', 'info', 'help']
      }
    ]
  });
});

watch(
  () => props.modelValue,
  val => {
    if (vditorInstance.value && val !== vditorInstance.value.getValue()) {
      vditorInstance.value.setValue(val);
    }
  }
);

watch(
  () => props.disabled,
  val => {
    if (val) {
      vditorInstance.value?.disabled();
    } else {
      vditorInstance.value?.enable();
    }
  }
);

onUnmounted(() => {
  vditorInstance.value?.destroy();
  vditorInstance.value = null;
  stopWatchTheme();
});
</script>

<template>
  <div ref="vditorRef" class="h-full w-full"></div>
</template>

<style scoped>
:deep(.vditor) {
  border: none;
}
</style>
