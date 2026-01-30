<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { addColorAlpha } from '@sa/color';
import Player from 'xgplayer';
import MusicPreset, { Lyric } from 'xgplayer-music';
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
const lyricContainerRef = ref<HTMLElement | null>(null);
const playerInstance = ref<any>(null);
const lyricInstance = ref<any>(null);

// Window State
const isFullscreen = ref(false);
const windowPos = reactive({ x: 0, y: 0 });
const windowSize = reactive({ width: 700, height: 500 });
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const isPlaying = ref(false);

const containerStyle = computed(() => {
  if (isMobile.value || isFullscreen.value) {
    return {};
  }
  return {
    top: `${windowPos.y}px`,
    left: `${windowPos.x}px`,
    width: `${windowSize.width}px`,
    height: `${windowSize.height}px`
  };
});

const songInfo = ref({
  name: '',
  singer: '',
  album: '',
  cover: ''
});

const footerStyle = computed(() => {
  const primary = themeStore.themeColors.primary;
  return {
    backgroundColor: addColorAlpha(primary, isDark.value ? 0.2 : 0.1),
    borderTopColor: addColorAlpha(primary, 0.3)
  };
});

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

    // Initialize Lyric
    const lyrics = ['[00:00.00] 暂无歌词\n[99:59.00] '];
    if (lyricContainerRef.value) {
      lyricInstance.value = new Lyric(lyrics, lyricContainerRef.value);
      lyricInstance.value.bind(playerInstance.value);
    }

    playerInstance.value.on('playing', () => {
      isPlaying.value = true;
      if (lyricInstance.value) lyricInstance.value.show();
      playerInstance.value.mode = 2;
    });

    playerInstance.value.on('pause', () => {
      isPlaying.value = false;
    });

    playerInstance.value.on('ended', () => {
      isPlaying.value = false;
    });
  } catch (err) {
    window.$message?.error(`初始化音频播放器失败：${err}`);
  }
}

function close() {
  diskStore.audioPreviewVisible = false;
  if (playerInstance.value) {
    playerInstance.value.destroy();
    playerInstance.value = null;
  }
  // Reset state
  isFullscreen.value = false;
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function centerWindow() {
  if (isMobile.value) return; // Mobile always full
  const width = Math.min(window.innerWidth * 0.9, 700);
  const height = Math.min(window.innerHeight * 0.9, 500);
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
      }
      playerInstance.value = null;
    }
  }
);

watch(isMobile, mobile => {
  if (mobile) {
    // Optionally auto fullscreen on mobile logic here if needed
  } else {
    centerWindow();
  }
});

onBeforeUnmount(() => {
  if (playerInstance.value) {
    playerInstance.value.destroy();
  }
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div
    v-if="diskStore.audioPreviewVisible"
    class="pointer-events-none fixed inset-0 z-2000 flex items-center justify-center"
  >
    <!-- Mask -->
    <div
      v-if="!isFullscreen && !isMobile"
      class="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-4px transition-opacity duration-300"
      @click="close"
    ></div>

    <!-- Window/Player -->
    <div
      class="pointer-events-auto flex flex-col overflow-hidden border border-white/8 bg-[#18181c] shadow-[0_12px_48px_rgba(0,0,0,0.5)] transition-[width,height,transform,border-radius] duration-300"
      :style="containerStyle as any"
      :class="[
        isMobile
          ? 'relative w-90% max-w-400px h-auto mx-auto rounded-16px transform-none'
          : isFullscreen
            ? 'absolute inset-0 w-full h-full rounded-0 transform-none'
            : 'absolute rounded-16px'
      ]"
    >
      <!-- Background Layer -->
      <div
        class="absolute z-0 h-120% w-120% bg-cover bg-center opacity-80 blur-[80px] brightness-50 -left-10% -top-10%"
        :style="{ backgroundImage: songInfo.cover ? `url(${songInfo.cover})` : undefined }"
      ></div>
      <div class="absolute inset-0 z-1 backdrop-blur-[60px]" :class="!isDark ? 'bg-white/60' : 'bg-[#0a0a0c]/40'"></div>

      <!-- Header / Drag Handle -->
      <div
        class="pointer-events-none absolute left-0 right-0 top-0 z-50 h-12 flex items-center justify-between px-4"
        @mousedown="startDrag"
      >
        <div class="flex items-center text-[13px] text-white tracking-[0.5px] opacity-60">
          <icon-mdi-music class="mr-2 text-primary" />
          <span>{{ songInfo.name || 'Audio Preview' }}</span>
        </div>
        <div class="pointer-events-auto ml-auto flex gap-2">
          <div
            v-if="!isMobile"
            class="h-8 w-8 flex cursor-pointer items-center justify-center rounded-full border-none backdrop-blur-4px transition-all duration-200 hover:scale-105"
            :class="[
              !isDark
                ? 'text-[#666] bg-black/5 hover:(text-[#333] bg-black/10)'
                : 'text-white/80 bg-white/10 hover:(text-white bg-white/20)'
            ]"
            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <icon-mdi-fullscreen-exit v-if="isFullscreen" />
            <icon-mdi-fullscreen v-else />
          </div>
          <div
            class="h-8 w-8 flex cursor-pointer items-center justify-center rounded-full border-none backdrop-blur-4px transition-all duration-200 hover:scale-105"
            :class="[
              !isDark
                ? 'text-[#666] bg-black/5 hover:bg-red-500/80 hover:text-white'
                : 'text-white/80 bg-white/10 hover:bg-red-500/80 hover:text-white'
            ]"
            title="关闭"
            @click="close"
          >
            <icon-mdi-close />
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div
        class="relative z-10 flex flex-1 gap-5 overflow-hidden p-[20px_20px_10px]"
        :class="isMobile ? 'flex-col p-[20px_16px_10px] gap-3 overflow-y-visible' : ''"
      >
        <!-- Top/Left: Info & Cover -->
        <div
          class="min-w-0 flex flex-col items-center justify-center text-center"
          :class="isMobile ? 'flex-[0_0_auto] flex-row text-left justify-start gap-4' : 'flex-[0_0_40%]'"
        >
          <div
            class="relative rounded-full"
            :class="
              isMobile
                ? 'w-[140px] h-[140px] mb-0 shadow-[0_6px_16px_rgba(0,0,0,0.3)] shrink-0'
                : 'w-60 h-60 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
            "
          >
            <div
              class="h-full w-full animate-[spin_20s_linear_infinite] overflow-hidden rounded-full bg-cover bg-center"
              :style="{
                backgroundImage: songInfo.cover ? `url(${songInfo.cover})` : undefined,
                animationPlayState: isPlaying ? 'running' : 'paused'
              }"
            >
              <div
                v-if="!songInfo.cover"
                class="h-full w-full flex items-center justify-center from-[#444] to-[#222] bg-gradient-to-br text-[#888]"
              >
                <icon-mdi-music class="text-6xl" />
              </div>
            </div>
          </div>

          <div class="w-full">
            <h2
              class="overflow-hidden text-ellipsis whitespace-nowrap font-bold"
              :class="[isMobile ? 'text-lg mb-1' : 'text-2xl mb-2', !isDark ? 'text-[#333]' : 'text-white']"
              :title="songInfo.name"
            >
              {{ songInfo.name }}
            </h2>
            <p
              class="mb-1"
              :class="[isMobile ? 'text-[13px]' : 'text-[15px]', !isDark ? 'text-[#666]' : 'text-white/60']"
            >
              {{ songInfo.singer }}
            </p>
            <p
              class="mb-1"
              :class="[isMobile ? 'text-[13px]' : 'text-[15px]', !isDark ? 'text-[#666]' : 'text-white/60']"
            >
              {{ songInfo.album }}
            </p>
          </div>
        </div>

        <!-- Center/Right: Lyrics & Visualizer Options -->
        <div v-if="!isMobile" class="relative h-full min-w-0 flex flex-col flex-1">
          <div
            class="[mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] relative flex-1 overflow-hidden"
          >
            <div
              id="gc"
              ref="lyricContainerRef"
              class="h-full w-full overflow-y-auto [&_.xgplayer-lyric-item]:(my-3 block scale-95 text-center text-[16px] leading-loose transition-all duration-400 ease-out) [&_.xgplayer-lyric-item-active]:(scale-100 text-[22px] font-bold)"
              :class="[
                !isDark
                  ? '[&_.xgplayer-lyric-item]:text-black/40 [&_.xgplayer-lyric-item-active]:(text-black drop-shadow-[0_0_20px_rgba(0,0,0,0.2)])'
                  : '[&_.xgplayer-lyric-item]:text-white/40 [&_.xgplayer-lyric-item-active]:(text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)])'
              ]"
            ></div>
          </div>
        </div>
      </div>

      <!-- Footer: Visualizer & Controls -->
      <div
        class="relative z-10 h-auto shrink-0 border-t backdrop-blur-10px"
        :class="[!isDark ? 'bg-white/20 border-black/5' : 'bg-black/20 border-white/5']"
        :style="footerStyle"
      >
        <div id="mse" ref="playerContainerRef" class="relative z-1 w-full"></div>
      </div>
    </div>
  </div>
</template>
