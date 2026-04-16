<script setup lang="ts">
import { computed, h, ref } from 'vue';
import type { DropdownOption } from 'naive-ui';

import { $t } from '@/locales';
import { formatDateShort, formatFileSize } from '@/utils/format';

import FileIcon from './file-icon.vue';

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
  (e: 'share', file: Api.Disk.FileItem): void;
  (e: 'download', file: Api.Disk.FileItem): void;
  (e: 'delete', file: Api.Disk.FileItem): void;
  (e: 'rename', file: Api.Disk.FileItem): void;
  (e: 'copy', file: Api.Disk.FileItem): void;
  (e: 'move', file: Api.Disk.FileItem): void;
}

const emit = defineEmits<Emits>();

const moreDropdownShow = ref(false);

const formattedTime = computed(() => formatDateShort(props.file.modifyTime));

const formattedSize = computed(() => {
  if (props.file.isFolder) return '-';
  return formatFileSize(props.file.fileSize);
});

/** 悬停名称 tooltip 详情 */
const nameTooltipContent = computed(() => {
  const lines = [`${$t('page.disk.file.name')}: ${props.file.fileName}`];
  if (!props.file.isFolder) {
    lines.push(`${$t('page.disk.file.size')}: ${formattedSize.value}`);
  }
  lines.push(`${$t('page.disk.file.modifyTime')}: ${props.file.modifyTime}`);
  return lines.join('\n');
});

/** "..." 更多操作下拉选项 */
const moreOptions = computed<DropdownOption[]>(() => [
  {
    label: $t('page.disk.contextMenu.delete'),
    key: 'delete',
    icon: () => h(SvgIcon, { icon: 'mdi:delete-outline', size: 16 })
  },
  {
    label: $t('page.disk.contextMenu.rename'),
    key: 'rename',
    icon: () => h(SvgIcon, { icon: 'mdi:pencil-outline', size: 16 })
  },
  {
    label: $t('page.disk.toolbar.copy'),
    key: 'copy',
    icon: () => h(SvgIcon, { icon: 'mdi:content-copy', size: 16 })
  },
  {
    label: $t('page.disk.toolbar.move'),
    key: 'move',
    icon: () => h(SvgIcon, { icon: 'mdi:folder-move-outline', size: 16 })
  },
  {
    label: $t('page.disk.contextMenu.share'),
    key: 'share',
    icon: () => h(SvgIcon, { icon: 'mdi:share-outline', size: 16 })
  }
]);

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

function handleShare(e: MouseEvent) {
  e.stopPropagation();
  emit('share', props.file);
}

function handleDownload(e: MouseEvent) {
  e.stopPropagation();
  emit('download', props.file);
}

function handleMoreSelect(key: string) {
  if (key === 'delete') emit('delete', props.file);
  else if (key === 'rename') emit('rename', props.file);
  else if (key === 'copy') emit('copy', props.file);
  else if (key === 'move') emit('move', props.file);
  else if (key === 'share') emit('share', props.file);
}
</script>

<template>
  <div
    class="group relative flex flex-col items-center px-8px py-16px rd-8px cursor-pointer overflow-hidden transition-all duration-200 hover:bg-primary/10 dark:hover:bg-primary/20"
    :class="{ 'bg-primary/15 dark:bg-primary/25': selected }"
    @click="handleClick"
    @dblclick="handleDblClick"
  >
    <!-- 顶部操作栏：pointer-events-none 默认禁用交互，避免盖住相邻卡片 -->
    <div
      class="absolute top-4px left-4px right-4px z-1 flex items-center justify-between pointer-events-none opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
      :class="{ '!pointer-events-auto !opacity-100': selected || moreDropdownShow }"
    >
      <!-- 左侧：勾选框 -->
      <div class="pointer-events-auto" @click="handleSelect">
        <NCheckbox :checked="selected" />
      </div>
      <!-- 右侧：操作按钮组（更紧凑） -->
      <div class="flex items-center -mr-2px pointer-events-auto" @click.stop>
        <NTooltip trigger="hover">
          <template #trigger>
            <button class="p-3px rd-4px cursor-pointer opacity-80 hover:opacity-100 hover:bg-[var(--n-hover-color)]" @click="handleShare">
              <SvgIcon icon="mdi:share-outline" :size="12" />
            </button>
          </template>
          {{ $t('page.disk.toolbar.share') }}
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <button class="p-3px rd-4px cursor-pointer opacity-80 hover:opacity-100 hover:bg-[var(--n-hover-color)]" @click="handleDownload">
              <SvgIcon icon="mdi:download-outline" :size="12" />
            </button>
          </template>
          {{ $t('page.disk.toolbar.download') }}
        </NTooltip>
        <NDropdown
          :options="moreOptions"
          trigger="hover"
          placement="bottom-end"
          @select="handleMoreSelect"
          @update:show="val => (moreDropdownShow = val)"
        >
          <NTooltip trigger="hover">
            <template #trigger>
              <button class="p-3px rd-4px cursor-pointer opacity-80 hover:opacity-100 hover:bg-[var(--n-hover-color)]">
                <SvgIcon icon="mdi:dots-horizontal" :size="12" />
              </button>
            </template>
            {{ $t('page.disk.toolbar.more') }}
          </NTooltip>
        </NDropdown>
      </div>
    </div>

    <!-- 图标 -->
    <div class="mb-8px mt-16px">
      <FileIcon
        :file-type="file.isFolder ? 'folder' : file.fileType"
        :extension="file.fileExtension"
        size="large"
      />
    </div>

    <!-- 名称：外层 div 占满宽度，NTooltip 的 inline span 通过 :deep 改为 block -->
    <div class="w-full text-center text-13px px-4px">
      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NEllipsis :line-clamp="2">
            {{ file.fileName }}
          </NEllipsis>
        </template>
        <div class="whitespace-pre-line text-12px leading-5">{{ nameTooltipContent }}</div>
      </NTooltip>
    </div>

    <!-- 时间 -->
    <div class="text-11px mt-4px" style="color: var(--n-text-color-disabled)">
      {{ formattedTime }}
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 修复 NTooltip 外层 inline span 导致 flex-col 宽度不一致 */
:deep(.n-tooltip-trigger) {
  width: 100%;
}
</style>
