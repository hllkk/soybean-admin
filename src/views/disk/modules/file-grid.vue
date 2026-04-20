<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { resolveNameConflict } from '../utils/resolve-name-conflict';
import FileCard from './file-card.vue';
import FileEmpty from './file-empty.vue';
import DiskContextMenu from './context-menu.vue';
import FileIcon from './file-icon.vue';

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
  (e: 'refresh'): void;
  (e: 'fileCreated', name: string): void;
  (e: 'folderCreated', name: string): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const gridScrollRef = ref<HTMLDivElement>();
const scrollStyle = ref<Record<string, string>>({});

const isSelected = computed(() => (fileId: CommonType.IdType) => {
  return diskStore.selectedFiles.includes(fileId);
});

const showEmpty = computed(() => props.files.length === 0 && !props.loading);

function updateScrollHeight() {
  const el = gridScrollRef.value;
  if (!el) return;

  if (window.innerWidth < 640) {
    scrollStyle.value = {};
    return;
  }

  const top = el.getBoundingClientRect().top;
  const maxH = window.innerHeight - top - 24;
  scrollStyle.value = { maxHeight: `${maxH}px` };
}

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

  const target = (e.target as HTMLElement).closest('[data-file-id]');
  if (target) {
    const fileId = (target as HTMLElement).dataset.fileId!;
    const file = props.files.find(f => String(f.fileId) === fileId);
    if (file) {
      if (!diskStore.selectedFiles.includes(file.fileId)) {
        diskStore.setSelectedFiles([file.fileId]);
      }
      ctxState.value = { visible: true, x: e.clientX, y: e.clientY, type: 'file', targetFile: file };
      return;
    }
  }
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

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    updateScrollHeight();
  });
  resizeObserver.observe(document.documentElement);
  window.addEventListener('resize', updateScrollHeight);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', updateScrollHeight);
});

watch(
  () => props.files,
  () => nextTick(updateScrollHeight),
  { immediate: true }
);
</script>

<template>
  <NSpin :show="loading">
    <!-- 空状态 -->
    <FileEmpty v-if="showEmpty" />

    <!-- 文件网格 - 滚动容器 -->
    <div
      v-else
      ref="gridScrollRef"
      class="file-grid-scroll overflow-y-auto pr-4px lt-sm:overflow-visible lt-sm:pr-0px"
      :style="scrollStyle"
      @contextmenu.prevent="handleContextMenu"
    >
      <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-16px px-16px pt-16px pb-48px">
        <!-- 内联创建占位卡片 -->
        <div
          v-if="diskStore.creatingType"
          class="flex flex-col items-center px-8px py-16px rd-8px bg-primary/5 dark:bg-primary/10"
        >
          <div class="mb-8px mt-16px">
            <FileIcon
              :file-type="diskStore.creatingType === 'folder' ? 'folder' : 'other'"
              size="large"
            />
          </div>
          <div class="w-full px-4px">
            <NInput
              ref="createInputRef"
              v-model:value="createName"
              size="small"
              @keydown="handleCreateKeydown"
              @blur="handleCreateCancel"
            />
          </div>
        </div>

        <FileCard
          v-for="file in files"
          :key="file.fileId"
          :file="file"
          :selected="isSelected(file.fileId)"
          :data-file-id="String(file.fileId)"
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
    </div>
  </NSpin>

  <DiskContextMenu
    v-model:visible="ctxState.visible"
    :x="ctxState.x"
    :y="ctxState.y"
    :type="ctxState.type"
    @select="handleContextSelect"
  />
</template>

<style scoped lang="scss">
.file-grid-scroll {
  @include scrollbar();
}
</style>
