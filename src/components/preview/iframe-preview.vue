<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDiskStore } from '@/store/modules/disk';
import { useAuthStore } from '@/store/modules/auth';
// import { useThemeStore } from '@/store/modules/theme';
// import { useAppStore } from '@/store/modules/app';
import { previewUrl } from '../../utils/file-config';
import PDFPreview from './pdf-preview.vue';

defineOptions({
  name: 'IframePreview'
});

const diskStore = useDiskStore();
const authStore = useAuthStore();
// const appStore = useAppStore();
// const themeStore = useThemeStore();
const { iframePreviewVisible, iframePreviewRow } = storeToRefs(diskStore);

const fileUrl = ref('');
const show = ref(false);
const readonly = ref(true);
const saved = ref(true);

// const isPC = computed(() => !appStore.isMobile);
const previewType = computed(() => getType(iframePreviewRow.value?.extendName ?? ''));

function checkReadOnly() {
  if (authStore.token && authStore.userInfo.userId === iframePreviewRow.value?.userId) {
    readonly.value = false;
  }
  // 这里预留操作权限检查逻辑
  if (iframePreviewRow.value) {
    fileUrl.value = window.location.origin + previewUrl(iframePreviewRow.value, authStore.token);
  }

  if (readonly.value) {
    fileUrl.value += '&readonly=1';
  }
}

function close() {
  if (!saved.value) {
    window.$dialog?.info({
      title: '确认信息',
      content: '是否在关闭前保存修改?',
      negativeText: '放弃修改',
      positiveText: '保存',
      onPositiveClick: () => {},
      onNegativeClick: () => {
        handleClose();
      }
    });
  } else {
    handleClose();
  }
}

function handleClose() {
  show.value = false;
  iframePreviewVisible.value = false;
}

function getType(suffix: string) {
  if (iframePreviewRow.value?.contentType?.includes('office')) {
    return 'office';
  }

  switch (suffix) {
    case 'drawio':
      return 'drawio';
    case 'excalidraw':
      return 'excalidraw';
    case 'pdf':
      return 'pdf';
    case 'mind':
      return 'mind';
    case 'gltf':
    case 'glb':
      return 'glTF/GLB';
    case 'stl':
    case '3mf':
    case 'amf':
    case 'obj':
      return 'threeModelPreview';
    case 'office':
    case 'csv':
      return 'office';
    case 'xls':
      return 'office';
    case 'dwg':
      return 'cad';
    default:
      return 'other';
  }
}

watch(iframePreviewVisible, visible => {
  if (visible) {
    show.value = true;
    checkReadOnly();
  } else {
    show.value = false;
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9999] flex flex-col bg-gray-50 dark:bg-[#101014]">
      <!-- 顶部工具栏 -->
      <div
        class="relative h-10 flex items-center border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-[#18181c]"
      >
        <!-- 标题居中 -->
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span class="text-sm text-gray-900 font-medium dark:text-gray-100">{{ iframePreviewRow?.name }}</span>
        </div>

        <!-- 右侧关闭按钮 -->
        <div class="z-10 ml-auto">
          <div
            class="h-8 w-8 flex cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            @click="close"
          >
            <icon-mdi-close class="text-xl" />
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="relative flex-1 overflow-hidden bg-white dark:bg-black">
        <!-- Loading 状态 -->
        <!--
 <div
          v-if="previewType !== 'other'"
          class="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-[#18181c]"
        >
          <NSpin size="large" :style="{ color: themeStore.themeColors.primary }" />
        </div>
-->

        <!-- PDF Viewer -->
        <PDFPreview
          v-if="previewType === 'pdf'"
          :key="fileUrl"
          :file-url="fileUrl"
          :file-name="iframePreviewRow?.name"
          @close="close"
        />

        <!-- OnlyOffice Viewer -->
        <OnlyOfficePreview
          v-else-if="previewType === 'office'"
          :file-url="fileUrl"
          :file="iframePreviewRow!"
          @close="close"
        />

        <!-- 通用 Iframe 预览 -->
        <!--
 <iframe
          v-else-if="['code', 'office', 'other'].includes(previewType)"
          :src="iframeSrc"
          class="h-full w-full border-none"
          @load="onIframeLoad"
        ></iframe>
-->

        <!-- 专门的 CAD 预览占位 -->
        <div
          v-else-if="previewType === 'cad'"
          class="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"
        >
          <icon-mdi-file-cad class="mb-4 text-6xl" />
          <p>暂不支持 CAD 文件预览</p>
          <p class="mt-2 text-sm">请下载后查看</p>
        </div>

        <!-- 专门的 Drawio 预览占位 -->
        <div
          v-else-if="previewType === 'drawio'"
          class="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"
        >
          <icon-mdi-draw class="mb-4 text-6xl" />
          <p>暂不支持 Draw.io 文件预览</p>
        </div>

        <!-- 未知类型 -->
        <div
          v-else
          class="h-full flex flex-col select-none items-center justify-center text-gray-500 dark:text-gray-400"
        >
          <icon-mdi-file-question class="mb-4 text-6xl" />
          <p>{{ iframePreviewRow }} 文件类型暂不支持预览</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
