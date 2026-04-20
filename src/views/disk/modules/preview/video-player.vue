<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Artplayer from 'artplayer';

defineOptions({ name: 'VideoPlayer' });

interface Props {
  url: string;
  fileName: string;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement>();
let artInstance: Artplayer | null = null;

onMounted(() => {
  if (!containerRef.value) return;
  artInstance = new Artplayer({
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
    airplay: true,
  });
});

onUnmounted(() => {
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
