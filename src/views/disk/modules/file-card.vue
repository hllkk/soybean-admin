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
    class="group relative flex flex-col items-center px-8px py-16px rd-8px cursor-pointer transition-all duration-200 hover:bg-primary/10 dark:hover:bg-primary/20"
    :class="{ 'bg-primary/15 dark:bg-primary/25': selected }"
    @click="handleClick"
    @dblclick="handleDblClick"
  >
    <div
      class="absolute top-8px left-8px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      :class="{ 'opacity-100': selected }"
      @click="handleSelect"
    >
      <NCheckbox :checked="selected" />
    </div>
    <div class="mb-8px">
      <FileIcon
        :file-type="file.isFolder ? 'folder' : file.fileType"
        :extension="file.fileExtension"
        size="large"
      />
    </div>
    <div class="w-full text-center text-13px px-4px">
      <NEllipsis :line-clamp="2">
        {{ file.fileName }}
      </NEllipsis>
    </div>
    <div class="text-11px mt-4px" style="color: var(--n-text-color-disabled)">
      {{ fileTypeLabel }}
    </div>
  </div>
</template>

