<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { NModal, NButton, NSpace } from 'naive-ui';
import { getPreviewCategory } from '@/utils/file-type';
import type { PreviewCategory } from '@/utils/file-type';
import { getPreviewUrl } from '@/service/api/disk/file';

defineOptions({ name: 'FilePreviewModal' });

interface Props {
  visible: boolean;
  file: Api.Disk.PreviewFileInfo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const ImageViewer = defineAsyncComponent(() => import('./image-viewer.vue'));
const PdfViewer = defineAsyncComponent(() => import('./pdf-viewer.vue'));
const CodeViewer = defineAsyncComponent(() => import('./code-viewer.vue'));
const VideoPlayer = defineAsyncComponent(() => import('./video-player.vue'));
const AudioPlayer = defineAsyncComponent(() => import('./audio-player.vue'));
const OfficeViewer = defineAsyncComponent(() => import('./office-viewer.vue'));

const showModal = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
});

const isFullscreen = ref(false);

const previewCategory = computed<PreviewCategory>(() => {
  if (!props.file) return 'unknown';
  return getPreviewCategory(props.file.fileName);
});

const previewUrl = computed(() => {
  if (!props.file) return '';
  return getPreviewUrl(props.file.fileId);
});

const fileSize = computed(() => {
  if (!props.file) return '';
  const size = props.file.fileSize;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
});

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function handleClose() {
  emit('update:visible', false);
}

const modalStyle = computed(() => {
  if (isFullscreen.value) {
    return { width: '100vw', height: '100vh', maxWidth: 'none' };
  }
  return { width: '80vw', maxWidth: '1200px', height: '80vh' };
});
</script>

<template>
  <NModal
    v-model:show="showModal"
    :closable="false"
    :mask-closable="true"
    :style="modalStyle"
    class="file-preview-modal"
  >
    <div class="preview-card">
      <!-- Header -->
      <div class="preview-header">
        <div class="header-left">
          <span class="file-name">{{ file?.fileName || '文件预览' }}</span>
          <span v-if="file" class="file-size">{{ fileSize }}</span>
        </div>
        <NSpace align="center" :size="4" class="header-right">
          <NButton quaternary size="small" @click="toggleFullscreen">
            <template #icon>
              <SvgIcon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" :size="20" />
            </template>
          </NButton>
          <NButton quaternary size="small" @click="handleClose">
            <template #icon>
              <SvgIcon icon="mdi:close" :size="20" />
            </template>
          </NButton>
        </NSpace>
      </div>

      <!-- Body -->
      <div class="preview-body">
        <template v-if="!file">
          <div class="flex items-center justify-center h-full text-gray-400">未选择文件</div>
        </template>
        <template v-else-if="previewCategory === 'image'">
          <ImageViewer :url="previewUrl" :file-name="file.fileName" />
        </template>
        <template v-else-if="previewCategory === 'pdf'">
          <PdfViewer :url="previewUrl" :file-name="file.fileName" />
        </template>
        <template v-else-if="previewCategory === 'code'">
          <CodeViewer :url="previewUrl" :file-name="file.fileName" />
        </template>
        <template v-else-if="previewCategory === 'video'">
          <VideoPlayer :url="previewUrl" :file-name="file.fileName" />
        </template>
        <template v-else-if="previewCategory === 'audio'">
          <AudioPlayer :url="previewUrl" :file-name="file.fileName" />
        </template>
        <template v-else-if="previewCategory === 'office'">
          <OfficeViewer :file="file" />
        </template>
        <template v-else>
          <div class="flex flex-col items-center justify-center h-full gap-4">
            <SvgIcon icon="mdi:file-question-outline" :size="48" class="text-gray-300" />
            <span class="text-gray-400">不支持预览此类型文件</span>
          </div>
        </template>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.file-preview-modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--n-color-modal, #fff);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.12);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--n-color-modal, #fff);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.dark .preview-header {
  background-color: var(--n-color-modal);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  overflow: hidden;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--n-text-color);
}

.file-size {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  flex-shrink: 0;
}

.header-right {
  flex-shrink: 0;
}

.preview-body {
  flex: 1;
  overflow: hidden;
}
</style>
