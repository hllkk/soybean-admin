<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useUploader } from '@/hooks/business/upload/use-uploader';

defineOptions({
  name: 'UploadTrigger'
});

const { upload } = useUploader();

const isDragging = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function showOverlay() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  isDragging.value = true;
}

function hideOverlay() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    isDragging.value = false;
    hideTimer = null;
  }, 100);
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  if (!e.dataTransfer?.types.includes('Files')) return;
  showOverlay();
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  if (!e.dataTransfer?.types.includes('Files')) return;
  showOverlay();
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  hideOverlay();
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (!e.dataTransfer?.files.length) return;
  upload(Array.from(e.dataTransfer.files));
}

function handleOverlayDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (!e.dataTransfer?.files.length) return;
  upload(Array.from(e.dataTransfer.files));
}

onMounted(() => {
  document.addEventListener('dragenter', handleDragEnter);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('drop', handleDrop);
});

onUnmounted(() => {
  document.removeEventListener('dragenter', handleDragEnter);
  document.removeEventListener('dragover', handleDragOver);
  document.removeEventListener('dragleave', handleDragLeave);
  document.removeEventListener('drop', handleDrop);
  if (hideTimer) clearTimeout(hideTimer);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="upload-overlay">
      <div
        v-if="isDragging"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-[var(--primary-color)]/8 backdrop-blur-4px"
        @dragover.prevent.stop="showOverlay"
        @dragleave.prevent.stop="hideOverlay"
        @drop.prevent.stop="handleOverlayDrop"
      >
        <div class="flex flex-col items-center gap-12px">
          <SvgIcon icon="material-symbols:cloud-upload-outline" class="text-64px text-[var(--primary-color)]" />
          <span class="text-18px font-500 text-[var(--primary-color)]">释放文件以上传到网盘</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.upload-overlay-enter-active {
  transition: all 0.2s ease-out;
}
.upload-overlay-leave-active {
  transition: all 0.15s ease-in;
}
.upload-overlay-enter-from,
.upload-overlay-leave-to {
  opacity: 0;
}
</style>
