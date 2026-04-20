<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchGetFolderList, fetchCopyFile, fetchMoveFile } from '@/service/api/disk';

defineOptions({
  name: 'MoveCopyDialog'
});

interface Emits {
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const loading = ref(false);
const submitting = ref(false);
const folders = ref<Api.Disk.FolderItem[]>([]);
const currentBrowsePath = ref('/');
const breadcrumb = ref<{ name: string; path: string }[]>([{ name: '全部文件', path: '/' }]);
const selectedPath = ref<string | null>(null);

const mode = computed(() => diskStore.moveCopyMode);
const title = computed(() => (mode.value === 'copy' ? $t('page.disk.moveCopy.copyTitle') : $t('page.disk.moveCopy.moveTitle')));
const sourceFiles = computed(() => diskStore.moveCopyFiles);
const sourceFileNames = computed(() => sourceFiles.value.map(f => f.fileName).join(', '));

watch(() => diskStore.moveCopyDialogVisible, visible => {
  if (visible) {
    currentBrowsePath.value = '/';
    breadcrumb.value = [{ name: '全部文件', path: '/' }];
    selectedPath.value = null;
    loadFolders('/');
  }
});

async function loadFolders(path: string) {
  loading.value = true;
  currentBrowsePath.value = path;
  const { data, error } = await fetchGetFolderList(path);
  if (!error && data) {
    folders.value = data.list || [];
  } else {
    folders.value = [];
  }
  loading.value = false;
}

function handleEnterFolder(folder: Api.Disk.FolderItem) {
  breadcrumb.value.push({ name: folder.name, path: folder.path });
  selectedPath.value = null;
  loadFolders(folder.path);
}

function handleBreadcrumbClick(index: number) {
  const target = breadcrumb.value[index];
  breadcrumb.value = breadcrumb.value.slice(0, index + 1);
  selectedPath.value = null;
  loadFolders(target.path);
}

function handleSelectFolder(folder: Api.Disk.FolderItem) {
  selectedPath.value = selectedPath.value === folder.path ? null : folder.path;
}

function handleSelectCurrentDir() {
  selectedPath.value = selectedPath.value === currentBrowsePath.value ? null : currentBrowsePath.value;
}

const selectedDisplayPath = computed(() => {
  if (!selectedPath.value) return '';
  return selectedPath.value === '/' ? '/' : selectedPath.value;
});

async function handleConfirm() {
  const targetPath = selectedPath.value || currentBrowsePath.value;
  if (!targetPath) return;

  const fileIds = sourceFiles.value.map(f => f.fileId);
  if (fileIds.length === 0) return;

  submitting.value = true;

  const params = { fileIds, targetPath };
  const { error } = mode.value === 'copy' ? await fetchCopyFile(params) : await fetchMoveFile(params);

  submitting.value = false;

  if (!error) {
    window.$message?.success(
      mode.value === 'copy' ? $t('page.disk.moveCopy.copySuccess') : $t('page.disk.moveCopy.moveSuccess')
    );
    diskStore.closeMoveCopyDialog();
    diskStore.clearSelection();
    emit('success');
  }
}

function handleCancel() {
  diskStore.closeMoveCopyDialog();
}
</script>

<template>
  <NModal
    v-model:show="diskStore.moveCopyDialogVisible"
    preset="card"
    :title="title"
    style="width: 90%; max-width: 560px"
    :mask-closable="false"
    :bordered="false"
  >
    <div class="flex flex-col gap-12px">
      <!-- 源文件信息 -->
      <div class="text-14px">
        <span class="opacity-60">{{ $t('page.disk.moveCopy.sourceLabel') }}: </span>
        <span class="font-medium">{{ sourceFileNames }}</span>
      </div>

      <!-- 面包屑导航 -->
      <NBreadcrumb separator="/">
        <NBreadcrumbItem
          v-for="(item, index) in breadcrumb"
          :key="item.path"
          @click="handleBreadcrumbClick(index)"
        >
          <span :class="{ 'cursor-pointer hover:text-primary': index < breadcrumb.length - 1 }">
            {{ item.name }}
          </span>
        </NBreadcrumbItem>
      </NBreadcrumb>

      <!-- 当前目录选择 -->
      <div
        class="flex items-center gap-8px p-8px rounded cursor-pointer transition-colors"
        :class="selectedPath === currentBrowsePath ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
        @click="handleSelectCurrentDir"
      >
        <SvgIcon icon="mdi:folder" :size="20" class="text-amber-500" />
        <span class="text-14px font-medium">. ({{ $t('page.disk.moveCopy.currentDir') }})</span>
      </div>

      <!-- 文件夹列表 -->
      <NScrollbar style="max-height: 300px">
        <NSpin :show="loading">
          <div v-if="folders.length === 0 && !loading" class="py-24px text-center opacity-50">
            {{ $t('page.disk.moveCopy.noFolders') }}
          </div>
          <div class="flex flex-col gap-4px">
            <div
              v-for="folder in folders"
              :key="folder.id"
              class="flex items-center gap-8px p-8px rounded cursor-pointer transition-colors"
              :class="selectedPath === folder.path ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
              @click="handleSelectFolder(folder)"
              @dblclick="handleEnterFolder(folder)"
            >
              <SvgIcon icon="mdi:folder" :size="20" class="text-amber-500" />
              <span class="flex-1 text-14px">{{ folder.name }}</span>
              <NButton quaternary size="tiny" @click.stop="handleEnterFolder(folder)">
                <template #icon>
                  <SvgIcon icon="mdi:chevron-right" :size="16" />
                </template>
              </NButton>
            </div>
          </div>
        </NSpin>
      </NScrollbar>

      <!-- 已选目标 -->
      <div v-if="selectedDisplayPath" class="text-13px opacity-70">
        {{ $t('page.disk.moveCopy.targetLabel') }}: {{ selectedDisplayPath || '/' }}
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="submitting" :disabled="!selectedPath && currentBrowsePath === '/'" @click="handleConfirm">
          {{ $t('common.confirm') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
