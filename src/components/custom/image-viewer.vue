<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { component as Viewer } from 'v-viewer';
import 'viewerjs/dist/viewer.css';
import { useDiskStore } from '@/store/modules/disk';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({
  name: 'ImageViewer'
});

// 定义 Viewer 实例接口
interface ViewerInstance {
  index: number;
  show: () => void;
  hide: () => void;
  view: (index: number) => void;
  next: () => void;
  prev: () => void;
}

interface ImageData {
  thumbnail: string;
  source: string;
  title?: string;
}

const images = ref<ImageData[]>([]);
const diskStore = useDiskStore();
const appStore = useAppStore();
const authStore = useAuthStore();

const isPC = computed(() => !appStore.isMobile);
const { fileList, imagePreviewVisible, imagePreviewRow } = storeToRefs(diskStore);

const viewerInstance = ref<ViewerInstance | null>(null);
const pendingIndex = ref<number | null>(null);
// 缩略图和原图 URL 配置
const baseApi = import.meta.env.VITE_APP_BASE_API || '';
const imageThumbnailUrl = `${baseApi}/view/thumbnail`;
// const shareImageThumbnailUrl = `${baseApi}/public/s/view/thumbnail`;
const publicImageThumbnailUrl = `${baseApi}/public/s/view/thumbnail`;

// Viewer 配置选项
const options = computed(() => ({
  url: 'data-src',
  initialViewIndex: 0,
  hidden: () => {
    diskStore.imagePreviewVisible = false;
    diskStore.imagePreviewRow = null;
  }
}));

// 判断是否为图片文件
const isImageFile = (file: Api.Disk.FileItem): boolean => {
  return !file.isDir && file.contentType?.startsWith('image') === true;
};

// 获取原图 URL
const getImageUrl = (file: Api.Disk.FileItem): string => {
  const path = encodeURIComponent(file.filePath || '');
  const name = encodeURIComponent(file.name);

  // if (props.shareId) {
  //   // 分享链接的图片
  //   return `${baseApi}/public/s/preview/${name}?fileId=${file.id}&shareId=${props.shareId}&shareToken=${shareToken.value || 'none'}`
  // }

  // 普通用户的图片
  if (authStore.token) {
    return `${baseApi}/file/${file.userId}${path}${name}?token=${authStore.token}`;
  }

  // 公开分享的图片
  return `${baseApi}/share-file/${file.id}/${name}`;
};

// 获取缩略图 URL
const getImageThumbnailUrl = (file: Api.Disk.FileItem): string => {
  if (authStore.token) {
    return `${imageThumbnailUrl}?id=${file.id}`;
  }

  // if (shareToken.value) {
  //   return `${shareImageThumbnailUrl}/${encodeURIComponent(file.name)}?share-token=${shareToken.value}&id=${file.id}`
  // }

  return `${publicImageThumbnailUrl}/${encodeURIComponent(file.name)}?id=${file.id}`;
};

// 初始化图片列表
const initImages = (): number => {
  // 清空现有图片列表，防止重复添加
  images.value = [];

  // 从 fileList 中过滤出图片文件
  const imageFiles = fileList.value.filter(isImageFile);

  let targetIndex = 0;

  imageFiles.forEach((file, index) => {
    images.value.push({
      thumbnail: getImageThumbnailUrl(file),
      source: getImageUrl(file),
      title: file.name
    });

    // 找到当前选中图片的索引
    if (imagePreviewRow.value && file.id === imagePreviewRow.value.id) {
      targetIndex = index;
    }
  });

  return targetIndex;
};

const handleInited = (viewer: ViewerInstance): void => {
  viewerInstance.value = viewer;

  if (pendingIndex.value === null || !imagePreviewVisible.value || !isPC.value) return;

  viewer.view(pendingIndex.value);
  viewer.show();
  pendingIndex.value = null;
};

// 显示图片查看器
const showImageViewer = (index: number): void => {
  if (!isPC.value || !viewerInstance.value) return;

  viewerInstance.value.view(index);
  viewerInstance.value.show();
};

// 监听 imagePreviewVisible 变化
watch(imagePreviewVisible, async (visible: boolean) => {
  if (!isPC.value) return;

  if (visible) {
    const targetIndex = initImages();
    pendingIndex.value = targetIndex;
    await nextTick();
    showImageViewer(targetIndex);
  } else if (viewerInstance.value) {
    viewerInstance.value.hide();
  }
});
</script>

<template>
  <Viewer
    v-show="isPC"
    :options="options"
    :images="images"
    rebuild
    class="position-fixed left-[-9999px] top-[-9999px] h-1px w-1px overflow-hidden"
    @inited="handleInited"
  >
    <template #default>
      <img
        v-for="(src, index) in images"
        :key="index"
        :src="src.thumbnail"
        :data-src="src.source"
        :alt="src.title || ''"
      />
    </template>
  </Viewer>
</template>
