<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getPreviewCategory } from '@/utils/file-type';
import OfficePreview from './office-preview.vue';
import PdfPreview from './pdf-preview.vue';

defineOptions({
  name: 'FilePreviewOverlay'
});

interface Props {
  visible: boolean;
  file?: Api.Disk.PreviewFileInfo | null;
  // fileList?: Api.Disk.FileItem[];
}

const props = withDefaults(defineProps<Props>(), {
  file: null,
  fileList: () => []
});

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const emit = defineEmits<Emits>();

const showOverlay = computed(() => props.visible && props.file);

const previewCategory = computed(() => {
  if (!props.file?.fileName) return 'unknown';
  return getPreviewCategory(props.file.fileName);
});

// 文档保存状态（OnlyOffice）
const docSaved = ref(true);
const showSaveDialog = ref(false);
const loading = ref(true);

function handlePdfReady() {
  loading.value = false;
}

function handleOfficeEdit(saved: boolean) {
  docSaved.value = saved;
}

function handleOfficeReady() {
  loading.value = false;
}

function handleOfficeError(message: string) {
  loading.value = false;
  window.$message?.error(message);
}

function beforeClose() {
  if (!docSaved.value && previewCategory.value === 'office') {
    showSaveDialog.value = true;
    return;
  }
  close();
}

function discardAndClose() {
  showSaveDialog.value = false;
  close();
}

function close() {
  loading.value = true;
  docSaved.value = true;
  emit('update:visible', false);
  emit('close');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.visible) {
    beforeClose();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <!-- Save confirmation dialog -->
    <NDialog
      v-if="showSaveDialog"
      v-model:show="showSaveDialog"
      preset="dialog"
      title="确认关闭"
      content="文档有未保存的修改，是否放弃修改并关闭？"
      positive-text="放弃修改"
      negative-text="取消"
      type="warning"
      z-index="2000"
      @positive-click="discardAndClose"
      @negative-click="showSaveDialog = false"
    />

    <!-- Full-screen overlay -->
    <div
      v-if="showOverlay"
      class="fixed inset-0 z-1002 bg-black/70"
    >
      <!-- Loading -->
      <div
        v-if="loading && (previewCategory === 'office' || previewCategory === 'pdf')"
        class="absolute inset-0 flex-center z-10"
      >
        <NSpin size="large">
          <template #description>
            <span class="text-gray-300">正在加载文档...</span>
          </template>
        </NSpin>
      </div>

      <!-- Close button (hidden for PDF - viewer has its own close) -->
      <div
        v-if="previewCategory !== 'pdf'"
        class="absolute top-0 right-0 z-2003 flex-center p-8px"
      >
        <NButton
          quaternary
          circle
          size="small"
          class="text-white/80 hover:text-white hover:bg-white/20"
          @click="beforeClose"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </template>
        </NButton>
      </div>

      <!-- Editor area - full screen -->
      <div class="w-full h-full">
        <OfficePreview
          v-if="previewCategory === 'office'"
          :file-id="file?.fileId"
          @ready="handleOfficeReady"
          @edit="handleOfficeEdit"
          @close="beforeClose"
          @error="handleOfficeError"
        />
        <PdfPreview
          v-else-if="previewCategory === 'pdf'"
          :file-id="file?.fileId"
          @ready="handlePdfReady"
          @close="beforeClose"
        />
        <div v-else class="flex-center h-full">
          <NSpin size="large">
            <template #description>
              <span class="text-gray-300">加载中...</span>
            </template>
          </NSpin>
        </div>
      </div>
    </div>
  </Teleport>
</template>
