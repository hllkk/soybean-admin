<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import APlayer from 'aplayer';
import 'aplayer/dist/APlayer.min.css';

defineOptions({ name: 'AudioPlayer' });

interface Props {
  url: string;
  fileName: string;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement>();
let playerInstance: APlayer | null = null;

onMounted(() => {
  if (!containerRef.value) return;
  const nameWithoutExt = props.fileName.replace(/\.[^.]+$/, '');

  playerInstance = new APlayer({
    container: containerRef.value,
    audio: [
      {
        name: nameWithoutExt,
        url: props.url,
        theme: '#1890ff'
      }
    ],
    autoplay: false,
    theme: '#1890ff',
    loop: 'none',
    order: 'list',
    preload: 'metadata',
    volume: 0.7,
    mutex: true,
    listFolded: true,
    listMaxHeight: 0
  });
});

onUnmounted(() => {
  playerInstance?.destroy();
  playerInstance = null;
});
</script>

<template>
  <div class="audio-player-container">
    <div class="audio-inner">
      <div class="audio-icon">
        <SvgIcon icon="material-symbols:audiotrack-rounded" class="text-64px text-primary" />
      </div>
      <div class="audio-player-wrap">
        <div ref="containerRef" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-inner {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.audio-icon {
  opacity: 0.6;
}

.audio-player-wrap {
  width: 100%;
}
</style>
