<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import Player from 'xgplayer';
import MusicPreset, { Analyze, Lyric } from 'xgplayer-music';
import 'xgplayer/dist/index.min.css';
import 'xgplayer-music/dist/index.min.css';
import { useDiskStore } from '@/store/modules/disk';
import { useThemeStore } from '@/store/modules/theme';
import { useAuthStore } from '@/store/modules/auth';
import { previewUrl } from '@/utils/file-config';

defineOptions({
  name: 'AudioPreview'
});

const authStore = useAuthStore();
const diskStore = useDiskStore();
const themeStore = useThemeStore();
const breakpoints = useBreakpoints(breakpointsTailwind);

const isMobile = breakpoints.smaller('md');
const isDark = computed(() => themeStore.darkMode);

const playerContainerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const lyricContainerRef = ref<HTMLElement | null>(null);
const playerInstance = ref<any>(null);
const analyzeInstance = ref<any>(null);
const lyricInstance = ref<any>(null);

// Window State
const isFullscreen = ref(false);
const windowPos = reactive({ x: 0, y: 0 });
const windowSize = reactive({ width: 900, height: 600 });
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });

const containerStyle = computed(() => {
  if (isMobile.value) {
    return {
      position: 'relative',
      width: '90%',
      maxWidth: '400px',
      height: 'auto',
      borderRadius: '16px',
      transform: 'none',
      margin: '0 auto'
    };
  }
  if (isFullscreen.value) {
    return {
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      borderRadius: '0',
      transform: 'none'
    };
  }
  return {
    position: 'absolute',
    top: `${windowPos.y}px`,
    left: `${windowPos.x}px`,
    width: `${windowSize.width}px`,
    height: `${windowSize.height}px`,
    borderRadius: '16px'
  };
});

const analyzeMode = ref('waves');
const analyzeOptions = [
  { label: '波形 (Waves)', value: 'waves' },
  { label: '柱状 (Bars)', value: 'bars' },
  { label: '闪电 (Lightning)', value: 'lightning' },
  { label: '竖线 (VertLines)', value: 'vertLines' },
  { label: '双线 (DoubleLine)', value: 'doubleLine' },
  { label: '双柱 (DoubleBars)', value: 'doubleBars' }
];

const songInfo = ref({
  name: '',
  singer: '',
  album: '',
  cover: ''
});

function handleModeChange(value: string) {
  analyzeMode.value = value;
  if (analyzeInstance.value) {
    analyzeInstance.value.mode = value;
    if (value === 'lightning') {
      analyzeInstance.value.options.count = 512;
      analyzeInstance.value.options.stroke = 4;
    } else {
      if (value === 'waves') {
        analyzeInstance.value.options.stroke = 3;
      } else {
        analyzeInstance.value.options.stroke = 2;
      }
      analyzeInstance.value.options.count = 256;
    }
  }
}

async function initPlayer() {
  if (!diskStore.audioPreviewRow || !playerContainerRef.value) return;

  const file = diskStore.audioPreviewRow;

  // Update info
  songInfo.value = {
    name: file.music?.songName || file.name,
    singer: file.music?.singer || '未知歌手',
    album: file.music?.album || '未知专辑',
    cover: file.mediaCover ? `${import.meta.env.VITE_APP_BASE_API}/view/cover?id=${file.id}` : ''
  };

  try {
    const audioUrl = previewUrl(file, authStore.token);

    // Destroy previous instance if exists
    if (playerInstance.value) {
      playerInstance.value.destroy();
      playerInstance.value = null;
    }

    // Initialize Player
    playerInstance.value = new Player({
      el: playerContainerRef.value,
      url: audioUrl,
      volume: 0.8,
      width: '100%',
      height: 50,
      mediaType: 'audio',
      presets: ['default', MusicPreset],
      music: {
        list: [
          {
            title: songInfo.value.name,
            name: songInfo.value.name,
            singer: songInfo.value.singer,
            poster: songInfo.value.cover,
            cover: songInfo.value.cover,
            src: audioUrl,
            url: audioUrl,
            vid: file.id
          }
        ]
      },
      ignores: ['playbackrate'],
      controls: {
        initShow: true,
        mode: 'flex'
      },
      marginControls: true,
      videoConfig: {
        crossOrigin: 'anonymous'
      },
      crossOrigin: 'anonymous'
    });

    // Initialize Analyze
    if (canvasRef.value) {
      // Set canvas width/height
      canvasRef.value.width = canvasRef.value.parentElement?.clientWidth || window.innerWidth;
      canvasRef.value.height = 80;

      analyzeInstance.value = new Analyze(playerInstance.value, canvasRef.value, {
        bgColor: 'rgba(0,0,0,0)',
        stroke: 3
      });
      handleModeChange(analyzeMode.value);
    }

    // Initialize Lyric
    const lyrics = ['[00:00.00] 暂无歌词\n[99:59.00] '];
    if (lyricContainerRef.value) {
      lyricInstance.value = new Lyric(lyrics, lyricContainerRef.value);
      lyricInstance.value.bind(playerInstance.value);
    }

    playerInstance.value.on('playing', () => {
      if (lyricInstance.value) lyricInstance.value.show();
      playerInstance.value.mode = 2;
    });

    // Resize handler for canvas
    window.addEventListener('resize', handleResize);
  } catch (err) {
    window.$message?.error(`初始化音频播放器失败：${err}`);
  }
}

function handleResize() {
  if (canvasRef.value) {
    canvasRef.value.width = canvasRef.value.parentElement?.clientWidth || window.innerWidth;
  }
}

function close() {
  diskStore.audioPreviewVisible = false;
  if (playerInstance.value) {
    playerInstance.value.destroy();
    playerInstance.value = null;
  }
  window.removeEventListener('resize', handleResize);
  // Reset state
  isFullscreen.value = false;
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  nextTick(() => handleResize());
}

function centerWindow() {
  if (isMobile.value) return; // Mobile always full
  const width = Math.min(window.innerWidth * 0.9, 900);
  const height = Math.min(window.innerHeight * 0.9, 600);
  windowSize.width = width;
  windowSize.height = height;
  windowPos.x = (window.innerWidth - width) / 2;
  windowPos.y = (window.innerHeight - height) / 2;
}

function startDrag(e: MouseEvent) {
  if (isFullscreen.value || isMobile.value) return;
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

watch(
  () => diskStore.audioPreviewVisible,
  async visible => {
    if (visible) {
      centerWindow();
      await nextTick();
      initPlayer();
    } else {
      if (playerInstance.value) {
        playerInstance.value.destroy();
        playerInstance.value = null;
      }
      window.removeEventListener('resize', handleResize);
    }
  }
);

watch(isMobile, mobile => {
  if (mobile) {
    // Optionally auto fullscreen on mobile logic here if needed
  } else {
    centerWindow();
  }
  nextTick(() => handleResize());
});

onBeforeUnmount(() => {
  if (playerInstance.value) {
    playerInstance.value.destroy();
  }
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div v-if="diskStore.audioPreviewVisible" class="audio-preview-container">
    <!-- Mask -->
    <div v-if="!isFullscreen && !isMobile" class="modal-mask" @click="close"></div>

    <!-- Window/Player -->
    <div
      class="audio-preview-window"
      :style="containerStyle as any"
      :class="{ 'is-fullscreen': isFullscreen, 'is-mobile': isMobile, 'light-theme': !isDark }"
    >
      class="audio-preview-window" :style="containerStyle" :class="{ 'is-fullscreen': isFullscreen, 'is-mobile':
      isMobile, 'light-theme': !isDark }" >
      <!-- Background Layer -->
      <div class="window-bg" :style="{ backgroundImage: songInfo.cover ? `url(${songInfo.cover})` : undefined }"></div>
      <div class="window-bg-backdrop"></div>

      <!-- Header / Drag Handle -->
      <div class="window-header" @mousedown="startDrag">
        <div class="header-info">
          <icon-mdi-music class="mr-2 text-primary" />
          <span class="header-title">{{ songInfo.name || 'Audio Preview' }}</span>
        </div>
        <div class="header-controls">
          <div
            v-if="!isMobile"
            class="control-btn"
            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <icon-mdi-fullscreen-exit v-if="isFullscreen" />
            <icon-mdi-fullscreen v-else />
          </div>
          <div class="control-btn close-btn" title="关闭" @click="close">
            <icon-mdi-close />
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Top/Left: Info & Cover -->
        <div class="info-section">
          <div class="album-cover-wrapper">
            <div
              class="album-cover"
              :class="{ 'animate-spin-slow': playerInstance && playerInstance.isPlaying }"
              :style="{ backgroundImage: songInfo.cover ? `url(${songInfo.cover})` : undefined }"
            >
              <div v-if="!songInfo.cover" class="no-cover">
                <icon-mdi-music class="text-6xl" />
              </div>
            </div>
          </div>

          <div class="song-details">
            <h2 class="song-name" :title="songInfo.name">{{ songInfo.name }}</h2>
            <p class="artist-name">{{ songInfo.singer }}</p>
            <p class="album-name">{{ songInfo.album }}</p>
          </div>
        </div>

        <!-- Center/Right: Lyrics & Visualizer Options -->
        <div v-if="!isMobile" class="lyric-section">
          <div class="visualizer-select">
            <select :value="analyzeMode" @change="e => handleModeChange((e.target as HTMLSelectElement).value)">
              <option v-for="opt in analyzeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="lyric-wrapper">
            <div id="gc" ref="lyricContainerRef"></div>
            <!-- Gradient Masks for Lyrics -->
            <div class="lyric-mask-top"></div>
            <div class="lyric-mask-bottom"></div>
          </div>
        </div>
      </div>

      <!-- Footer: Visualizer & Controls -->
      <div class="footer-section">
        <div class="canvas-wrapper">
          <canvas ref="canvasRef"></canvas>
        </div>
        <div id="mse" ref="playerContainerRef" class="player-controls"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-preview-container {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  pointer-events: auto;
  transition: opacity 0.3s;
}

.audio-preview-window {
  position: relative; /* Default for mobile/flex centering */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #18181c;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  transition:
    width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    transform 0.3s,
    border-radius 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Glassmorphism Backgrounds */
.window-bg {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-size: cover;
  background-position: center;
  filter: blur(80px) brightness(0.5);
  z-index: 0;
  opacity: 0.8;
}

.window-bg-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 12, 0.4); /* Lighter mask */
  backdrop-filter: blur(60px);
  z-index: 1;
}

.light-theme .window-bg-backdrop {
  background: rgba(255, 255, 255, 0.6);
}

/* Window Header */
.window-header {
  position: absolute; /* Floating header */
  top: 0;
  left: 0;
  right: 0;
  height: 48px; /* Reduced height */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 50; /* Topmost */
  /* Remove background to be fully transparent/floating */
  pointer-events: none; /* Allow clicks to pass through empty areas */
}

.header-info {
  display: flex;
  align-items: center;
  color: white;
  font-size: 13px;
  letter-spacing: 0.5px;
  opacity: 0.6;
}

.header-controls {
  pointer-events: auto; /* Re-enable clicks for buttons */
  display: flex;
  gap: 8px;
  margin-left: auto; /* Push to right */
}

.control-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: scale(1.05);
}

.control-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.8); /* Red for close */
}

.light-theme .control-btn {
  color: #666;
  background: rgba(0, 0, 0, 0.05);
}
.light-theme .control-btn:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.1);
}

/* Main Content Layout */
.main-content {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px 20px 10px; /* Reduced bottom padding */
  gap: 20px;
}

.is-mobile .main-content {
  flex-direction: column;
  padding: 20px 16px 10px; /* Reduced vertical padding */
  gap: 12px;
  overflow-y: visible; /* Changed from auto to visible for compact card */
}

/* Info Section (Left/Top) */
.info-section {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
}

.is-mobile .info-section {
  flex: 0 0 auto;
  flex-direction: row;
  text-align: left;
  justify-content: flex-start;
  gap: 16px;
}

.album-cover-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.is-mobile .album-cover-wrapper {
  width: 140px;
  height: 140px;
  margin-bottom: 0;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.album-cover {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.no-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #444, #222);
  color: #888;
}

.song-details {
  width: 100%;
}

.song-name {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-name,
.album-name {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.light-theme .song-name {
  color: #333;
}
.light-theme .artist-name,
.light-theme .album-name {
  color: #666;
}

.is-mobile .song-name {
  font-size: 18px;
  margin-bottom: 4px;
}
.is-mobile .artist-name,
.is-mobile .album-name {
  font-size: 13px;
}

/* Lyric Section (Right/Center) */
.lyric-section {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.is-mobile .lyric-section {
  flex: 1;
  height: auto;
  min-height: 200px;
}

.visualizer-select {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 20;
}

.is-mobile .visualizer-select {
  top: -40px; /* Move slightly up on mobile or hide if needed */
  right: 0;
}

select {
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  backdrop-filter: blur(4px);
}
.light-theme select {
  background: rgba(255, 255, 255, 0.5);
  color: #333;
  border-color: rgba(0, 0, 0, 0.1);
}

.lyric-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
}

#gc {
  height: 100%;
  width: 100%;
  overflow-y: auto; /* Allow scroll if needed manually, though xgplayer handles it */
  scrollbar-width: none;
}
#gc::-webkit-scrollbar {
  display: none;
}

/* Deep selector for lyrics */
:deep(.xgplayer-lyric-item) {
  display: block;
  text-align: center;
  line-height: 2;
  font-size: 16px !important;
  color: rgba(255, 255, 255, 0.4) !important;
  margin: 12px 0;
  transition: all 0.4s ease-out;
  transform: scale(0.95);
}

:deep(.xgplayer-lyric-item-active) {
  color: #fff !important;
  font-size: 22px !important;
  font-weight: 700;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  transform: scale(1);
}

.light-theme :deep(.xgplayer-lyric-item) {
  color: rgba(0, 0, 0, 0.4) !important;
}
.light-theme :deep(.xgplayer-lyric-item-active) {
  color: #000 !important;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.is-mobile :deep(.xgplayer-lyric-item) {
  font-size: 14px !important;
  margin: 8px 0;
}
.is-mobile :deep(.xgplayer-lyric-item-active) {
  font-size: 18px !important;
}

/* Footer Section */
.footer-section {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  height: auto;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.light-theme .footer-section {
  background: rgba(255, 255, 255, 0.2);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.canvas-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.6;
  pointer-events: none;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.player-controls {
  position: relative;
  z-index: 1;
  width: 100%;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin 20s linear infinite;
}
</style>
