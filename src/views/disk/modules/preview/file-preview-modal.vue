<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { NModal, NButton, NSpace, NTooltip } from 'naive-ui';
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

function handleDownload() {
  if (!props.file) return;
  const link = document.createElement('a');
  link.href = previewUrl.value;
  link.download = props.file.fileName;
  link.click();
}
</script>

<template>
  <NModal
    v-model:show="showModal"
    preset="card"
    :bordered="false"
    :style="{ width: '80vw', maxWidth: '1200px', height: '80vh' }"
    :mask-closable="true"
    :title="file?.fileName || '文件预览'"
  >
    <template #header-extra>
      <NSpace align="center" :size="12">
        <span v-if="file" class="text-12px text-gray-400">{{ fileSize }}</span>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" @click="handleDownload">
              <template #icon>
                <SvgIcon icon="mdi:download-outline" :size="18" />
              </template>
            </NButton>
          </template>
          下载文件
        </NTooltip>
      </NSpace>
    </template>

    <div class="h-full overflow-hidden">
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
          <span class="text-48px text-gray-300">📄</span>
          <span class="text-gray-400">不支持预览此类型文件</span>
          <NButton @click="handleDownload">下载文件</NButton>
        </div>
      </template>
    </div>
  </NModal>
</template>

<style scoped>
.h-full {
  height: calc(80vh - 60px);
}
</style>
