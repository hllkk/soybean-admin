<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useUploader } from '@/hooks/business/upload/use-uploader';

defineOptions({
  name: 'UploadTrigger'
});

const { upload } = useUploader();

const isDragging = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let folderIdCounter = 0;

function generateFolderId(): string {
  folderIdCounter += 1;
  return `dnd_folder_${Date.now()}_${folderIdCounter}`;
}

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

/** Recursively read a FileSystemEntry, collecting files with their relative paths */
function readEntry(entry: FileSystemEntry, pathPrefix: string = ''): Promise<{ file: File; relativePath: string }[]> {
  return new Promise(resolve => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(
        file => {
          const relativePath = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;
          resolve([{ file, relativePath }]);
        },
        () => resolve([])
      );
    } else if (entry.isDirectory) {
      const subPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const allFiles: { file: File; relativePath: string }[] = [];

      const readBatch = () => {
        reader.readEntries(async entries => {
          if (entries.length === 0) {
            resolve(allFiles);
            return;
          }
          for (const e of entries) {
            const files = await readEntry(e, subPath);
            allFiles.push(...files);
          }
          readBatch();
        }, () => resolve(allFiles));
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

/** Extract files from a drop event, grouping by folder */
async function extractAndUpload(dataTransfer: DataTransfer) {
  const items = dataTransfer.items;

  // Prefer webkitGetAsEntry for folder support
  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    for (const item of Array.from(items)) {
      const entry = item.webkitGetAsEntry?.();
      if (!entry) continue;

      if (entry.isDirectory) {
        const fileEntries = await readEntry(entry);
        if (fileEntries.length > 0) {
          upload(fileEntries, undefined, {
            id: generateFolderId(),
            name: entry.name
          });
        }
      } else if (entry.isFile) {
        const fileEntries = await readEntry(entry);
        if (fileEntries.length > 0) {
          upload(fileEntries);
        }
      }
    }
    return;
  }

  // Fallback: plain FileList
  const files = Array.from(dataTransfer.files);
  if (files.length > 0) upload(files);
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (!e.dataTransfer) return;
  extractAndUpload(e.dataTransfer);
}

function handleOverlayDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (!e.dataTransfer) return;
  extractAndUpload(e.dataTransfer);
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
