<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { useSvgIcon } from '@/hooks/common/icon';
import { useUploader } from '@/hooks/business/upload/use-uploader';
import type { DropdownOption } from 'naive-ui';

defineOptions({
  name: 'DiskToolbar'
});

interface Emits {
  (e: 'uploadFile'): void;
  (e: 'uploadFolder'): void;
  (e: 'createFolder'): void;
  (e: 'search'): void;
  (e: 'refresh'): void;
  (e: 'share'): void;
  (e: 'batchShare'): void;
  (e: 'download'): void;
  (e: 'delete'): void;
  (e: 'rename'): void;
  (e: 'showTransfer'): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();
const { SvgIconVNode } = useSvgIcon();
const { triggerFile, triggerFolder } = useUploader();

const showMobileSearch = ref(false);
const searchKeyword = ref('');
const currentSort = ref<string>('modifyTime-desc');

// 选中数量
const selectedCount = computed(() => diskStore.selectedFiles.length);
// 是否有选中文件
const hasSelection = computed(() => selectedCount.value > 0);
// 是否多选
const isMultipleSelection = computed(() => selectedCount.value > 1);
// 活跃传输数量
const activeTransferCount = computed(() =>
  diskStore.transferList.filter(item => item.status !== 'completed').length
);

// 上传下拉选项
const uploadOptions = computed<DropdownOption[]>(() => [
  {
    key: 'uploadFile',
    label: $t('page.disk.toolbar.uploadFile'),
    icon: SvgIconVNode({ localIcon: 'disk-upload-file', fontSize: 18 })
  },
  {
    key: 'uploadFolder',
    label: $t('page.disk.toolbar.uploadFolder'),
    icon: SvgIconVNode({ localIcon: 'disk-upload-folder', fontSize: 18 })
  }
]);

// 新建下拉选项
const createOptions = computed<DropdownOption[]>(() => [
  {
    key: 'createFile',
    label: $t('page.disk.toolbar.createFile'),
    icon: SvgIconVNode({ localIcon: 'disk-create-file', fontSize: 18 })
  },
  {
    key: 'createFolder',
    label: $t('page.disk.toolbar.createFolder'),
    icon: SvgIconVNode({ localIcon: 'disk-create-folder', fontSize: 18 })
  }
]);

// 排序下拉选项
const sortOptions = computed<DropdownOption[]>(() => [
  {
    key: 'name-asc',
    label: $t('page.disk.sort.nameAsc'),
    icon: SvgIconVNode({ icon: 'mdi:sort-alphabetical-ascending', fontSize: 18 })
  },
  {
    key: 'name-desc',
    label: $t('page.disk.sort.nameDesc'),
    icon: SvgIconVNode({ icon: 'mdi:sort-alphabetical-descending', fontSize: 18 })
  },
  {
    key: 'size-asc',
    label: $t('page.disk.sort.sizeAsc'),
    icon: SvgIconVNode({ icon: 'mdi:sort-numeric-ascending', fontSize: 18 })
  },
  {
    key: 'size-desc',
    label: $t('page.disk.sort.sizeDesc'),
    icon: SvgIconVNode({ icon: 'mdi:sort-numeric-descending', fontSize: 18 })
  },
  {
    key: 'modifyTime-asc',
    label: $t('page.disk.sort.timeAsc'),
    icon: SvgIconVNode({ icon: 'mdi:clock-outline', fontSize: 18 })
  },
  {
    key: 'modifyTime-desc',
    label: $t('page.disk.sort.timeDesc'),
    icon: SvgIconVNode({ icon: 'mdi-sort-reverse-variant', fontSize: 18 })
  },
  {
    key: 'type-asc',
    label: $t('page.disk.sort.typeAsc'),
    icon: SvgIconVNode({ icon: 'mdi:folder-outline', fontSize: 18 })
  },
  {
    key: 'type-desc',
    label: $t('page.disk.sort.typeDesc'),
    icon: SvgIconVNode({ icon: 'mdi:file-outline', fontSize: 18 })
  }
]);

// 更多操作下拉选项
const moreOptions = computed<DropdownOption[]>(() => [
  {
    key: 'move',
    label: $t('page.disk.toolbar.move'),
    icon: SvgIconVNode({ icon: 'mdi:folder-move-outline', fontSize: 18 })
  },
  {
    key: 'copy',
    label: $t('page.disk.toolbar.copy'),
    icon: SvgIconVNode({ icon: 'mdi:content-copy', fontSize: 18 })
  },
  {
    key: 'info',
    label: $t('page.disk.toolbar.info'),
    icon: SvgIconVNode({ icon: 'mdi:information-outline', fontSize: 18 })
  }
]);

// 处理上传选择
function handleUploadSelect(key: string) {
  if (key === 'uploadFile') {
    triggerFile();
  } else if (key === 'uploadFolder') {
    triggerFolder();
  }
}

// 处理新建选择
function handleCreateSelect(key: string) {
  if (key === 'createFolder') {
    emit('createFolder');
  }
}

// 处理排序选择
function handleSortSelect(key: string) {
  currentSort.value = key;
  const [field, order] = key.split('-');
  diskStore.setSort(field as 'name' | 'size' | 'modifyTime' | 'type', order as 'asc' | 'desc');
}

// 处理搜索
function handleSearch() {
  emit('search');
}

// 移动端搜索
function handleMobileSearch() {
  showMobileSearch.value = false;
  emit('search');
}

// 取消选中
function handleClearSelection() {
  diskStore.clearSelection();
}

// 分享
function handleShare() {
  emit('share');
}

// 批量分享
function handleBatchShare() {
  emit('batchShare');
}

// 下载
function handleDownload() {
  emit('download');
}

// 删除
function handleDelete() {
  emit('delete');
}

// 重命名
function handleRename() {
  emit('rename');
}

// 处理更多操作
function handleMoreSelect(_key: string) {
  // TODO: 实现移动、复制、查看详情等操作
}

// 切换视图模式
function toggleViewMode() {
  diskStore.setViewMode(diskStore.viewMode === 'grid' ? 'list' : 'grid');
}

// 打开传输列表
function handleTransferList() {
  emit('showTransfer');
}

// 刷新列表
function handleRefresh() {
  emit('refresh');
}
</script>

<template>
  <div class="flex items-center gap-8px px-8px py-12px flex-wrap sm:gap-16px sm:px-16px">
    <!-- 未选中状态：上传、新建、搜索 -->
    <template v-if="!hasSelection">
      <div class="flex items-center gap-8px flex-1">
        <NDropdown :options="uploadOptions" trigger="click" @select="handleUploadSelect">
          <NButton type="primary">
            <template #icon>
              <SvgIcon icon="mdi:cloud-upload" :size="18" class="dark:text-white" />
            </template>
            <span class="hidden sm:inline dark:text-white">{{ $t('page.disk.toolbar.upload') }}</span>
          </NButton>
        </NDropdown>

        <NDropdown :options="createOptions" trigger="click" @select="handleCreateSelect">
          <NButton type="primary">
            <template #icon>
              <SvgIcon icon="mdi:plus" :size="18" class="dark:text-white" />
            </template>
            <span class="hidden sm:inline text-white dark:text-white">{{ $t('page.disk.toolbar.create') }}</span>
          </NButton>
        </NDropdown>

        <!-- 搜索框：平板及以上显示 -->
        <NInputGroup class="hidden sm:flex w-180px lg:w-240px">
          <NInput v-model:value="searchKeyword" :placeholder="$t('page.disk.toolbar.searchPlaceholder')" clearable />
          <NButton type="primary" @click="handleSearch">
            <template #icon>
              <SvgIcon icon="mdi:magnify" :size="18" class="dark:text-white" />
            </template>
          </NButton>
        </NInputGroup>

        <!-- 移动端：搜索按钮 -->
        <NButton class="sm:hidden" @click="showMobileSearch = true">
          <template #icon>
            <SvgIcon icon="mdi:magnify" :size="18" />
          </template>
        </NButton>
      </div>
    </template>

    <!-- 选中状态：选中信息 + 操作按钮（手机端同行，桌面端操作按钮 flex-1 撑开推右） -->
    <template v-else>
      <div class="flex items-center gap-8px">
        <NTag type="info" round>
          {{ $t('page.disk.toolbar.selectedCount', { count: selectedCount }) }}
        </NTag>
        <NButton quaternary size="small" @click="handleClearSelection">
          <template #icon>
            <SvgIcon icon="mdi:close" :size="16" />
          </template>
        </NButton>
      </div>

      <div class="flex items-center gap-8px sm:flex-1">
        <NButtonGroup>
          <!-- 分享 -->
          <NButton @click="handleShare">
            <template #icon>
              <SvgIcon icon="mdi:share-outline" :size="18" />
            </template>
            <span class="hidden sm:inline">{{ $t('page.disk.toolbar.share') }}</span>
          </NButton>

          <!-- 批量分享：仅多选时显示 -->
          <NButton v-if="isMultipleSelection" @click="handleBatchShare">
            <template #icon>
              <SvgIcon icon="mdi:share-variant-outline" :size="18" />
            </template>
            <span class="hidden sm:inline">{{ $t('page.disk.toolbar.batchShare') }}</span>
          </NButton>

          <!-- 下载 -->
          <NButton @click="handleDownload">
            <template #icon>
              <SvgIcon icon="mdi:download-outline" :size="18" />
            </template>
            <span class="hidden sm:inline">{{ $t('page.disk.toolbar.download') }}</span>
          </NButton>

          <!-- 删除 -->
          <NButton type="error" @click="handleDelete">
            <template #icon>
              <SvgIcon icon="mdi:delete-outline" :size="18" />
            </template>
            <span class="hidden sm:inline">{{ $t('page.disk.toolbar.delete') }}</span>
          </NButton>

          <!-- 重命名：仅单选时显示 -->
          <NButton v-if="!isMultipleSelection" @click="handleRename">
            <template #icon>
              <SvgIcon icon="mdi:pencil-outline" :size="18" />
            </template>
            <span class="hidden sm:inline">{{ $t('page.disk.toolbar.rename') }}</span>
          </NButton>

          <!-- 更多 -->
          <NDropdown :options="moreOptions" trigger="click" @select="handleMoreSelect">
            <NButton>
              <template #icon>
                <SvgIcon icon="mdi:dots-horizontal" :size="18" />
              </template>
              <span class="hidden sm:inline">{{ $t('page.disk.toolbar.more') }}</span>
            </NButton>
          </NDropdown>
        </NButtonGroup>
      </div>
    </template>

    <!-- 右侧：功能按钮组（未选中时同行右侧，选中时手机端自然换行到第二行） -->
    <div class="flex items-center gap-4px sm:gap-8px flex-shrink-0">
      <NButtonGroup>
        <!-- 传输列表 -->
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton @click="handleTransferList">
              <template #icon>
                <NBadge :value="diskStore.uploadingCount" :max="99" :show="diskStore.uploadingCount > 0" :offset="[4, -2]">
                  <SvgIcon icon="mdi:swap-vertical" :size="18" />
                </NBadge>
              </template>
            </NButton>
          </template>
          {{ $t('page.disk.toolbar.transferList') }}
        </NTooltip>

        <!-- 排序 -->
        <NDropdown :options="sortOptions" trigger="click" @select="handleSortSelect">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton>
                <template #icon>
                  <SvgIcon icon="mdi:sort" :size="18" />
                </template>
              </NButton>
            </template>
            {{ $t('page.disk.toolbar.sort') }}
          </NTooltip>
        </NDropdown>

        <!-- 视图切换 -->
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton @click="toggleViewMode">
              <template #icon>
                <SvgIcon :icon="diskStore.viewMode === 'grid' ? 'mdi:view-grid' : 'mdi:view-list'" :size="18" />
              </template>
            </NButton>
          </template>
          {{ diskStore.viewMode === 'grid' ? $t('page.disk.toolbar.gridView') : $t('page.disk.toolbar.listView') }}
        </NTooltip>

        <!-- 刷新 -->
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton @click="handleRefresh">
              <template #icon>
                <SvgIcon icon="mdi:refresh" :size="18" />
              </template>
            </NButton>
          </template>
          {{ $t('page.disk.toolbar.refresh') }}
        </NTooltip>
      </NButtonGroup>
    </div>

    <!-- 移动端搜索弹窗 -->
    <NModal v-model:show="showMobileSearch" preset="card" style="width: 90%; max-width: 400px" :bordered="false">
      <NInputGroup>
        <NInput v-model:value="searchKeyword" :placeholder="$t('page.disk.toolbar.searchPlaceholder')" clearable autofocus />
        <NButton type="primary" @click="handleMobileSearch">
          <template #icon>
            <SvgIcon icon="mdi:magnify" :size="18" />
          </template>
        </NButton>
      </NInputGroup>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
</style>
