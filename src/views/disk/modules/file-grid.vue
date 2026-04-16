<script setup lang="ts">
import { computed } from 'vue';
import { useDiskStore } from '@/store/modules/disk';
import FileCard from './file-card.vue';
import FileEmpty from './file-empty.vue';

defineOptions({
  name: 'FileGrid'
});

interface Props {
  files: Api.Disk.FileItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

interface Emits {
  (e: 'fileClick', file: Api.Disk.FileItem): void;
  (e: 'fileDblClick', file: Api.Disk.FileItem): void;
  (e: 'fileShare', file: Api.Disk.FileItem): void;
  (e: 'fileDownload', file: Api.Disk.FileItem): void;
  (e: 'fileDelete', file: Api.Disk.FileItem): void;
  (e: 'fileRename', file: Api.Disk.FileItem): void;
  (e: 'fileCopy', file: Api.Disk.FileItem): void;
  (e: 'fileMove', file: Api.Disk.FileItem): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const isSelected = computed(() => (fileId: CommonType.IdType) => {
  return diskStore.selectedFiles.includes(fileId);
});

// 是否显示空状态
const showEmpty = computed(() => props.files.length === 0 && !props.loading);

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

function handleAction(action: string, file: Api.Disk.FileItem) {
  if (action === 'share') emit('fileShare', file);
  else if (action === 'download') emit('fileDownload', file);
  else if (action === 'delete') emit('fileDelete', file);
  else if (action === 'rename') emit('fileRename', file);
  else if (action === 'copy') emit('fileCopy', file);
  else if (action === 'move') emit('fileMove', file);
}
</script>

<template>
  <NSpin :show="loading" class="h-full">
    <!-- 空状态 -->
    <FileEmpty v-if="showEmpty" />

    <!-- 文件网格 -->
    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-16px p-16px">
      <FileCard
        v-for="file in files"
        :key="file.fileId"
        :file="file"
        :selected="isSelected(file.fileId)"
        @click="handleFileClick(file)"
        @dblclick="handleFileDblClick(file)"
        @select="handleSelect(file)"
        @share="handleAction('share', file)"
        @download="handleAction('download', file)"
        @delete="handleAction('delete', file)"
        @rename="handleAction('rename', file)"
        @copy="handleAction('copy', file)"
        @move="handleAction('move', file)"
      />
    </div>
  </NSpin>
</template>
