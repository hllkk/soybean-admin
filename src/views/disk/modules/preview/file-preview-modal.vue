<script setup lang="ts">
import { computed, ref, defineAsyncComponent, watch } from 'vue';
import { NModal, NButton, NSpace, useDialog } from 'naive-ui';
import { getPreviewCategory, isAudioFile } from '@/utils/file-type';
import type { PreviewCategory } from '@/utils/file-type';
import { getPreviewUrl } from '@/service/api/disk/file';
import { request } from '@/service/request';

defineOptions({ name: 'FilePreviewModal' });

interface Props {
  visible: boolean;
  file: Api.Disk.PreviewFileInfo | null;
  fileList?: Api.Disk.FileItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const dialog = useDialog();

const ImageViewer = defineAsyncComponent(() => import('./image-viewer.vue'));
const PdfViewer = defineAsyncComponent(() => import('./pdf-viewer.vue'));
const CodeViewer = defineAsyncComponent(() => import('./code-viewer.vue'));
const VideoPlayer = defineAsyncComponent(() => import('./video-player.vue'));
const AudioPlayer = defineAsyncComponent(() => import('./audio-player.vue'));
const OfficeViewer = defineAsyncComponent(() => import('./office-viewer.vue'));
const MarkdownViewer = defineAsyncComponent(() => import('./markdown-viewer.vue'));

const showModal = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
});

const isFullscreen = ref(false);
const blobUrl = ref('');
const loadingBlob = ref(false);
const blobError = ref('');

// Code editor state
const codeViewerRef = ref<InstanceType<typeof CodeViewer> | null>(null);
const isEditMode = ref(false);
const isContentModified = ref(false);

const previewCategory = computed<PreviewCategory>(() => {
  if (!props.file) return 'unknown';
  return getPreviewCategory(props.file.fileName);
});

const fileSize = computed(() => {
  if (!props.file) return '';
  const size = props.file.fileSize;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
});

/** 需要通过 blob URL 加载的文件类型 */
const needsBlobUrl = computed(() => {
  return ['image', 'pdf', 'video', 'audio'].includes(previewCategory.value);
});

/** 代码/Markdown 类型直接用 fetch + auth header */
const directUrl = computed(() => {
  if (!props.file) return '';
  return getPreviewUrl(props.file.fileId);
});

/** 音频播放列表：当前目录下所有音频文件 */
const audioFiles = computed(() => {
  if (!props.fileList) return undefined;
  return props.fileList
    .filter(f => !f.isFolder && isAudioFile(f.fileName))
    .map(f => ({ fileId: f.fileId, fileName: f.fileName }));
});

function revokeBlobUrl() {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = '';
  }
}

async function fetchBlobUrl() {
  if (!props.file) return;

  revokeBlobUrl();
  loadingBlob.value = true;
  blobError.value = '';

  try {
    const url = getPreviewUrl(props.file.fileId);
    const response = await request<any, 'blob'>({
      url,
      method: 'get',
      responseType: 'blob'
    });

    if (response.data && response.data instanceof Blob) {
      blobUrl.value = URL.createObjectURL(response.data);
    } else {
      blobError.value = '文件加载失败：响应格式异常';
    }
  } catch {
    blobError.value = '文件加载失败，请检查网络连接';
  } finally {
    loadingBlob.value = false;
  }
}

/** 传给各预览组件的 URL */
const componentUrl = computed(() => {
  if (needsBlobUrl.value) return blobUrl.value;
  return directUrl.value;
});

watch(
  () => props.file,
  () => {
    if (props.file && needsBlobUrl.value) {
      fetchBlobUrl();
    }
    // 文件切换时重置编辑状态
    isEditMode.value = false;
    isContentModified.value = false;
  }
);

watch(
  () => props.visible,
  val => {
    if (!val) {
      revokeBlobUrl();
      blobError.value = '';
      isEditMode.value = false;
      isContentModified.value = false;
    }
  }
);

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value;
}

function handleContentModified(modified: boolean) {
  isContentModified.value = modified;
}

function handleSave() {
  codeViewerRef.value?.save();
}

function handleClose() {
  if (isContentModified.value) {
    dialog.warning({
      title: '未保存的修改',
      content: '文件已修改但未保存，是否保存后再关闭？',
      positiveText: '保存并关闭',
      negativeText: '放弃修改',
      onPositiveClick: () => {
        codeViewerRef.value?.save();
        emit('update:visible', false);
      },
      onNegativeClick: () => {
        isContentModified.value = false;
        emit('update:visible', false);
      }
    });
    return;
  }
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
    :mask-closable="!isContentModified"
    :style="modalStyle"
    class="file-preview-modal"
  >
    <div class="preview-card">
      <!-- Header -->
      <div class="preview-header">
        <div class="header-left">
          <span v-if="isContentModified" class="modified-dot" />
          <span class="file-name">{{ file?.fileName || '文件预览' }}</span>
          <span v-if="file" class="file-size">{{ fileSize }}</span>
        </div>
        <NSpace align="center" :size="4" class="header-right">
          <!-- Code edit toggle -->
          <template v-if="previewCategory === 'code' && file?.fileId">
            <NButton size="small" :type="isEditMode ? 'primary' : 'default'" @click="toggleEditMode">
              <template #icon>
                <SvgIcon :icon="isEditMode ? 'mdi:eye-outline' : 'mdi:pencil-outline'" :size="16" />
              </template>
              {{ isEditMode ? '查看' : '编辑' }}
            </NButton>
            <NButton v-if="isEditMode && isContentModified" size="small" type="primary" @click="handleSave">
              <template #icon>
                <SvgIcon icon="mdi:content-save" :size="16" />
              </template>
              保存
            </NButton>
          </template>
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
        <!-- Blob loading state -->
        <div v-if="needsBlobUrl && loadingBlob" class="flex items-center justify-center h-full">
          <NSpin size="large" />
        </div>
        <div v-else-if="needsBlobUrl && blobError" class="flex items-center justify-center h-full text-red-400">
          {{ blobError }}
        </div>

        <!-- Preview components -->
        <template v-else-if="file">
          <template v-if="previewCategory === 'image'">
            <ImageViewer :url="componentUrl" :file-name="file.fileName" />
          </template>
          <template v-else-if="previewCategory === 'pdf'">
            <PdfViewer :url="componentUrl" :file-name="file.fileName" />
          </template>
          <template v-else-if="previewCategory === 'code'">
            <CodeViewer
              ref="codeViewerRef"
              :url="componentUrl"
              :file-name="file.fileName"
              :file-id="file.fileId"
              :is-edit-mode="isEditMode"
              @content-modified="handleContentModified"
            />
          </template>
          <template v-else-if="previewCategory === 'markdown'">
            <MarkdownViewer :url="componentUrl" :file-name="file.fileName" />
          </template>
          <template v-else-if="previewCategory === 'video'">
            <VideoPlayer :url="componentUrl" :file-name="file.fileName" />
          </template>
          <template v-else-if="previewCategory === 'audio'">
            <AudioPlayer :url="componentUrl" :file-name="file.fileName" :audio-file-list="audioFiles" />
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
        </template>

        <div v-else class="flex items-center justify-center h-full text-gray-400">未选择文件</div>
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
  align-items: center;
  gap: 10px;
  overflow: hidden;
  min-width: 0;
}

.modified-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f0a020;
  flex-shrink: 0;
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
