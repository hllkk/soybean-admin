<script lang="tsx" setup>
import { computed, ref, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import type { DataTableColumns } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { formatDate, formatFileSize } from '@/utils/file';
import FileImage from './disk-image.vue';

defineOptions({
  name: 'FileDisplayList'
});

interface Props {
  data?: Api.Disk.FileItem[];
  selectedFileIds?: string[];
  isBatchMode?: boolean;
  creatingItem?: Api.Disk.FileItem | null;
}

interface Emits {
  (e: 'confirmCreate', name: string): void;
  (e: 'cancelCreate'): void;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  selectedFileIds: () => [],
  isBatchMode: false,
  creatingItem: null
});

const emit = defineEmits<Emits>();

const themeStore = useThemeStore();
const appStore = useAppStore();
const { height } = useWindowSize();

// 跟踪每行的悬停状态
const hoveredRowId = ref<CommonType.IdType | null>(null);
const creatingName = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// 处理行悬停事件
const handleRowMouseEnter = (row: Api.Disk.FileItem) => {
  hoveredRowId.value = row.id;
};

const handleRowMouseLeave = () => {
  hoveredRowId.value = null;
};

function handleConfirm() {
  emit('confirmCreate', creatingName.value);
}

function handleCancel() {
  emit('cancelCreate');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleConfirm();
  } else if (e.key === 'Escape') {
    handleCancel();
  }
}

function getDisplayName(item: Api.Disk.FileItem): string {
  if (item.isDir) {
    return item.name;
  }
  if (!item.extendName) {
    return item.name;
  }
  const extWithDot = `.${item.extendName}`;
  if (item.name.endsWith(extWithDot)) {
    return item.name.slice(0, -extWithDot.length);
  }
  return item.name;
}

function getFullFileName(item: Api.Disk.FileItem): string {
  if (item.isDir) {
    return item.name;
  }
  if (!item.extendName) {
    return item.name;
  }
  return `${item.name}.${item.extendName}`;
}

const displayData = computed(() => {
  if (!props.creatingItem) {
    return props.data;
  }
  const creatingRow: Api.Disk.FileItem = {
    id: props.creatingItem.id,
    name: '',
    isDir: props.creatingItem.isDir,
    size: 0,
    extendName: props.creatingItem.isDir ? '' : props.creatingItem.extendName || '',
    updateTime: new Date().toISOString()
  };
  return [creatingRow, ...props.data];
});

const columns = computed<DataTableColumns<Api.Disk.FileItem>>(() => {
  const cols: DataTableColumns<Api.Disk.FileItem> = [
    {
      title: '文件名',
      key: 'name',
      width: 300,
      render: row => {
        const isCreating = props.creatingItem && row.id === props.creatingItem.id;
        const isHovered = hoveredRowId.value === row.id;
        if (isCreating) {
          return (
            <div class="h-full w-50% flex items-center gap-2">
              <div class="h-30px w-30px flex flex-shrink-0 items-center justify-center">
                <FileImage data={row} />
              </div>
              <NInput
                ref={inputRef}
                value={creatingName.value}
                onUpdateValue={(v: string) => (creatingName.value = v)}
                size="tiny"
                placeholder={props.creatingItem?.isDir ? '文件夹名称' : '文件名称'}
                class="flex-1"
                onKeydown={handleKeydown}
              />
              <NButton size="tiny" type="primary" onClick={handleConfirm}>
                <icon-mdi-check />
              </NButton>
              <NButton size="tiny" type="primary" onClick={handleCancel}>
                <icon-mdi-close />
              </NButton>
            </div>
          );
        }
        return (
          <div class="group h-full w-full flex items-center justify-between">
            {/* 左侧：图标和文件名 */}
            <div class="mr-4 min-w-0 flex flex-1 items-center overflow-hidden">
              <div class="mr-3 h-30px w-30px flex-shrink-0">
                <FileImage data={row} />
              </div>
              <span class="select-none truncate text-13px">{getDisplayName(row)}</span>
            </div>

            {/* 右侧：按钮组 */}
            <div
              class={`flex flex-shrink-0 items-center transition-opacity duration-300 -mr-2 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <NButtonGroup>
                <NButton text size="small" class="text-4 text-primary">
                  <icon-ci-share-android />
                </NButton>
                <NButton text size="small" class="pl-2 text-4 text-primary">
                  <icon-ci-download />
                </NButton>
                <NButton text size="small" class="pl-2 text-4 text-primary">
                  <icon-iconamoon-trash />
                </NButton>
              </NButtonGroup>
            </div>
          </div>
        );
      }
    },
    {
      title: '大小',
      key: 'size',
      width: 60,
      align: 'center',
      render: row => {
        const isCreating = props.creatingItem && row.id === props.creatingItem.id;
        const isHovered = hoveredRowId.value === row.id;
        if (isCreating) {
          return null;
        }
        if (row.isDir) {
          return <div class="select-none">-</div>;
        }
        return (
          <div class={`transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <div class="text-12px">{formatFileSize(row.size as number)}</div>
          </div>
        );
      }
    },
    {
      title: '扩展名',
      key: 'extendName',
      width: 100,
      align: 'center',
      render: row => {
        const isCreating = props.creatingItem && row.id === props.creatingItem.id;
        const isHovered = hoveredRowId.value === row.id;
        if (isCreating || !row.extendName) return null;
        return (
          <div class={`transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <NTag
              size={'small'}
              bordered={false}
              color={{
                color: themeStore.darkMode ? 'rgba(142, 81, 218, 0.2)' : 'rgb(245, 232, 255)',
                textColor: themeStore.darkMode ? 'rgb(142, 81, 218)' : 'rgb(114, 46, 209)'
              }}
            >
              {row.extendName}
            </NTag>
          </div>
        );
      }
    },
    {
      title: '类型',
      key: 'isDir',
      width: 80,
      align: 'center',
      render: row => {
        const isCreating = props.creatingItem && row.id === props.creatingItem.id;
        const isHovered = hoveredRowId.value === row.id;
        if (isCreating) {
          return null;
        }
        return (
          <div class={`transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <div class="select-none text-12px">
              {row.isDir ? '文件夹' : `${row.extendName ? `${row.extendName}文件` : '未知文件'}`}
            </div>
          </div>
        );
      }
    },
    {
      title: '修改时间',
      key: 'updateTime',
      width: 180,
      align: 'center',
      render: row => {
        const isCreating = props.creatingItem && row.id === props.creatingItem.id;
        const isHovered = hoveredRowId.value === row.id;
        if (isCreating) {
          return null;
        }
        return (
          <div class={`transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <div class="select-none text-12px">{formatDate(row.updateTime as string)}</div>
          </div>
        );
      }
    }
  ];

  // 如果 isBatchMode 为 true，添加选择列
  if (props.isBatchMode) {
    cols.unshift({
      type: 'selection'
    });
  }

  return cols;
});

// 计算表格最大高度
const tableMaxHeight = computed(() => {
  const headerHeight = 60; // 页面头部高度
  const footerHeight = 60; // 页面底部高度
  const padding = 20; // 上下内边距
  const otherElementsHeight = 100; // 其他元素高度

  if (appStore.isMobile) {
    return 450;
  }

  // 根据窗口高度动态计算，而不是固定值
  return height.value - headerHeight - footerHeight - padding - otherElementsHeight;
});

// 定义行属性
const rowProps = (row: Api.Disk.FileItem) => {
  return {
    onmouseenter: () => {
      handleRowMouseEnter(row);
    },
    onmouseleave: () => handleRowMouseLeave(),
    class: hoveredRowId.value === row.id ? 'hovered-row' : ''
  };
};

watch(
  () => props.creatingItem,
  newItem => {
    if (newItem) {
      if (newItem.isDir) {
        creatingName.value = newItem.name;
      } else {
        creatingName.value = getFullFileName(newItem);
      }
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
</script>

<template>
  <div class="h-full overflow-hidden">
    <NDataTable
      v-show="displayData.length > 0"
      size="small"
      :single-line="true"
      :bordered="false"
      :columns="columns"
      :data="displayData"
      :row-key="row => row.id"
      :scroll-x="800"
      :max-height="tableMaxHeight"
      :row-props="rowProps"
    />
  </div>
</template>
