<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import FileCard from './file-card.vue';

defineOptions({
  name: 'FileGrid'
});

interface Props {
  files: Api.Disk.FileItem[];
  loading?: boolean;
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false
});

interface Emits {
  (e: 'fileClick', file: Api.Disk.FileItem): void;
  (e: 'fileDblClick', file: Api.Disk.FileItem): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const isSelected = computed(() => (fileId: CommonType.IdType) => {
  return diskStore.selectedFiles.includes(fileId);
});

function handleFileClick(file: Api.Disk.FileItem) {
  emit('fileClick', file);
}

function handleFileDblClick(file: Api.Disk.FileItem) {
  if (file.isFolder) {
    diskStore.enterFolder(file);
  } else {
    emit('fileDblClick', file);
  }
}

function handleSelect(file: Api.Disk.FileItem) {
  const index = diskStore.selectedFiles.indexOf(file.fileId);
  if (index === -1) {
    diskStore.setSelectedFiles([...diskStore.selectedFiles, file.fileId]);
  } else {
    const newSelected = diskStore.selectedFiles.filter(id => id !== file.fileId);
    diskStore.setSelectedFiles(newSelected);
  }
}
</script>

<template>
  <NSpin :show="loading">
    <div v-if="files.length === 0 && !loading" class="file-grid-empty">
      <NEmpty :description="$t('page.disk.file.noFiles')" />
    </div>
    <div v-else class="file-grid">
      <FileCard
        v-for="file in files"
        :key="file.fileId"
        :file="file"
        :selected="isSelected(file.fileId)"
        @click="handleFileClick(file)"
        @dblclick="handleFileDblClick(file)"
        @select="handleSelect(file)"
      />
    </div>
  </NSpin>
</template>

<style scoped lang="scss">
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
}

.file-grid-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>