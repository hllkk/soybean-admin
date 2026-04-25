<script setup lang="ts">
import { computed } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { useSvgIcon } from '@/hooks/common/icon';

defineOptions({
  name: 'SimpleToolbar'
});

interface Props {
  /** 页面类型 */
  pageType: 'my-share' | 'recent' | 'trash' | 'favorite';
  /** 选中数量 */
  selectedCount: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'sort', field: string, order: 'asc' | 'desc'): void;
  (e: 'toggleView'): void;
  (e: 'refresh'): void;
  (e: 'clearSelection'): void;
  (e: 'restore'): void;
  (e: 'deletePermanently'): void;
  (e: 'removeShare'): void;
  (e: 'removeFavorite'): void;
  (e: 'download'): void;
  (e: 'clearRecent'): void;
  (e: 'emptyTrash'): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();
const { SvgIconVNode } = useSvgIcon();

// 是否有选中
const hasSelection = computed(() => props.selectedCount > 0);

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
  }
]);

// 根据页面类型获取选中后的操作按钮
const selectionActions = computed(() => {
  switch (props.pageType) {
    case 'my-share':
      return [
        { key: 'removeShare', label: $t('page.disk.myShare.cancelShare'), icon: 'mdi:share-off-outline' },
        { key: 'download', label: $t('page.disk.toolbar.download'), icon: 'mdi:download-outline' }
      ];
    case 'recent':
      return [
        { key: 'removeRecent', label: $t('page.disk.recent.remove'), icon: 'mdi:close-circle-outline' },
        { key: 'download', label: $t('page.disk.toolbar.download'), icon: 'mdi:download-outline' }
      ];
    case 'trash':
      return [
        { key: 'restore', label: $t('page.disk.trash.restore'), icon: 'mdi:restore' },
        { key: 'deletePermanently', label: $t('page.disk.trash.deletePermanently'), icon: 'mdi:delete-forever' }
      ];
    case 'favorite':
      return [
        { key: 'removeFavorite', label: $t('page.disk.favorite.remove'), icon: 'mdi:star-off-outline' },
        { key: 'download', label: $t('page.disk.toolbar.download'), icon: 'mdi:download-outline' }
      ];
    default:
      return [];
  }
});

// 处理排序选择
function handleSortSelect(key: string) {
  const [field, order] = key.split('-');
  emit('sort', field, order as 'asc' | 'desc');
}

// 切换视图模式
function toggleViewMode() {
  emit('toggleView');
}

// 刷新
function handleRefresh() {
  emit('refresh');
}

// 取消选中
function handleClearSelection() {
  emit('clearSelection');
}

// 处理选中操作
function handleSelectionAction(key: string) {
  switch (key) {
    case 'restore':
      emit('restore');
      break;
    case 'deletePermanently':
      emit('deletePermanently');
      break;
    case 'removeShare':
      emit('removeShare');
      break;
    case 'removeFavorite':
      emit('removeFavorite');
      break;
    case 'removeRecent':
      emit('clearRecent');
      break;
    case 'download':
      emit('download');
      break;
  }
}

// 清空全部
function handleClearAll() {
  switch (props.pageType) {
    case 'recent':
      emit('clearRecent');
      break;
    case 'trash':
      emit('emptyTrash');
      break;
  }
}
</script>

<template>
  <div class="flex items-center justify-between gap-8px px-8px py-12px flex-wrap sm:gap-16px sm:px-16px">
    <!-- 左侧：选中状态及操作按钮 -->
    <div v-if="hasSelection" class="flex items-center gap-8px flex-1">
      <NTag type="info" round>
        {{ $t('page.disk.toolbar.selectedCount', { count: selectedCount }) }}
      </NTag>
      <NButton quaternary size="small" @click="handleClearSelection">
        <template #icon>
          <SvgIcon icon="mdi:close" :size="16" />
        </template>
      </NButton>
      <NButtonGroup>
        <NButton v-for="action in selectionActions" :key="action.key" @click="handleSelectionAction(action.key)">
          <template #icon>
            <SvgIcon :icon="action.icon" :size="18" />
          </template>
          <span class="hidden sm:inline">{{ action.label }}</span>
        </NButton>
      </NButtonGroup>
    </div>

    <!-- 右侧：功能按钮组 -->
    <div class="flex items-center gap-4px sm:gap-8px flex-shrink-0 ml-auto">
      <NButtonGroup>
        <!-- 清空全部按钮（仅最近访问和回收站显示，且未选中时） -->
        <NTooltip v-if="!hasSelection && (pageType === 'recent' || pageType === 'trash')" trigger="hover">
          <template #trigger>
            <NButton type="warning" @click="handleClearAll">
              <template #icon>
                <SvgIcon :icon="pageType === 'recent' ? 'icon-park-outline-clear' : 'mdi-delete-sweep'" :size="18" />
              </template>
            </NButton>
          </template>
          {{ pageType === 'recent' ? $t('page.disk.recent.clearAll') : $t('page.disk.trash.empty') }}
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
  </div>
</template>

<style scoped lang="scss">
</style>
