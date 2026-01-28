<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import Artplayer from 'artplayer';
import { fetchIsAllowDownload } from '@/service/api/disk/list';
import { useDiskStore } from '@/store/modules/disk';
import { useAuthStore } from '@/store/modules/auth';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'VideoPreview'
});

const diskStore = useDiskStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const breakpoints = useBreakpoints(breakpointsTailwind);

const isMobile = breakpoints.smaller('md');
const isDark = computed(() => themeStore.darkMode);

const artRef = ref<HTMLElement | null>(null);
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
    const { data: downloadInfo, error } = await fetchIsAllowDownload({
      fileIds: [file.id],
      userId: authStore.userInfo.userId
    });

    if (error || !downloadInfo?.allowDownload) {
      window.$message?.error('无法获取视频地址');
      return;
    }

    let videoUrl = '';
    if (downloadInfo.isRedirect && downloadInfo.redirectUrl) {
      videoUrl = downloadInfo.redirectUrl;
    } else {
      videoUrl = `${downloadInfo.downloadUrl}`;
    }

    if (instance.value) {
      instance.value.destroy(false);
      instance.value = null;
    }

    instance.value = new Artplayer({
      container: artRef.value,
      url: videoUrl,
      title: file.name,
      poster: file.mediaCover ? `${import.meta.env.VITE_APP_BASE_API}/view/cover?id=${file.id}` : '',
      volume: 0.5,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false, // Handle size manually
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#23ade5',
      lang: 'zh-cn',
      moreVideoAttr: {
        crossOrigin: 'anonymous'
      }
    });
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
  <div v-if="diskStore.videoPreviewVisible" class="video-preview-container">
    <div class="modal-mask" @click="close"></div>

    <div class="video-window" :style="containerStyle" :class="{ 'is-mobile': isMobile, 'light-theme': !isDark }">
      <!-- Glassmorphism Background -->
      <div class="window-bg-backdrop"></div>

      <div class="window-header" @mousedown="startDrag">
        <span class="window-title">{{ diskStore.videoPreviewRow?.name || '视频预览' }}</span>
        <div class="close-btn" @click.stop="close">
          <icon-mdi-close class="text-18px" />
        </div>
      </div>
      <div class="window-content">
        <div ref="artRef" class="artplayer-app"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-preview-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  pointer-events: none;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  pointer-events: auto;
  transition: opacity 0.3s;
}

.video-window {
  position: absolute;
  background: transparent;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  z-index: 2001;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition:
    width 0.3s,
    height 0.3s,
    top 0.3s,
    left 0.3s;
}

.window-bg-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 20, 23, 0.85);
  backdrop-filter: blur(20px);
  z-index: 0;
}

.light-theme .window-bg-backdrop {
  background: rgba(255, 255, 255, 0.9);
}

.window-header {
  position: relative;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: move;
  user-select: none;
  z-index: 10;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.light-theme .window-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.window-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.light-theme .window-title {
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  color: white;
  transform: rotate(90deg);
}

.light-theme .close-btn {
  color: #666;
  background: rgba(0, 0, 0, 0.05);
}

.light-theme .close-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  color: white;
}

.window-content {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: #000;
}

.artplayer-app {
  width: 100%;
  height: 100%;
}

/* Mobile Styles */
.is-mobile {
  border-radius: 0;
  border: none;
}

.is-mobile .window-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  border-bottom: none;
  cursor: default;
  pointer-events: none; /* Allow clicks to pass through to player mostly */
  z-index: 20;
}

.is-mobile .window-title {
  display: none; /* Clean look on mobile */
}

.is-mobile .close-btn {
  pointer-events: auto;
  margin-left: auto; /* Align right */
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.5);
}

.is-mobile .window-content {
  height: 100%;
}
</style>
