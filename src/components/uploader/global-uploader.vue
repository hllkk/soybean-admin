<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { UploaderInst } from 'vue-simple-uploader';
import VueSimpleUploader from 'vue-simple-uploader';
import { useDiskStore } from '@/store/modules/disk';
// const { Uploader, UploaderBtn, UploaderDrop, UploaderList, UploaderUnsupport } = VueSimpleUploader;
const { Uploader, UploaderBtn, UploaderDrop, UploaderUnsupport } = VueSimpleUploader;
defineOptions({
  name: 'GlobalUploader'
});

const diskStore = useDiskStore();

const uploaderRef = ref<UploaderInst | null>(null);
const dragover = ref(false); // 是否是拖拽进入
const isDragStart = ref(false); // 是否是拖拽开始
const enableDragUpload = ref(true);
const fileListScrollTop = ref(0);
const dragoverLoop = ref<number | null>(null);

const uploaderOptions = {
  target: '/api/upload',
  headers: {
    Authorization: 'Bearer '
  }
};

const statusText = {
  success: '上传成功',
  error: '上传失败',
  uploading: '上传中',
  paused: '暂停上传',
  waiting: '等待上传'
};

// 限制上传文件的类型
const attrs = {
  accept: '*'
};

// 拖拽开始时
function handleDragstart(e: DragEvent) {
  const target = e.target as HTMLElement;
  // 检查是否有可排序的元素
  if (target.closest('.sortable-chosen')) {
    diskStore.setUploadDragEnabled(false);
    return;
  }

  // 检查是否是可拖拽的文件元素
  const isDraggableFile = target.dataset.draggableFile === 'true';

  if (enableDragUpload.value && diskStore.isDragUploadEnabled) {
    if (isDraggableFile) {
      isDragStart.value = true;
    }
    // 如果不是可拖拽文件或滚动位置不在顶部，阻止默认拖拽行为
    if (!isDraggableFile || fileListScrollTop.value !== 0) {
      e.preventDefault();
    }
  }
}

// 拖拽进入页面时
function handleDragenter(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  dragover.value = true;
}

// 拖拽悬停在页面上时
function handleDragover(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();

  if (dragoverLoop.value) {
    clearInterval(dragoverLoop.value);
  }
  if (!isDragStart.value) {
    dragover.value = true;
  }

  dragoverLoop.value = window.setInterval(() => {
    dragover.value = false;
  }, 100);
}

// 拖拽释放到页面上时
function handleDrop(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  dragover.value = false;
}

// 初始化上传组件
function initUploader() {
  nextTick(() => {
    if (uploaderRef.value) {
      // 使用更安全的方式设置全局uploader引用
      if (typeof window !== 'undefined') {
        window.uploader = uploaderRef.value.uploader;
      }
    }
  });
}

onMounted(() => {
  // 检查当前路径是否支持拖拽
  diskStore.setUploadDragEnabled(true);

  const dropbox = document.body; // 3. 添加拖拽事件监听器
  dropbox.addEventListener('dragstart', handleDragstart); // 拖拽开始
  dropbox.addEventListener('dragenter', handleDragenter, false); // 拖拽进入页面
  dropbox.addEventListener('dragover', handleDragover, false); // 拖拽悬停在页面上
  dropbox.addEventListener('drop', handleDrop, false); // 拖拽释放到页面上

  // 初始化上传组件
  initUploader();
});

onUnmounted(() => {
  // 清理事件监听器，防止内存泄漏
  const dropbox = document.body;
  dropbox.removeEventListener('dragstart', handleDragstart); // 拖拽开始
  dropbox.removeEventListener('dragenter', handleDragenter);
  dropbox.removeEventListener('dragover', handleDragover);
  dropbox.removeEventListener('drop', handleDrop);
});
</script>

<template>
  <div class="fixed bottom-15px right-15px z-1002">
    <Uploader ref="uploaderRef" :auto-start="false" :options="uploaderOptions" :file-status-text="statusText">
      <UploaderUnsupport>您的浏览器不支持上传组件</UploaderUnsupport>
      <!-- 上传区域-->
      <UploaderDrop v-if="dragover && enableDragUpload" class="left-0 top-0 size-full text-center" @drop="handleDrop">
        <span class="relative top-48% text-[34px] text-[#00000099] font-bold">上传文件到当前目录下</span>
      </UploaderDrop>
      <UploaderBtn id="global-uploader-btn-file" :attrs="attrs">选择文件</UploaderBtn>
      <UploaderBtn id="global-uploader-btn-folder" :directory="true">选择文件夹</UploaderBtn>
    </Uploader>
  </div>
</template>

<style scoped>
#global-uploader-btn-file {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}

#global-uploader-btn-folder {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}
.uploader-drop {
  position: fixed;
  background-color: #ffffff99;
  border: 3px dashed #00000099;
}
</style>
