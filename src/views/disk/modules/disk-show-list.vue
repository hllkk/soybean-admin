<script lang="tsx" setup>
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
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
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  selectedFileIds: () => [],
  isBatchMode: false
});

const themeStore = useThemeStore();

const columns = computed<DataTableColumns<Api.Disk.FileItem>>(() => {
  const cols: DataTableColumns<Api.Disk.FileItem> = [
    {
      title: '文件名',
      key: 'name',
      width: 300,
      ellipsis: {
        tooltip: true
      },
      render: row => {
        return (
          <div class="flex items-center">
            <div class="mr-6 h-30px w-30px flex-shrink-0">
              <FileImage data={row} />
            </div>
            <span class="select-none text-13px">{row.name}</span>
          </div>
        );
      }
    },
    {
      title: '大小',
      key: 'size',
      width: 120,
      align: 'center',
      render: row => {
        if (row.isDir) {
          return <div class="select-none">-</div>;
        }
        return <div class="text-12px">{formatFileSize(row.size as number)}</div>;
      }
    },
    {
      title: '扩展名',
      key: 'extendName',
      width: 100,
      align: 'center',
      render: row => {
        if (!row.extendName) return null;
        return (
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
        );
      }
    },
    {
      title: '类型',
      key: 'isDir',
      width: 80,
      align: 'center',
      render: row => {
        return (
          <div class="select-none text-12px">
            {row.isDir ? '文件夹' : `${row.extendName ? `${row.extendName}文件` : '未知文件'}`}
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
        return <div class="select-none text-12px">{formatDate(row.updateTime as string)}</div>;
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
</script>

<template>
  <NDataTable
    v-show="props.data.length > 0"
    size="small"
    :single-line="true"
    :columns="columns"
    :data="props.data"
    :row-key="row => row.id"
  />
</template>
