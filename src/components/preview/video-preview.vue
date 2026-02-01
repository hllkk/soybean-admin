<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import Artplayer from 'artplayer';
import { useDiskStore } from '@/store/modules/disk';
import { useAuthStore } from '@/store/modules/auth';
import { useThemeStore } from '@/store/modules/theme';
import { previewUrl } from '@/utils/file-config';

defineOptions({
  name: 'VideoPreview'
});

const diskStore = useDiskStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const breakpoints = useBreakpoints(breakpointsTailwind);

const isMobile = breakpoints.smaller('md');
const isDark = computed(() => themeStore.darkMode);

const artRef = ref<HTMLDivElement | null>(null);
const instance = ref<Artplayer | null>(null);

// Window dragging state
const windowPos = reactive({ x: 0, y: 0 });
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const windowSize = reactive({ width: 800, height: 450 }); // Default size

// Initialize window position to center
function centerWindow() {
  if (isMobile.value) return;
  const { innerWidth, innerHeight } = window;
  windowPos.x = (innerWidth - windowSize.width) / 2;
  windowPos.y = (innerHeight - windowSize.height) / 2;
}

// Drag logic
function startDrag(e: MouseEvent) {
  if (isMobile.value) return;
  // Only allow left click
  if (e.button !== 0) return;

  isDragging.value = true;
  dragOffset.x = e.clientX - windowPos.x;
  dragOffset.y = e.clientY - windowPos.y;

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;
  windowPos.x = e.clientX - dragOffset.x;
  windowPos.y = e.clientY - dragOffset.y;
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
}

const containerStyle = computed(() => {
  if (isMobile.value) {
    return {
      top: '0',
      left: '0',
      width: '100%',
      height: '100%'
    };
  }
  return {
    top: `${windowPos.y}px`,
    left: `${windowPos.x}px`,
    width: `${windowSize.width}px`,
    height: `${windowSize.height}px`
  };
});

async function initPlayer() {
  if (!diskStore.videoPreviewRow || !artRef.value) return;

  const file = diskStore.videoPreviewRow;

  try {
    if (instance.value) {
      instance.value.destroy(false);
      instance.value = null;
    }

    instance.value = new Artplayer({
      container: artRef.value,
      url: '',
      poster: file.mediaCover ? `${import.meta.env.VITE_APP_BASE_API}/view/cover?id=${file.id}` : '',
      autoplay: true, // 是否自动播放
      pip: true, // 是否在底部控制栏显示 画中画开关
      flip: true, // 是否显示视频翻转功能，目前只出现在 设置面板 和 右键菜单 里
      playbackRate: true, // 是否显示视频播放速度功能，会出现在 设置面板 和 右键菜单 里
      aspectRatio: true, // 是否显示视频长宽比功能，会出现在 设置面板 和 右键菜单 里
      screenshot: true, // 是否在底部控制栏里显示 视频截图功能
      setting: true, // 是否在底部控制栏内显示 设置面板开关按钮
      autoPlayback: true, // 是否使用自动 回放功能
      theme: '#23ade5', // 播放器主题颜色，目前用于 进度条 和 高亮元素 上
      hotkey: true, // 是否开启全局快捷键
      autoMini: true, // 当播放器滚动到浏览器视口以外时，自动进入 迷你播放 模式
      fullscreen: true, // 是否在底部控制栏里显示播放器 全屏 按钮
      fullscreenWeb: true // 是否在底部控制栏里显示播放器 网页全屏 按钮
    });
    if (isMobile.value) {
      // 这里可以去除controls中的各种不需要参数
    }

    const videoUrl = previewUrl(file, authStore.token);
    instance.value.url = videoUrl;
  } catch (err) {
    window.$message?.error(`初始化视频播放器失败：${err}`);
  }
}

function close() {
  diskStore.videoPreviewVisible = false;
  if (instance.value) {
    instance.value.destroy(false);
    instance.value = null;
  }
}

watch(
  () => diskStore.videoPreviewVisible,
  async visible => {
    if (visible) {
      centerWindow();
      await nextTick();
      initPlayer();
    } else if (instance.value) {
      instance.value.destroy(false);
      instance.value = null;
    }
  }
);

watch(isMobile, mobile => {
  if (!mobile) {
    centerWindow();
  }
});

onBeforeUnmount(() => {
  if (instance.value) {
    instance.value.destroy(false);
  }
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div v-if="diskStore.videoPreviewVisible" class="pointer-events-none fixed left-0 top-0 z-[2000] h-screen w-screen">
    <div
      class="pointer-events-auto absolute left-0 top-0 h-full w-full bg-black/60 backdrop-blur-[4px] transition-opacity duration-300"
      @click="close"
    ></div>

    <div
      class="group pointer-events-auto absolute z-[2001] block overflow-hidden bg-transparent transition-[width,height,top,left] duration-300"
      :class="[
        isMobile ? 'rounded-0 border-none' : 'rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.6)] border border-white/10'
      ]"
      :style="containerStyle"
    >
      <!-- Glassmorphism Background -->
      <div
        class="absolute inset-0 z-0 backdrop-blur-[20px]"
        :class="!isDark ? 'bg-white/90' : 'bg-[rgba(20,20,23,0.85)]'"
      ></div>

      <div
        class="absolute left-0 right-0 top-0 z-30 h-16 flex items-center justify-between from-black/70 to-transparent bg-gradient-to-b px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        :class="[isMobile ? 'cursor-default pointer-events-none' : 'cursor-move select-none']"
        @mousedown="startDrag"
      >
        <span
          class="max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap text-[15px] text-white/90 font-500 drop-shadow-md"
        >
          {{ diskStore.videoPreviewRow?.name || '视频预览' }}
        </span>
        <div
          class="h-8 w-8 flex cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/80 transition-all duration-200 hover:(rotate-90 bg-white/20 text-white)"
          :class="{ 'pointer-events-auto': isMobile }"
          @click.stop="close"
        >
          <icon-mdi-close class="text-[18px]" />
        </div>
      </div>
      <div class="absolute inset-0 z-10 h-full w-full bg-black">
        <div ref="artRef" class="h-full w-full"></div>
      </div>
    </div>
  </div>
</template>
