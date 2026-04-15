<script setup lang="ts">
import { computed } from 'vue';
import FileIcon from './file-icon.vue';
import { $t } from '@/locales';

defineOptions({
  name: 'FileCard'
});

interface Props {
  file: Api.Disk.FileItem;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
});

interface Emits {
  (e: 'click', file: Api.Disk.FileItem): void;
  (e: 'dblclick', file: Api.Disk.FileItem): void;
  (e: 'select', file: Api.Disk.FileItem): void;
}

const emit = defineEmits<Emits>();

const fileTypeLabel = computed(() => {
  if (props.file.isFolder) {
    return $t('page.disk.file.folder');
  }
  return props.file.fileExtension?.toUpperCase() || '';
});

function handleClick() {
  emit('click', props.file);
}

function handleDblClick() {
  emit('dblclick', props.file);
}

function handleSelect(e: MouseEvent) {
  e.stopPropagation();
  emit('select', props.file);
}
</script>

<template>
  <div
    class="file-card"
    :class="{ selected: selected }"
    @click="handleClick"
    @dblclick="handleDblClick"
  >
    <div class="file-card-check" @click="handleSelect">
      <NCheckbox :checked="selected" />
    </div>
    <div class="file-card-icon">
      <FileIcon
        :file-type="file.isFolder ? 'folder' : file.fileType"
        :extension="file.fileExtension"
        size="large"
      />
    </div>
    <div class="file-card-name">
      <NEllipsis :line-clamp="2">
        {{ file.fileName }}
      </NEllipsis>
    </div>
    <div class="file-card-type">
      {{ fileTypeLabel }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: var(--n-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--n-color-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    background: var(--n-color-pressed);
    border: 2px solid var(--n-border-color-focus);
  }

  .file-card-check {
    position: absolute;
    top: 8px;
    left: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .file-card-check,
  &.selected .file-card-check {
    opacity: 1;
  }

  .file-card-icon {
    margin-bottom: 8px;
  }

  .file-card-name {
    width: 100%;
    text-align: center;
    font-size: 13px;
    color: var(--n-text-color);
    padding: 0 4px;
  }

  .file-card-type {
    font-size: 11px;
    color: var(--n-text-color-disabled);
    margin-top: 4px;
  }
}
</style>