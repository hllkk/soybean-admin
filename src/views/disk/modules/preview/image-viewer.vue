<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

defineOptions({ name: 'ImageViewer' });

interface Props {
  url: string;
  fileName: string;
}

defineProps<Props>();

const containerRef = ref<HTMLDivElement>();
let viewerInstance: Viewer | null = null;

onMounted(() => {
  if (containerRef.value) {
    viewerInstance = new Viewer(containerRef.value, {
      inline: true,
      title: false,
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        oneToOne: true,
        reset: true,
        prev: false,
        play: false,
        next: false,
        rotateLeft: true,
        rotateRight: true,
        flipHorizontal: true,
        flipVertical: true
      },
      viewed() {
        // Auto-fit after image loads
      }
    });
  }
});

onUnmounted(() => {
  viewerInstance?.destroy();
  viewerInstance = null;
});
</script>

<template>
  <div class="image-viewer-container">
    <div ref="containerRef">
      <img :src="url" :alt="fileName" style="display: none" />
    </div>
  </div>
</template>

<style scoped>
.image-viewer-container {
  width: 100%;
  height: 100%;
}

.image-viewer-container :deep(.viewer-container) {
  background-color: var(--n-color-modal, #fff);
}
</style>
