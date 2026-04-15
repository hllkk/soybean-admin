<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';
import { h } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import FileIcon from './file-icon.vue';
import { formatFileSize } from '@/utils/format';

defineOptions({
  name: 'FileList'
});

interface Props {
  files: Api.Disk.FileItem[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false
});

interface Emits {
  (e: 'fileDblClick', file: Api.Disk.FileItem): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const columns: DataTableColumns<Api.Disk.FileItem> = [
  {
    type: 'selection',
    align: 'center',
    width: 48
  },
  {
    key: 'fileName',
    title: $t('page.disk.file.name'),
    align: 'left',
    ellipsis: true,
    render: row => {
      return h('div', { class: 'flex items-center gap-8px' }, [
        h(FileIcon, {
          fileType: row.isFolder ? 'folder' : row.fileType,
          extension: row.fileExtension,
          size: 'small'
        }),
        h('span', { class: 'truncate' }, row.fileName)
      ]);
    }
  },
  {
    key: 'fileSize',
    title: $t('page.disk.file.size'),
    align: 'right',
    width: 100,
    render: row => {
      if (row.isFolder) return '-';
      return formatFileSize(row.fileSize);
    }
  },
  {
    key: 'fileType',
    title: $t('page.disk.file.type'),
    align: 'center',
    width: 80,
    render: row => {
      if (row.isFolder) return $t('page.disk.file.folder');
      return row.fileExtension?.toUpperCase() || '-';
    }
  },
  {
    key: 'modifyTime',
    title: $t('page.disk.file.modifyTime'),
    align: 'center',
    width: 160
  }
];

function handleCheckedRowKeysChange(keys: CommonType.IdType[]) {
  diskStore.setSelectedFiles(keys);
}

function handleRowDblClick(row: Api.Disk.FileItem) {
  if (row.isFolder) {
    diskStore.enterFolder(row);
  } else {
    emit('fileDblClick', row);
  }
}

function getRowProps(row: Api.Disk.FileItem) {
  return {
    style: 'cursor: pointer',
    ondblclick: () => handleRowDblClick(row)
  };
}

function getRowKey(row: Api.Disk.FileItem) {
  return row.fileId;
}
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="files"
    :loading="loading"
    :checked-row-keys="diskStore.selectedFiles"
    :row-key="getRowKey"
    :row-props="getRowProps"
    size="small"
    flex-height
    @update:checked-row-keys="handleCheckedRowKeysChange"
  />
</template>