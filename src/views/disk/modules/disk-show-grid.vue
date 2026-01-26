<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useDiskStore } from '@/store/modules/disk';
import FileImage from './disk-image.vue';

defineOptions({
  name: 'FileDiskplayGrid'
});

interface Props {
  data?: Api.Disk.FileItem[];
  isBatchMode?: boolean;
  creatingItem?: Api.Disk.FileItem | null;
  renamingItem?: Api.Disk.FileItem | null;
}

interface Emits {
  (e: 'confirmCreate', name: string): void;
  (e: 'cancelCreate'): void;
  (e: 'confirmRename', name: string): void;
  (e: 'cancelRename'): void;
  (e: 'contextMenu', event: MouseEvent, file: Api.Disk.FileItem): void;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  isBatchMode: false,
  creatingItem: null,
  renamingItem: null
});

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const isLoading = ref<boolean>(false);
const inputRef = ref<HTMLInputElement | null>(null);
const renameInputRef = ref<HTMLInputElement | null>(null);
const creatingName = ref('');
const renamingName = ref('');
const selectedFileIds = computed(() => diskStore.selectedFileIds);

function getFullFileName(item: Api.Disk.FileItem): string {
  if (item.isDir) {
    return item.name;
  }
  if (!item.extendName) {
    return item.name;
  }
  return `${item.name}.${item.extendName}`;
}

function handleConfirm() {
  emit('confirmCreate', creatingName.value);
}

function handleCancel() {
  emit('cancelCreate');
}

function handleRenameConfirm() {
  emit('confirmRename', renamingName.value);
}

function handleRenameCancel() {
  emit('cancelRename');
}

function handleRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleRenameConfirm();
  } else if (e.key === 'Escape') {
    handleRenameCancel();
  }
}

function isRenaming(fileId: CommonType.IdType): boolean {
  return props.renamingItem?.id === fileId;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleConfirm();
  } else if (e.key === 'Escape') {
    handleCancel();
  }
}

function isSelected(fileId: CommonType.IdType): boolean {
  return selectedFileIds.value.includes(fileId);
}

function handleToggleSelection(fileId: CommonType.IdType) {
  diskStore.toggleFileSelection(fileId);
}

function handleShare(file: Api.Disk.FileItem) {
  window.$message?.info(`分享文件: ${file.name}`);
}

function handleDownload(file: Api.Disk.FileItem) {
  window.$message?.info(`下载文件: ${file.name}`);
}

watch(
  () => props.creatingItem,
  newItem => {
    if (newItem) {
      creatingName.value = getFullFileName(newItem);
      setTimeout(() => {
        inputRef.value?.focus();
        inputRef.value?.select();
      }, 100);
    } else {
      creatingName.value = '';
    }
  },
  { immediate: true }
);

watch(
  () => props.renamingItem,
  async newItem => {
    if (newItem) {
      renamingName.value = getFullFileName(newItem);
      await nextTick();
      setTimeout(() => {
        renameInputRef.value?.focus();
        renameInputRef.value?.select();
      }, 50);
    } else {
      renamingName.value = '';
    }
  },
  { immediate: true }
);
</script>

<template>
  <NGrid cols="4 s:3 m:5 l:6 xl:8 xxl:9" :x-gap="30" :y-gap="30" item-responsive responsive="screen">
    <!-- 正在创建的项目（显示在最前面） -->
    <NGridItem v-if="creatingItem" :key="creatingItem.id">
      <div class="pos-relative mt-12px h-150px w-auto bg-primary-50 dark:bg-[rgba(255,255,255,0.05)]">
        <!-- 顶部操作按钮 -->
        <div class="flex justify-between">
          <!--新建文件或者文件时的占位DIV-->
          <div class="ml-1 mt-1"></div>
          <div class="mr-1 mt-2 w-40px flex-x-center gap-1 rounded-md bg-white dark:bg-[rgba(255,255,255,0.1)]">
            <NButton size="tiny" text @click="handleConfirm">
              <template #icon>
                <icon-mdi-check class="text-primary" />
              </template>
            </NButton>
            <NButton size="tiny" text @click="handleCancel">
              <template #icon>
                <icon-mdi-close class="text-primary" />
              </template>
            </NButton>
          </div>
        </div>
        <!-- 图标 -->
        <div class="mt-8px h-65px flex-x-center">
          <FileImage :item="creatingItem" />
        </div>
        <!-- 输入框 -->
        <div class="mt-12px flex-x-center px-2">
          <NInput
            ref="inputRef"
            v-model:value="creatingName"
            size="tiny"
            :placeholder="creatingItem.isDir ? '文件夹名称' : '文件名称'"
            @keydown="handleKeydown"
          />
        </div>
      </div>
    </NGridItem>
    <NGridItem v-for="item in props.data" :key="item.id">
      <div
        class="pos-relative mt-12px h-150px w-auto hover:bg-primary-100 dark:hover:bg-[rgba(255,255,255,0.1)]"
        :class="
          isBatchMode || isSelected(item.id) || isRenaming(item.id)
            ? 'bg-primary-100 dark:bg-[rgba(255,255,255,0.1)]'
            : ''
        "
        @contextmenu="(e: MouseEvent) => emit('contextMenu', e, item)"
        @click="!isBatchMode && diskStore.handleSelectFile(item)"
      >
        <!-- 正在重命名的项目 -->
        <template v-if="isRenaming(item.id)">
          <div class="flex justify-between">
            <div class="ml-1 mt-1"></div>
            <div class="mr-1 mt-2 w-40px flex-x-center gap-1 rounded-md bg-white dark:bg-[rgba(255,255,255,0.1)]">
              <NButton size="tiny" text @click="handleRenameConfirm">
                <template #icon>
                  <icon-mdi-check class="text-primary" />
                </template>
              </NButton>
              <NButton size="tiny" text @click="handleRenameCancel">
                <template #icon>
                  <icon-mdi-close class="text-primary" />
                </template>
              </NButton>
            </div>
          </div>
          <div class="mt-8px h-65px flex-x-center">
            <FileImage :item="item" />
          </div>
          <div class="mt-12px flex-x-center px-2">
            <NInput
              ref="renameInputRef"
              v-model:value="renamingName"
              size="tiny"
              :placeholder="item.isDir ? '文件夹名称' : '文件名称'"
              @keydown="handleRenameKeydown"
            />
          </div>
        </template>
        <!-- 正常显示的项目 -->
        <template v-else>
          <!-- 顶部操作内容，悬停展示-->
          <div class="flex justify-between">
            <div class="ml-1 mt-1" :class="isBatchMode || isSelected(item.id) ? 'checkbox-always-show' : 'hover-info'">
              <NCheckbox
                size="small"
                :checked="isSelected(item.id)"
                @update:checked="() => handleToggleSelection(item.id)"
                @click.stop
              ></NCheckbox>
            </div>
            <div class="hover-info">
              <div
                class="mr-1 mt-2 h-auto w-40px flex-x-center gap-1 rounded-md bg-white dark:bg-[rgba(255,255,255,0.1)]"
              >
                <NButton size="tiny" text @click.stop="handleShare(item)">
                  <template #icon>
                    <icon-solar-share-outline class="text-primary" />
                  </template>
                </NButton>
                <NButton size="tiny" text @click.stop="handleDownload(item)">
                  <template #icon>
                    <icon-material-symbols-download-rounded class="text-primary" />
                  </template>
                </NButton>
              </div>
            </div>
          </div>
          <div class="mt-8px h-65px flex-x-center">
            <NSkeleton v-if="isLoading" :sharp="false" size="medium" :width="60" :height="60"></NSkeleton>
            <FileImage v-else :item="item" />
          </div>
          <div class="mt-12px flex-x-center select-none px-2 text-3.3">
            <p
              :title="item.name"
              class="line-clamp-2 max-h-[2.8em] overflow-hidden text-ellipsis whitespace-nowrap break-all leading-[1.4]"
            >
              {{ item.name }}
            </p>
          </div>
        </template>
      </div>
    </NGridItem>
  </NGrid>
</template>

<style scoped>
.hover-info {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pos-relative:hover .hover-info {
  opacity: 1;
}

.checkbox-always-show {
  opacity: 1;
}
</style>
