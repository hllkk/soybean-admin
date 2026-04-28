<script setup lang="ts">
import { api as viewerApi } from 'v-viewer';
import 'viewerjs/dist/viewer.css';
import { getServiceBaseURL } from '@/utils/service';

defineOptions({
  name: 'ImagePreview'
});

interface ImageItem {
  fileId: CommonType.IdType;
  fileName: string;
}

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

function buildImageUrl(fileId: CommonType.IdType): string {
  return `${baseURL}/preview/file/${fileId}`;
}

function show(images: ImageItem[], initialIndex = 0) {
  if (images.length === 0) return;

  const urls = images.map(img => buildImageUrl(img.fileId));

  viewerApi({
    images: urls,
    options: {
      initialViewIndex: initialIndex,
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        oneToOne: true,
        reset: true,
        prev: true,
        play: true,
        next: true,
        rotateLeft: true,
        rotateRight: true,
        flipHorizontal: true,
        flipVertical: true
      },
      title: (_image: HTMLImageElement, imageData: Record<string, unknown>) => {
        const index = (imageData as { index: number }).index ?? 0;
        const img = images[index];
        return img ? `${img.fileName} (${index + 1} / ${images.length})` : '';
      },
      keyboard: true,
      backdrop: true,
      loading: true,
      className: 'image-preview-viewer'
    }
  });
}

defineExpose({ show });
</script>

<template>
  <div />
</template>

<style>
.image-preview-viewer {
  z-index: 2000;
}

.image-preview-viewer .viewer-backdrop {
  background-color: rgba(0, 0, 0, 0.85);
}

.image-preview-viewer .viewer-title {
  font-size: 14px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 12px;
  border-radius: 4px;
}
</style>
