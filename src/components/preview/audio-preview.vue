<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

defineOptions({
  name: 'AudioPreview'
});

interface PlaylistItem {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  src: string;
  duration?: number;
  /** LRC格式歌词字符串 */
  lyrics?: string;
}

interface Props {
  /** 播放列表 */
  playlist?: PlaylistItem[];
  /** 初始播放索引 */
  initialIndex?: number;
  /** 是否自动播放 */
  autoPlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  playlist: () => [],
  initialIndex: 0,
  autoPlay: true
});

interface Emits {
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'ended'): void;
  (e: 'timeupdate', time: number): void;
  (e: 'trackChange', track: PlaylistItem): void;
}

const emit = defineEmits<Emits>();

// 状态
const audioRef = ref<HTMLAudioElement>();
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const currentTrackIndex = ref(0);
const isDraggingProgress = ref(false);
const volume = ref(80);
const showVolumeSlider = ref(false);

// 播放模式：single(单曲循环)、loop(列表循环)、random(随机播放)
type PlayMode = 'single' | 'loop' | 'random';
const playMode = ref<PlayMode>('loop');
const showModeTip = ref(false);
const playModes: { mode: PlayMode; icon: string; label: string }[] = [
  { mode: 'single', icon: 'mdi:repeat-once', label: '单曲循环' },
  { mode: 'loop', icon: 'mdi:repeat', label: '列表循环' },
  { mode: 'random', icon: 'mdi:shuffle', label: '随机播放' }
];

// 律动条数据 - 32个频率段，使用模拟动画
const frequencyData = ref<number[]>(Array(32).fill(0));
let pulseInterval: ReturnType<typeof setInterval> | null = null;

// 用于跟踪和清理 canplaythrough 事件监听器
let currentPlayHandler: (() => void) | null = null;

// 歌词解析相关
interface LyricLine {
  time: number; // 秒
  text: string;
}

const parsedLyrics = ref<LyricLine[]>([]);
const currentLyricIndex = ref(-1);
const lyricsContainerRef = ref<HTMLDivElement>();

// 进度百分比
const progressPercent = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// 当前曲目信息
const currentTrack = computed(() => {
  if (props.playlist.length > 0 && currentTrackIndex.value < props.playlist.length) {
    return props.playlist[currentTrackIndex.value];
  }
  return {
    id: 'empty',
    title: '暂无音频',
    artist: '',
    album: '',
    cover: '',
    src: '',
    lyrics: ''
  };
});

// 是否有歌词
const hasLyrics = computed(() => parsedLyrics.value.length > 0);

// 解析LRC歌词
function parseLyrics(lrcText: string): LyricLine[] {
  if (!lrcText) return [];

  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match;

  while ((match = regex.exec(lrcText)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3], 10);
    const text = match[4].trim();

    if (text) {
      const time = minutes * 60 + seconds + milliseconds / 1000;
      lines.push({ time, text });
    }
  }

  // 按时间排序
  return lines.sort((a, b) => a.time - b.time);
}

// 更新当前歌词索引
function updateCurrentLyric() {
  if (parsedLyrics.value.length === 0) return;

  const time = currentTime.value;
  let index = -1;

  for (let i = 0; i < parsedLyrics.value.length; i++) {
    if (parsedLyrics.value[i].time <= time) {
      index = i;
    } else {
      break;
    }
  }

  if (index !== currentLyricIndex.value) {
    currentLyricIndex.value = index;
    // 自动滚动歌词
    scrollToCurrentLyric();
  }
}

// 滚动到当前歌词
function scrollToCurrentLyric() {
  if (!lyricsContainerRef.value || currentLyricIndex.value < 0) return;

  const container = lyricsContainerRef.value;
  const items = container.querySelectorAll('.lyric-line');
  const currentItem = items[currentLyricIndex.value] as HTMLElement | undefined;

  if (currentItem) {
    const containerHeight = container.clientHeight;
    const itemTop = currentItem.offsetTop;
    const itemHeight = currentItem.clientHeight;
    const targetScroll = itemTop - containerHeight / 2 + itemHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  }
}

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 模拟律动动画
function startPulseAnimation() {
  if (pulseInterval) return;

  pulseInterval = setInterval(() => {
    frequencyData.value = frequencyData.value.map((_, i) => {
      const baseWave = 20 + Math.sin((currentTime.value * 4 + i * 0.5) * 0.3) * 30;
      const randomPulse = Math.random() * 25;
      const prev = frequencyData.value[(i - 1) % 32] || 30;
      const next = frequencyData.value[(i + 1) % 32] || 30;
      const smoothed = (baseWave + randomPulse + prev * 0.15 + next * 0.15) / 1.3;
      return Math.min(100, Math.max(5, smoothed));
    });
  }, 80);
}

function stopPulseAnimation() {
  if (pulseInterval) {
    clearInterval(pulseInterval);
    pulseInterval = null;
  }
  frequencyData.value = Array(32).fill(0);
}

// 播放控制
async function togglePlay() {
  if (!audioRef.value || !currentTrack.value.src) return;

  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
    stopPulseAnimation();
    emit('pause');
  } else {
    try {
      await audioRef.value.play();
      isPlaying.value = true;
      startPulseAnimation();
      emit('play');
    } catch (error) {
      console.warn('播放失败:', error);
      isPlaying.value = false;
    }
  }
}

// 切换播放模式
function togglePlayMode() {
  const modes = playModes.map(m => m.mode);
  const currentIndex = modes.indexOf(playMode.value);
  const nextIndex = (currentIndex + 1) % modes.length;
  playMode.value = modes[nextIndex];

  // 显示模式提示，1.5秒后自动隐藏
  showModeTip.value = true;
  setTimeout(() => {
    showModeTip.value = false;
  }, 1500);
}

// 根据播放模式获取下一首索引
function getNextIndex(): number {
  if (props.playlist.length === 0) return 0;
  if (props.playlist.length === 1) return 0;

  switch (playMode.value) {
    case 'single':
      // 单曲循环：保持当前索引
      return currentTrackIndex.value;
    case 'loop':
      // 列表循环：顺序播放，到末尾回到开头
      return currentTrackIndex.value < props.playlist.length - 1 ? currentTrackIndex.value + 1 : 0;
    case 'random':
      // 随机播放：随机选择（避免连续选到同一首）
      let randomIndex = Math.floor(Math.random() * props.playlist.length);
      if (randomIndex === currentTrackIndex.value && props.playlist.length > 1) {
        randomIndex = (randomIndex + 1) % props.playlist.length;
      }
      return randomIndex;
    default:
      return currentTrackIndex.value + 1;
  }
}

// 上一首
async function playPrev() {
  if (props.playlist.length === 0) return;
  if (props.playlist.length === 1) {
    await handleTrackClick(0);
    return;
  }

  // 随机模式下，上一首也随机
  if (playMode.value === 'random') {
    const randomIndex = Math.floor(Math.random() * props.playlist.length);
    await handleTrackClick(randomIndex);
  } else {
    const newIndex = currentTrackIndex.value > 0 ? currentTrackIndex.value - 1 : props.playlist.length - 1;
    await handleTrackClick(newIndex);
  }
}

// 下一首
async function playNext() {
  if (props.playlist.length === 0) return;
  const newIndex = getNextIndex();
  await handleTrackClick(newIndex);
}

// 进度条拖拽
function handleProgressDragStart(e: MouseEvent | TouchEvent) {
  isDraggingProgress.value = true;
  updateProgressFromEvent(e);
}

function handleProgressDragMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingProgress.value) return;
  updateProgressFromEvent(e);
}

function handleProgressDragEnd() {
  isDraggingProgress.value = false;
}

function updateProgressFromEvent(e: MouseEvent | TouchEvent) {
  const progressBar = document.querySelector('.progress-track');
  if (!progressBar || !audioRef.value) return;

  const rect = progressBar.getBoundingClientRect();
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  audioRef.value.currentTime = percent * duration.value;
  currentTime.value = audioRef.value.currentTime;
}

// 音量控制
function handleVolumeInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target) {
    volume.value = Number(target.value);
    if (audioRef.value) {
      audioRef.value.volume = volume.value / 100;
    }
  }
}

// 播放列表交互
async function handleTrackClick(index: number) {
  if (index === currentTrackIndex.value) {
    togglePlay();
    return;
  }

  // 停止当前播放并清理状态（不管当前是否在播放状态）
  if (audioRef.value) {
    audioRef.value.pause();
    // 清理之前的事件监听器
    if (currentPlayHandler) {
      audioRef.value.removeEventListener('canplaythrough', currentPlayHandler);
      currentPlayHandler = null;
    }
  }
  isPlaying.value = false;
  stopPulseAnimation();

  currentTrackIndex.value = index;
  const track = props.playlist[index];
  if (track && audioRef.value) {
    // src 通过模板 :src="currentTrack.src" 响应式绑定，load() 会触发重新加载
    audioRef.value.load();

    // 等待媒体数据加载完成后再播放，使用 canplaythrough 事件确保播放流畅
    const playWhenReady = () => {
      audioRef.value?.removeEventListener('canplaythrough', playWhenReady);
      currentPlayHandler = null;
      audioRef.value?.play()
        .then(() => {
          isPlaying.value = true;
          startPulseAnimation();
          emit('trackChange', track);
        })
        .catch(error => {
          console.warn('播放失败:', error);
          // 浏览器自动播放策略阻止时，提示用户手动播放
          isPlaying.value = false;
        });
    };

    // 记录当前的处理函数以便清理
    currentPlayHandler = playWhenReady;

    // 如果媒体已缓存可直接播放，否则等待加载
    if (audioRef.value.readyState >= 3) {
      // HAVE_FUTURE_DATA (3) 或 HAVE_ENOUGH_DATA (4)，可直接播放
      playWhenReady();
    } else {
      audioRef.value.addEventListener('canplaythrough', playWhenReady);
    }
  }
}

// 音频事件处理
function handleTimeUpdate() {
  if (audioRef.value && !isDraggingProgress.value) {
    currentTime.value = audioRef.value.currentTime;
    emit('timeupdate', currentTime.value);
    updateCurrentLyric();
  }
}

function handleLoadedMetadata() {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
}

async function handleEnded() {
  // 先清理当前播放状态
  stopPulseAnimation();
  isPlaying.value = false;

  // 清理之前的事件监听器
  if (audioRef.value && currentPlayHandler) {
    audioRef.value.removeEventListener('canplaythrough', currentPlayHandler);
    currentPlayHandler = null;
  }

  // 列表循环或随机播放：播放下一首
  if (playMode.value !== 'single' && props.playlist.length > 1) {
    await playNext();
    emit('ended');
    return;
  }

  // 单曲循环或只有一首歌
  if (playMode.value === 'single' && audioRef.value) {
    // 单曲循环：重新加载并播放当前歌曲
    const track = props.playlist[currentTrackIndex.value];
    if (track) {
      audioRef.value.load();

      const playWhenReady = () => {
        audioRef.value?.removeEventListener('canplaythrough', playWhenReady);
        currentPlayHandler = null;
        audioRef.value?.play()
          .then(() => {
            isPlaying.value = true;
            startPulseAnimation();
          })
          .catch(error => {
            console.warn('单曲循环播放失败:', error);
            isPlaying.value = false;
          });
      };

      currentPlayHandler = playWhenReady;

      if (audioRef.value.readyState >= 3) {
        playWhenReady();
      } else {
        audioRef.value.addEventListener('canplaythrough', playWhenReady);
      }
    }
  }

  emit('ended');
}

function handleAudioPlay() {
  isPlaying.value = true;
  startPulseAnimation();
  emit('play');
}

function handleAudioPause() {
  isPlaying.value = false;
  stopPulseAnimation();
  emit('pause');
}

// 监听 initialIndex 变化
watch(
  () => props.initialIndex,
  newIndex => {
    if (newIndex >= 0 && newIndex < props.playlist.length) {
      currentTrackIndex.value = newIndex;
    }
  },
  { immediate: true }
);

// 监听 playlist 变化，自动加载第一首
watch(
  () => props.playlist,
  newList => {
    if (newList.length > 0 && audioRef.value) {
      const index = Math.min(currentTrackIndex.value, newList.length - 1);
      currentTrackIndex.value = index;
      audioRef.value.src = newList[index].src;
      audioRef.value.load();
      // 解析歌词
      parsedLyrics.value = parseLyrics(newList[index].lyrics || '');
      currentLyricIndex.value = -1;
    }
  },
  { immediate: true }
);

// 监听当前曲目歌词变化
watch(
  () => currentTrack.value.lyrics,
  lyrics => {
    parsedLyrics.value = parseLyrics(lyrics || '');
    currentLyricIndex.value = -1;
  }
);

// 全局事件监听
onMounted(() => {
  document.addEventListener('mousemove', handleProgressDragMove);
  document.addEventListener('mouseup', handleProgressDragEnd);
  document.addEventListener('touchmove', handleProgressDragMove);
  document.addEventListener('touchend', handleProgressDragEnd);

  if (audioRef.value) {
    audioRef.value.volume = volume.value / 100;
  }

  // 自动播放
  if (props.autoPlay && currentTrack.value.src && audioRef.value) {
    audioRef.value.play();
    isPlaying.value = true;
    startPulseAnimation();
    emit('play');
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleProgressDragMove);
  document.removeEventListener('mouseup', handleProgressDragEnd);
  document.removeEventListener('touchmove', handleProgressDragMove);
  document.removeEventListener('touchend', handleProgressDragEnd);

  // 清理 canplaythrough 事件监听器
  if (audioRef.value && currentPlayHandler) {
    audioRef.value.removeEventListener('canplaythrough', currentPlayHandler);
    currentPlayHandler = null;
  }

  stopPulseAnimation();
});
</script>

<template>
  <div
    class="audio-player relative flex gap-20px rd-20px p-24px bg-white/85 dark:bg-black/65 backdrop-blur-xl shadow-2xl"
    style="width: 600px;"
  >
    <!-- 左侧：唱片和控制区域 -->
    <div class="flex flex-col gap-16px items-center" style="width: 55%;">
      <!-- 黑胶唱片区域（带环绕律动条） -->
      <div class="vinyl-wrapper relative flex-center" style="width: 220px; height: 220px;">
        <!-- 律动条 - 环绕唱片一圈 -->
        <div class="pulse-ring absolute z-0" style="width: 240px; height: 240px;">
          <div
            v-for="(h, i) in frequencyData"
            :key="i"
            class="pulse-bar absolute rd-2px bg-[rgb(var(--primary-color))]"
            :style="{
              width: `${4 + h * 0.12}px`,
              height: '5px',
              left: `calc(50% + ${(Math.cos((i * 11.25 - 90) * Math.PI / 180) * 118) - 2}px)`,
              top: `calc(50% + ${Math.sin((i * 11.25 - 90) * Math.PI / 180) * 118 - 2}px)`,
              opacity: 0.35 + h * 0.0065,
              transform: `rotate(${i * 11.25 + 90}deg)`,
              transition: 'width 0.06s ease-out, opacity 0.06s ease-out'
            }"
          />
        </div>

        <!-- 科技感光环 -->
        <div
          class="absolute z-1 rd-full"
          :style="{
            inset: '-2px',
            border: '2px solid rgb(var(--primary-color))',
            boxShadow: isPlaying ? '0 0 25px rgb(var(--primary-color)) / 50, inset 0 0 15px rgb(var(--primary-color)) / 20' : '0 0 15px rgb(var(--primary-color)) / 30',
            transition: 'box-shadow 0.3s'
          }"
        />

        <!-- 黑胶唱片 -->
        <div
          class="vinyl-disc relative z-2 rd-full shadow-lg"
          :class="[isPlaying ? 'animate-spin' : '']"
          style="width: 220px; height: 220px; animation-duration: 6s;"
        >
          <!-- 唱片外圈 -->
          <div class="absolute inset-0 rd-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] dark:from-[#1a1a1a] dark:to-[#0a0a0a]" />

          <!-- 唱片纹理 -->
          <div
            class="absolute rd-full"
            :style="{ inset: '12px', background: 'repeating-radial-gradient(circle at center, #333 0px, #1a1a1a 2px, #333 4px)' }"
          />

          <!-- 内圈光晕 -->
          <div
            class="absolute rd-full opacity-20"
            :style="{ inset: '35px', background: 'radial-gradient(circle, transparent 50%, rgb(var(--primary-color)) 100%)' }"
          />

          <!-- 专辑封面 -->
          <div
            class="absolute rd-full overflow-hidden shadow-inner flex-center"
            :class="[isPlaying ? 'animate-spin-slow' : '']"
            :style="{ inset: '70px', animationDuration: '12s' }"
          >
            <img
              v-if="currentTrack.cover"
              :src="currentTrack.cover"
              :alt="currentTrack.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex-center bg-gradient-to-br from-[rgb(var(--primary-500-color))] to-[rgb(var(--primary-700-color))]"
            >
              <SvgIcon icon="mdi:music-note" :size="32" class="text-white" />
            </div>
          </div>

          <!-- 中心轴 -->
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14px h-14px rd-full bg-gradient-to-br from-[#888] to-[#444] shadow z-10" />
        </div>
      </div>

      <!-- 歌曲信息 -->
      <div class="text-center w-full px-4px">
        <h3 class="text-16px font-semibold truncate text-[rgb(var(--primary-color))]">
          {{ currentTrack.title }}
        </h3>
        <p class="text-13px truncate text-gray-500 dark:text-gray-400 mt-4px">
          {{ currentTrack.artist }}{{ currentTrack.album ? ` - ${currentTrack.album}` : '' }}
        </p>
      </div>

      <!-- 歌词展示区域 -->
      <div class="w-full mt-8px">
        <div
          ref="lyricsContainerRef"
          class="lyrics-container h-80px overflow-y-auto px-4px rd-8px bg-gray-100/60 dark:bg-gray-800/40"
        >
          <!-- 有歌词 -->
          <div v-if="hasLyrics" class="py-12px space-y-8px">
            <p
              v-for="(line, index) in parsedLyrics"
              :key="index"
              class="lyric-line text-13px text-center transition-all duration-300"
              :class="[
                index === currentLyricIndex
                  ? 'text-[rgb(var(--primary-color))] font-medium scale-105'
                  : 'text-gray-400 dark:text-gray-500'
              ]"
            >
              {{ line.text }}
            </p>
          </div>
          <!-- 无歌词 -->
          <div v-else class="h-full flex-center">
            <div class="text-center">
              <SvgIcon icon="mdi:text-box-outline" :size="24" class="text-gray-300 dark:text-gray-500 mx-auto mb-4px" />
              <p class="text-12px text-gray-400 dark:text-gray-500">暂无歌词</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="w-full">
        <div
          class="progress-track relative h-6px rd-full cursor-pointer overflow-visible"
          @mousedown="handleProgressDragStart"
          @touchstart="handleProgressDragStart"
        >
          <!-- 背景轨道 -->
          <div class="absolute inset-0 rd-full bg-gray-300/90 dark:bg-gray-600/80 shadow-inner" />
          <!-- 已播放进度 -->
          <div
            class="progress-played absolute left-0 top-0 h-full rd-full bg-gradient-to-r from-[rgb(var(--primary-color))] to-[rgb(var(--primary-400-color))] shadow-sm"
            :style="{ width: `${progressPercent}%` }"
          />
          <!-- 滑块指示器 -->
          <div
            class="progress-thumb absolute top-1/2 -translate-y-1/2 w-14px h-14px rd-full bg-white shadow-lg ring-2 ring-[rgb(var(--primary-color))]/70 transition-transform hover:scale-125 hover:ring-[rgb(var(--primary-color))]"
            :style="{ left: `calc(${progressPercent}% - 7px)` }"
          >
            <div class="absolute inset-2px rd-full bg-[rgb(var(--primary-color))]" />
          </div>
        </div>
        <div class="flex justify-between mt-6px text-11px text-gray-500 dark:text-gray-400">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="flex-center gap-12px">
        <!-- 播放模式切换 -->
        <div class="relative">
          <button
            class="play-mode-btn w-36px h-36px rd-full flex-center transition-all duration-200 hover:scale-110 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-[rgb(var(--primary-color))]/15"
            :class="[
              playMode === 'single' ? 'text-[rgb(var(--primary-color))]' : 'text-gray-600 dark:text-gray-300 hover:text-[rgb(var(--primary-color))]'
            ]"
            @click="togglePlayMode"
          >
            <SvgIcon :icon="playModes.find(m => m.mode === playMode)?.icon || 'mdi:repeat'" :size="22" />
          </button>
          <!-- 模式提示 -->
          <div
            class="absolute bottom-44px left-1/2 -translate-x-1/2 px-8px py-4px rd-6px text-11px whitespace-nowrap bg-gray-800/90 dark:bg-gray-200/90 text-white dark:text-gray-800 opacity-0 transition-opacity pointer-events-none"
            :class="{ 'opacity-100': showModeTip }"
          >
            {{ playModes.find(m => m.mode === playMode)?.label }}
          </div>
        </div>

        <button
          v-if="playlist.length > 1"
          class="w-36px h-36px rd-full flex-center transition-all duration-200 hover:scale-110 bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-[rgb(var(--primary-color))]/15 hover:text-[rgb(var(--primary-color))]"
          @click="playPrev"
        >
          <SvgIcon icon="mdi:skip-previous" :size="22" />
        </button>

        <button
          class="play-btn-main w-44px h-44px rd-full flex-center shadow-lg transition-all duration-300 hover:scale-115"
          :disabled="!currentTrack.src"
          @click="togglePlay"
        >
          <div class="w-36px h-36px rd-full flex-center bg-gradient-to-br from-[rgb(var(--primary-color))] to-[rgb(var(--primary-600-color))]">
            <SvgIcon :icon="isPlaying ? 'mdi:pause' : 'mdi:play'" :size="20" :class="isPlaying ? '' : 'ml-1px'" />
          </div>
        </button>

        <button
          v-if="playlist.length > 1"
          class="w-36px h-36px rd-full flex-center transition-all duration-200 hover:scale-110 bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-[rgb(var(--primary-color))]/15 hover:text-[rgb(var(--primary-color))]"
          @click="playNext"
        >
          <SvgIcon icon="mdi:skip-next" :size="22" />
        </button>

        <div class="relative">
          <button
            class="w-36px h-36px rd-full flex-center transition-all duration-200 hover:scale-110 bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-[rgb(var(--primary-color))]/15 hover:text-[rgb(var(--primary-color))]"
            @click="showVolumeSlider = !showVolumeSlider"
          >
            <SvgIcon :icon="volume === 0 ? 'mdi:volume-off' : volume < 50 ? 'mdi:volume-medium' : 'mdi:volume-high'" :size="22" />
          </button>
          <Transition name="slide-up">
            <div
              v-if="showVolumeSlider"
              class="absolute bottom-44px left-1/2 -translate-x-1/2 w-32px h-120px rd-8px p-8px bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl"
            >
              <div class="relative h-full flex flex-col items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="volume"
                  class="volume-slider w-full h-full"
                  orient="vertical"
                  @input="handleVolumeInput"
                />
                <span class="text-10px text-gray-500 mt-4px">{{ volume }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 右侧：播放列表 -->
    <div
      class="flex flex-col rd-12px overflow-hidden bg-gray-100/60 dark:bg-gray-900/60"
      style="width: 45%; min-width: 180px;"
    >
      <div class="px-12px py-10px border-b border-gray-200/60 dark:border-gray-700/60 flex items-center gap-8px">
        <SvgIcon icon="mdi:playlist-music" :size="18" class="text-[rgb(var(--primary-color))]" />
        <span class="text-14px font-medium text-gray-700 dark:text-gray-200">播放列表</span>
        <span class="text-12px text-gray-500 dark:text-gray-400 ml-auto">{{ playlist.length }} 首</span>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(track, index) in playlist"
          :key="track.id"
          class="playlist-item flex items-center gap-12px px-12px py-12px cursor-pointer transition-all duration-200"
          :class="[
            index === currentTrackIndex
              ? 'bg-[rgb(var(--primary-color))]/20 dark:bg-[rgb(var(--primary-color))]/30'
              : 'hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
          ]"
          @click="handleTrackClick(index)"
        >
          <!-- 缩略图 -->
          <div class="w-44px h-44px rd-10px overflow-hidden flex-shrink-0 shadow-md">
            <img
              v-if="track.cover"
              :src="track.cover"
              :alt="track.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex-center bg-gradient-to-br from-[rgb(var(--primary-500-color))] to-[rgb(var(--primary-700-color))]"
            >
              <SvgIcon icon="mdi:music-note" :size="18" class="text-white" />
            </div>
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <p
              class="text-14px truncate font-medium"
              :class="index === currentTrackIndex ? 'text-[rgb(var(--primary-color))]' : 'text-gray-700 dark:text-gray-200'"
            >
              {{ track.title }}
            </p>
            <p class="text-12px truncate text-gray-500 dark:text-gray-400 mt-3px">
              {{ track.artist }}{{ track.album ? ` - ${track.album}` : '' }}
            </p>
          </div>

          <!-- 播放状态指示 -->
          <div v-if="index === currentTrackIndex && isPlaying" class="flex-shrink-0">
            <div class="flex items-center gap-2px">
              <div class="w-3px h-12px rd-full bg-[rgb(var(--primary-color))] animate-pulse" style="animation-delay: 0s;" />
              <div class="w-3px h-7px rd-full bg-[rgb(var(--primary-color))] animate-pulse" style="animation-delay: 0.12s;" />
              <div class="w-3px h-12px rd-full bg-[rgb(var(--primary-color))] animate-pulse" style="animation-delay: 0.24s;" />
            </div>
          </div>
        </div>

        <!-- 空列表提示 -->
        <div v-if="playlist.length === 0" class="flex-center py-40px text-gray-500 dark:text-gray-400">
          <SvgIcon icon="mdi:music-note-outline" :size="32" class="opacity-50" />
          <span class="text-14px mt-8px">当前目录暂无音频文件</span>
        </div>
      </div>
    </div>

    <!-- 音频元素 -->
    <audio
      ref="audioRef"
      :src="currentTrack.src"
      class="hidden"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
      @play="handleAudioPlay"
      @pause="handleAudioPause"
    />
  </div>
</template>

<style scoped lang="scss">
.animate-spin { animation: spin 6s linear infinite; }
.animate-spin-slow { animation: spin-slow 12s linear infinite; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

// 主播放按钮 - 白色外圈样式
.play-btn-main {
  background: rgba(255, 255, 255, 0.95);
  border: 4px solid rgb(var(--primary-color) / 50);
  box-shadow:
    0 0 0 1px rgb(var(--primary-color) / 30),
    0 4px 12px rgb(0 0 0 / 20);
  color: white;

  &:hover:not(:disabled) {
    box-shadow:
      0 0 0 2px rgb(var(--primary-color) / 40),
      0 6px 16px rgb(0 0 0 / 25);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 暗黑模式下的外圈样式
.dark .play-btn-main {
  background: rgba(60, 60, 60, 0.95);
  border: 4px solid rgb(var(--primary-color) / 60);
  box-shadow:
    0 0 0 1px rgb(var(--primary-color) / 35),
    0 4px 12px rgb(0 0 0 / 30);
}

.overflow-y-auto {
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgb(var(--primary-color) / 30); border-radius: 2px; }
}

// 歌词容器样式
.lyrics-container {
  scroll-behavior: smooth;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgb(var(--primary-color) / 25); border-radius: 2px; }
}

.lyric-line {
  line-height: 1.6;
}

// 进度条样式优化
.progress-track {
  &:hover .progress-thumb {
    transform: translateY(-50%) scale(1.25);
  }
}

.progress-played {
  transition: width 0.1s ease-out;
}

.progress-thumb {
  transition: transform 0.15s ease, ring-color 0.15s ease;
}

.progress-track:active { cursor: grabbing; }

.volume-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  appearance: none;
  background: transparent;
  &::-webkit-slider-runnable-track {
    width: 5px;
    height: 100%;
    background: linear-gradient(to top, rgb(var(--primary-color)) 0%, rgb(var(--primary-color)) 80%, #e5e5e5 80%);
    border-radius: 3px;
  }
  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    background: rgb(var(--primary-color));
    border-radius: 50%;
    cursor: pointer;
    margin-left: -5px;
  }
}

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
