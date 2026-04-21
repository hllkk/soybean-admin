<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import APlayer from 'aplayer';
import 'aplayer/dist/APlayer.min.css';
import { getPreviewUrl } from '@/service/api/disk/file';

defineOptions({ name: 'AudioPlayer' });

interface AudioFileItem {
  fileId: string | number;
  fileName: string;
}

interface Props {
  url: string;
  fileName: string;
  audioFileList?: AudioFileItem[];
}

const props = defineProps<Props>();
const containerRef = ref<HTMLDivElement>();
let playerInstance: APlayer | null = null;

const hasPlaylist = computed(() => (props.audioFileList?.length ?? 0) > 1);

onMounted(() => {
  if (!containerRef.value) return;
  const nameWithoutExt = props.fileName.replace(/\.[^.]+$/, '');

  if (hasPlaylist.value && props.audioFileList) {
    const audioList = props.audioFileList.map(file => {
      const name = file.fileName.replace(/\.[^.]+$/, '');
      const isCurrent = file.fileName === props.fileName;
      return {
        name,
        url: isCurrent ? props.url : getPreviewUrl(file.fileId),
        theme: '#1890ff'
      } as any;
    });

    playerInstance = new APlayer({
      container: containerRef.value,
      audio: audioList,
      autoplay: false,
      theme: '#1890ff',
      loop: 'all',
      order: 'list',
      preload: 'metadata',
      volume: 0.7,
      mutex: true,
      listFolded: false,
      listMaxHeight: '200px'
    });
  } else {
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
  }
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
      <div class="audio-player-wrap" :class="{ 'with-playlist': hasPlaylist }">
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

.audio-player-wrap.with-playlist {
  max-width: 520px;
}
</style>
