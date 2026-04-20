<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';
import { h, computed, ref, watch, nextTick } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import FileIcon from './file-icon.vue';
import FileEmpty from './file-empty.vue';
import DiskContextMenu from './context-menu.vue';
import { formatFileSize } from '@/utils/format';
import { resolveNameConflict } from '../utils/resolve-name-conflict';

defineOptions({
  name: 'FileList'
});

interface Props {
  files: Api.Disk.FileItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

interface Emits {
  (e: 'fileDblClick', file: Api.Disk.FileItem): void;
  (e: 'fileShare', file: Api.Disk.FileItem): void;
  (e: 'fileDownload', file: Api.Disk.FileItem): void;
  (e: 'fileDelete', file: Api.Disk.FileItem): void;
  (e: 'fileRename', file: Api.Disk.FileItem): void;
  (e: 'fileCopy', file: Api.Disk.FileItem): void;
  (e: 'fileMove', file: Api.Disk.FileItem): void;
  (e: 'fileCreated', name: string): void;
  (e: 'folderCreated', name: string): void;
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('sm');

// 是否显示空状态
const showEmpty = computed(() => props.files.length === 0 && !props.loading);

const columns = computed<DataTableColumns<Api.Disk.FileItem>>(() => {
  const cols: DataTableColumns<Api.Disk.FileItem> = [
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
    }
  ];

  if (!isMobile.value) {
    cols.push(
      {
        key: 'fileSize',
        title: $t('page.disk.file.size'),
        align: 'right',
        width: 150,
        render: row => {
          if (row.isFolder) return '-';
          return formatFileSize(row.fileSize);
        }
      },
      {
        key: 'fileType',
        title: $t('page.disk.file.type'),
        align: 'center',
        width: 150,
        render: row => {
          if (row.isFolder) return $t('page.disk.file.folder');
          return row.fileExtension?.toUpperCase() || '-';
        }
      },
      {
        key: 'modifyTime',
        title: $t('page.disk.file.modifyTime'),
        align: 'center',
        width: 200
      }
    );
  }

  return cols;
});

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

// --- 右键菜单 ---
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'file' | 'area';
  targetFile: Api.Disk.FileItem | null;
}

const ctxState = ref<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  type: 'file',
  targetFile: null
});

function handleContextMenu(e: MouseEvent) {
  if (props.loading) return;
  ctxState.value = { visible: true, x: e.clientX, y: e.clientY, type: 'area', targetFile: null };
}

function applySort(field: 'name' | 'size' | 'modifyTime') {
  const { field: currentField, order } = diskStore.sortSettings;
  diskStore.setSort(field, currentField === field ? (order === 'asc' ? 'desc' : 'asc') : 'asc');
}

function handleContextSelect(key: string) {
  const file = ctxState.value.targetFile;
  switch (key) {
    case 'open':
      if (file) {
        if (file.isFolder) {
          diskStore.enterFolder(file);
        } else {
          emit('fileDblClick', file);
        }
      }
      break;
    case 'download': if (file) emit('fileDownload', file); break;
    case 'share': if (file) emit('fileShare', file); break;
    case 'copy': if (file) emit('fileCopy', file); break;
    case 'move': if (file) emit('fileMove', file); break;
    case 'rename': if (file) emit('fileRename', file); break;
    case 'delete': if (file) emit('fileDelete', file); break;
    case 'view-grid': diskStore.setViewMode('grid'); break;
    case 'view-list': diskStore.setViewMode('list'); break;
    case 'sort-name': applySort('name'); break;
    case 'sort-size': applySort('size'); break;
    case 'sort-modifyTime': applySort('modifyTime'); break;
    case 'refresh': emit('refresh'); break;
    case 'reload': window.location.reload(); break;
  }
}

function getRowProps(row: Api.Disk.FileItem) {
  return {
    style: 'cursor: pointer',
    ondblclick: () => handleRowDblClick(row),
    oncontextmenu: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!diskStore.selectedFiles.includes(row.fileId)) {
        diskStore.setSelectedFiles([row.fileId]);
      }
      ctxState.value = { visible: true, x: e.clientX, y: e.clientY, type: 'file', targetFile: row };
    }
  };
}

function getRowKey(row: Api.Disk.FileItem) {
  return row.fileId;
}

// --- 内联创建 ---
const createName = ref('');
const isConfirming = ref(false);
const createInputRef = ref<InstanceType<typeof NInput>>();

watch(() => diskStore.creatingType, type => {
  if (!type) {
    isConfirming.value = false;
    return;
  }
  isConfirming.value = false;
  if (type === 'file') {
    createName.value = $t('page.disk.createInline.defaultFileName');
  } else if (type === 'folder') {
    createName.value = $t('page.disk.createInline.defaultFolderName');
  }
  nextTick(() => {
    createInputRef.value?.focus();
  });
});

function handleCreateConfirm() {
  if (isConfirming.value) return;
  const name = createName.value.trim();
  if (!name) {
    window.$message?.warning($t('page.disk.createInline.emptyName'));
    return;
  }

  const existingNames = props.files.map(f => f.fileName);
  if (existingNames.includes(name)) {
    isConfirming.value = true;
    window.$dialog?.warning({
      title: $t('page.disk.createInline.confirmCreate'),
      content: $t('page.disk.createInline.nameExists', { name }),
      positiveText: $t('page.disk.createInline.confirmCreate'),
      negativeText: $t('page.disk.createInline.cancelCreate'),
      onPositiveClick: () => {
        const resolvedName = resolveNameConflict(name, existingNames);
        emitCreate(resolvedName);
      },
      onNegativeClick: () => {
        isConfirming.value = false;
        diskStore.cancelCreating();
        createName.value = '';
      },
      onClose: () => {
        isConfirming.value = false;
        diskStore.cancelCreating();
        createName.value = '';
      }
    });
    return;
  }

  isConfirming.value = true;
  emitCreate(name);
}

function emitCreate(name: string) {
  if (diskStore.creatingType === 'file') {
    emit('fileCreated', name);
  } else if (diskStore.creatingType === 'folder') {
    emit('folderCreated', name);
  }
}

function handleCreateCancel() {
  if (isConfirming.value) return;
  diskStore.cancelCreating();
  createName.value = '';
}

function handleCreateKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleCreateConfirm();
  } else if (e.key === 'Escape') {
    handleCreateCancel();
  }
}
</script>

<template>
  <div class="h-full flex flex-col" @contextmenu.prevent="handleContextMenu">
    <!-- 空状态 -->
    <FileEmpty v-if="showEmpty" />

    <!-- 内联创建占位行 -->
    <div
      v-if="diskStore.creatingType && !showEmpty"
      class="flex items-center gap-8px px-12px py-8px bg-primary/5 dark:bg-primary/10"
    >
      <div class="flex items-center gap-8px flex-1">
        <FileIcon
          :file-type="diskStore.creatingType === 'folder' ? 'folder' : 'other'"
          size="small"
        />
        <NInput
          ref="createInputRef"
          v-model:value="createName"
          size="small"
          class="max-w-300px"
          @keydown="handleCreateKeydown"
          @blur="handleCreateCancel"
        />
      </div>
    </div>

    <!-- 文件列表 -->
    <NDataTable
      v-if="!showEmpty"
      :columns="columns"
      :data="files"
      :loading="loading"
      :checked-row-keys="diskStore.selectedFiles"
      :row-key="getRowKey"
      :row-props="getRowProps"
      size="small"
      :flex-height="!isMobile"
      class="flex-1"
      @update:checked-row-keys="handleCheckedRowKeysChange"
    />

    <DiskContextMenu
      v-model:visible="ctxState.visible"
      :x="ctxState.x"
      :y="ctxState.y"
      :type="ctxState.type"
      @select="handleContextSelect"
    />
  </div>
</template>

<style scoped lang="scss">
</style>
