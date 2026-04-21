<script setup lang="ts">
/* oxlint-disable eslint-plugin-import/no-named-as-default-member */
import { ref, onMounted, onUnmounted } from 'vue';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import flvjs from 'flv.js';

defineOptions({ name: 'VideoPlayer' });

interface Props {
  url: string;
  fileName: string;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement>();
let artInstance: Artplayer | null = null;
let hlsInstance: Hls | null = null;
let flvInstance: flvjs.Player | null = null;

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8') || url.includes('/hls/');
}

function isFlvUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('.flv') || lower.includes('/flv/');
}

function playHls(video: HTMLVideoElement, url: string, art: Artplayer) {
  if (!Hls.isSupported()) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
    return;
  }

  hlsInstance = new Hls({
    maxBufferLength: 30,
    maxMaxBufferLength: 60
  });
  hlsInstance.loadSource(url);
  hlsInstance.attachMedia(video);

  hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event: string, data: { levels: { height: number }[] }) => {
    if (data.levels.length > 1) {
      const qualities = data.levels.map((level: { height: number }, index: number) => ({
        html: `${level.height}p`,
        value: index,
        default: index === data.levels.length - 1
      }));
      // Add quality settings to Artplayer
      art.controls.add({
        name: 'quality',
        position: 'right',
        html: '画质',
        selector: qualities,
        onSelect(item) {
          hlsInstance!.currentLevel = item.value as number;
          return item.html as string;
        }
      });
    }
  });

  art.on('destroy', () => {
    hlsInstance?.destroy();
    hlsInstance = null;
  });
}

function playFlv(video: HTMLVideoElement, url: string, art: Artplayer) {
  if (!flvjs.isSupported()) return;

  flvInstance = flvjs.createPlayer({
    type: 'flv',
    url
  });
  flvInstance.attachMediaElement(video);
  flvInstance.load();

  art.on('destroy', () => {
    flvInstance?.destroy();
    flvInstance = null;
  });
}

onMounted(() => {
  if (!containerRef.value) return;

  const config: Record<string, any> = {
    container: containerRef.value,
    url: props.url,
    volume: 0.8,
    autoplay: false,
    pip: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    theme: '#1890ff',
    lang: 'zh-cn',
    hotkey: true,
    playbackRate: true,
    aspectRatio: true,
    setting: true,
    loop: false,
    flip: false,
    screenshot: false,
    subtitleOffset: false,
    autoSize: true,
    autoMini: false,
    mutex: true,
    backdrop: true,
    playsInline: true,
    lock: false,
    gesture: true,
    fastForward: true,
    autoPlayback: false,
    autoOrientation: true,
    airplay: true
  };

  if (isHlsUrl(props.url)) {
    config.customType = { hls: playHls };
    config.type = 'hls';
  } else if (isFlvUrl(props.url)) {
    config.customType = { flv: playFlv };
    config.type = 'flv';
  }

  artInstance = new Artplayer(config as any);
});

onUnmounted(() => {
  hlsInstance?.destroy();
  hlsInstance = null;
  flvInstance?.destroy();
  flvInstance = null;
  artInstance?.destroy(false);
  artInstance = null;
});
</script>

<template>
  <div class="video-player-container">
    <div ref="containerRef" class="artplayer-app" />
  </div>
</template>

<style scoped>
.video-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.artplayer-app {
  width: 100%;
  height: 100%;
}
</style>
