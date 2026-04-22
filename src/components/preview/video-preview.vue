<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import Artplayer from 'artplayer';
import { fetchRenewStreamToken } from '@/service/api/disk';

defineOptions({
  name: 'VideoPreview'
});

interface Props {
  src: string;
  fileName: string;
  streamToken: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  tokenUpdate: [token: string];
}>();

const playerContainer = ref<HTMLDivElement>();
let artInstance: Artplayer | null = null;
let renewalTimer: ReturnType<typeof setInterval> | null = null;
const currentToken = ref(props.streamToken);

const videoSrc = computed(() => `${props.src}?token=${currentToken.value}`);

async function renewToken() {
  try {
    const res = await fetchRenewStreamToken(currentToken.value);
    if (res.data) {
      currentToken.value = res.data.token;
      emit('tokenUpdate', res.data.token);

      if (artInstance) {
        const currentTime = artInstance.currentTime;
        const playing = artInstance.playing;
        artInstance.switchUrl(`${props.src}?token=${res.data.token}`);
        artInstance.once('video:canplay', () => {
          artInstance!.currentTime = currentTime;
          if (playing) artInstance!.play();
        });
      }
    }
  } catch {
    // token 续期失败，不中断播放，下次续期再试
  }
}

function startRenewalTimer() {
  // 每 20 分钟续期一次（token TTL 30 分钟）
  renewalTimer = setInterval(renewToken, 20 * 60 * 1000);
}

function stopRenewalTimer() {
  if (renewalTimer) {
    clearInterval(renewalTimer);
    renewalTimer = null;
  }
}

onMounted(async () => {
  await nextTick();

  if (!playerContainer.value) return;

  artInstance = new Artplayer({
    container: playerContainer.value,
    url: videoSrc.value,
    volume: 0.8,
    autoplay: true,
    pip: true,
    autoSize: false,
    autoMini: false,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: false,
    theme: '#22c55e',
    lang: 'zh-cn',
    moreVideoAttr: {
      crossOrigin: 'anonymous'
    }
  });

  startRenewalTimer();
});

onUnmounted(() => {
  stopRenewalTimer();
  if (artInstance) {
    artInstance.destroy(false);
    artInstance = null;
  }
});

watch(
  () => props.streamToken,
  newToken => {
    currentToken.value = newToken;
  }
);

function handleClose() {
  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="handleClose">
    <!-- 播放器容器 -->
    <div class="relative w-full max-w-[90vw] sm:w-[800px]">
      <div ref="playerContainer" class="aspect-video w-full overflow-hidden rounded-lg" />

      <!-- 关闭按钮（播放器右上角） -->
      <button
        class="absolute -top-6.5 -right-6.5 z-10000 flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white shadow-lg transition-all hover:bg-white/50 dark:bg-white/20 dark:hover:bg-white/40"
        @click="handleClose"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(.art-video-player) {
  width: 100%;
  height: 100%;
}
</style>
