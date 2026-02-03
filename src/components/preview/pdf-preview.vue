<script setup lang="ts">
import { ref } from 'vue';
import { PDFViewer, type PluginRegistry } from '@embedpdf/vue-pdf-viewer';

defineOptions({
  name: 'PDFPreview'
});

interface Props {
  fileUrl: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const registry = ref<PluginRegistry | null>(null);

const handleReady = (r: PluginRegistry) => {
  registry.value = r;
};
</script>

<template>
  <div class="relative h-full flex-1 overflow-hidden bg-white dark:bg-black">
    <PDFViewer
      :config="{
        src: props.fileUrl,
        i18n: { defaultLocale: 'zh-CN' },
        documentManager: { maxDocuments: 5 },
        disabledCategories: ['download', 'document-close', 'document-open']
      }"
      class="size-full"
      @ready="handleReady"
      @close="emit('close')"
    />
  </div>
</template>
