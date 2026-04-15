<script setup lang="ts">
import { useDiskStore } from '@/store/modules/disk';
import { $t } from '@/locales';
import FileIcon from './file-icon.vue';

defineOptions({
  name: 'FileTypeMenu'
});

const diskStore = useDiskStore();

const fileTypes: Api.Disk.FileType[] = ['all', 'image', 'document', 'video', 'audio', 'other'];

const fileTypeIcons: Record<Api.Disk.FileType, { type: string; ext?: string }> = {
  all: { type: 'folder' },
  image: { type: 'image', ext: 'jpg' },
  document: { type: 'document', ext: 'pdf' },
  video: { type: 'video', ext: 'mp4' },
  audio: { type: 'audio', ext: 'mp3' },
  other: { type: 'other', ext: 'zip' }
};

function handleSelect(type: Api.Disk.FileType) {
  diskStore.setFileType(type);
}
</script>

<template>
  <div class="file-type-menu">
    <div class="menu-title">
      {{ $t('page.disk.fileType.all') }}
    </div>
    <div class="menu-list">
      <div
        v-for="type in fileTypes"
        :key="type"
        class="menu-item"
        :class="{ active: diskStore.currentFileType === type }"
        @click="handleSelect(type)"
      >
        <div class="menu-item-icon">
          <FileIcon
            :file-type="fileTypeIcons[type].type"
            :extension="fileTypeIcons[type].ext"
            size="small"
          />
        </div>
        <div class="menu-item-text">
          {{ $t(`page.disk.fileType.${type}`) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-type-menu {
  .menu-title {
    font-size: 12px;
    color: var(--n-text-color-disabled);
    margin-bottom: 12px;
  }

  .menu-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--n-text-color-2);

    &:hover {
      background: var(--n-color-hover);
    }

    &.active {
      background: var(--n-color-pressed);
      color: var(--n-text-color);
    }

    .menu-item-icon {
      display: flex;
      align-items: center;
    }

    .menu-item-text {
      font-size: 14px;
    }
  }
}
</style>