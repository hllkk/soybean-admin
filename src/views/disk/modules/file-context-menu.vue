<script setup lang="ts">
import { computed, markRaw } from 'vue';
import type { MenuOption } from 'naive-ui';
import { useSvgIcon } from '@/hooks/common/icon';

interface Props {
  show?: boolean;
  x?: number;
  y?: number;
  selectedFiles?: Api.Disk.FileItem[];
  contextType?: 'file' | 'folder' | 'empty' | 'multiple';
  targetFile?: Api.Disk.FileItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  x: 0,
  y: 0,
  selectedFiles: () => [],
  contextType: 'empty',
  targetFile: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'action', action: string, files?: Api.Disk.FileItem[]): void;
}>();

const { SvgIconVNode } = useSvgIcon();

// 缓存图标 VNode，避免重复创建
const iconCache = {
  fileOpen: markRaw(SvgIconVNode({ localIcon: 'disk-file_open', fontSize: 16 })!),
  fileShare: markRaw(SvgIconVNode({ localIcon: 'disk-file_share', fontSize: 18 })!),
  fileDownload: markRaw(SvgIconVNode({ localIcon: 'disk-file_download', fontSize: 16 })!),
  fileRename: markRaw(SvgIconVNode({ localIcon: 'disk-file_rename', fontSize: 16 })!),
  fileCopy: markRaw(SvgIconVNode({ localIcon: 'disk-file_copy', fontSize: 22 })!),
  fileMove: markRaw(SvgIconVNode({ localIcon: 'disk-file_move', fontSize: 16 })!),
  fileDelete: markRaw(SvgIconVNode({ icon: 'iconamoon-trash', fontSize: 19, color: 'red' })!),
  fileProperty: markRaw(SvgIconVNode({ localIcon: 'disk-file_property', fontSize: 18 })!),
  folderOpen: markRaw(SvgIconVNode({ localIcon: 'disk-folder-open', fontSize: 26 })!),
  folderDownload: markRaw(SvgIconVNode({ localIcon: 'disk-file_download', fontSize: 16 })!),
  download: markRaw(SvgIconVNode({ localIcon: 'disk-file_download', fontSize: 16 })!),
  copy: markRaw(SvgIconVNode({ localIcon: 'disk-file_copy', fontSize: 22 })!),
  cut: markRaw(SvgIconVNode({ localIcon: 'cut', fontSize: 16 })!),
  delete: markRaw(SvgIconVNode({ icon: 'iconamoon-trash', fontSize: 19 })!),
  uploadFile: markRaw(SvgIconVNode({ localIcon: 'disk-upload_file', fontSize: 22 })!),
  uploadFolder: markRaw(SvgIconVNode({ localIcon: 'disk-upload_folder', fontSize: 20 })!),
  addFile: markRaw(SvgIconVNode({ localIcon: 'disk-create_file', fontSize: 20 })!),
  addFolder: markRaw(SvgIconVNode({ localIcon: 'disk-create_folder', fontSize: 23 })!),
  filePaste: markRaw(SvgIconVNode({ localIcon: 'disk-file_paste', fontSize: 22 })!),
  fileRefresh: markRaw(SvgIconVNode({ localIcon: 'disk-file_refresh', fontSize: 18 })!)
};

// 静态菜单选项（不包含动态内容）
const staticMenuOptions = markRaw({
  file: [
    {
      key: 'download',
      label: '下载',
      icon: iconCache.fileDownload
    },
    {
      key: 'share',
      label: '分享',
      icon: iconCache.fileShare
    },
    { type: 'divider' },
    {
      key: 'copy',
      label: '复制',
      icon: iconCache.fileCopy
    },
    {
      key: 'move',
      label: '移动',
      icon: iconCache.fileMove
    },
    {
      key: 'rename',
      label: '重命名',
      icon: iconCache.fileRename
    },

    { type: 'divider' },
    {
      key: 'delete',
      label: '删除',
      icon: iconCache.fileDelete,
      props: {
        style: 'color: red;'
      }
    },
    { type: 'divider' },
    {
      key: 'properties',
      label: '属性',
      icon: iconCache.fileProperty
    }
  ],
  folder: [
    {
      key: 'open',
      label: '打开',
      icon: iconCache.fileOpen
    },
    {
      key: 'download',
      label: '下载',
      icon: iconCache.folderDownload
    },
    {
      key: 'share',
      label: '分享',
      icon: iconCache.fileShare
    },
    { type: 'divider' },
    {
      key: 'copy',
      label: '复制',
      icon: iconCache.fileCopy
    },
    {
      key: 'move',
      label: '移动',
      icon: iconCache.fileMove
    },
    {
      key: 'rename',
      label: '重命名',
      icon: iconCache.fileRename
    },

    { type: 'divider' },
    {
      key: 'delete',
      label: '删除',
      icon: iconCache.fileDelete,
      props: {
        style: 'color: red;'
      }
    },
    { type: 'divider' },
    {
      key: 'properties',
      label: '属性',
      icon: iconCache.fileProperty
    }
  ],
  empty: [
    {
      key: 'upload-file',
      label: '上传文件',
      icon: iconCache.uploadFile
    },
    {
      key: 'upload-folder',
      label: '上传文件夹',
      icon: iconCache.uploadFolder
    },
    { type: 'divider' },
    {
      key: 'create-file',
      label: '新建文件',
      icon: iconCache.addFile
    },
    {
      key: 'create-folder',
      label: '新建文件夹',
      icon: iconCache.addFolder
    },
    { type: 'divider' },
    {
      key: 'paste',
      label: '粘贴',
      icon: iconCache.filePaste,
      disabled: true
    },
    { type: 'divider' },
    {
      key: 'refresh',
      label: '刷新',
      icon: iconCache.fileRefresh
    }
  ]
});

// 根据上下文类型计算菜单选项
const menuOptions = computed(() => {
  const { contextType, selectedFiles } = props;

  // 对于 multiple 类型，需要动态生成标签
  if (contextType === 'multiple') {
    const count = selectedFiles.length;
    return [
      {
        key: 'download',
        label: `下载 (${count}项)`,
        icon: iconCache.download
      },
      {
        key: 'share',
        label: `分享 (${count}项)`,
        icon: iconCache.fileShare
      },
      {
        key: 'copy',
        label: `复制 (${count}项)`,
        icon: iconCache.copy
      },
      {
        key: 'move',
        label: `移动 (${count}项)`,
        icon: iconCache.fileMove
      },
      { type: 'divider' },
      {
        key: 'delete',
        label: `删除 (${count}项)`,
        icon: iconCache.delete,
        props: {
          style: 'color: #e74c3c;'
        }
      }
    ];
  }

  // 对于其他类型，直接返回静态选项
  return staticMenuOptions[contextType as keyof typeof staticMenuOptions] || [];
});

// 处理菜单项点击
const handleMenuClick = (key: string) => {
  let targetFiles: Api.Disk.FileItem[] | null = [];
  if (props.contextType === 'multiple') {
    targetFiles = props.selectedFiles;
  } else if (props.targetFile) {
    targetFiles = [props.targetFile];
  }

  emit('action', key, targetFiles);
  emit('close');
};

// 处理点击外部关闭菜单
const handleClickOutside = () => {
  emit('close');
};
</script>

<template>
  <NDropdown
    :show="show"
    :options="menuOptions as MenuOption[]"
    :x="x"
    :y="y"
    placement="bottom-start"
    trigger="manual"
    @clickoutside="handleClickOutside"
    @select="handleMenuClick"
  />
</template>
