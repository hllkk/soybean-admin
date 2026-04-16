<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'FileIcon'
});

interface Props {
  fileType: string;
  extension?: string;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  extension: undefined,
  size: 'medium'
});

const iconMap: Record<string, string> = {
  folder: 'mdi:folder',
  image: 'mdi:file-image',
  document: 'mdi:file-document',
  video: 'mdi:file-video',
  audio: 'mdi:file-music',
  other: 'mdi:file'
};

const extensionIconMap: Record<string, string> = {
  pdf: 'mdi:file-pdf',
  doc: 'mdi:file-word',
  docx: 'mdi:file-word',
  xls: 'mdi:file-excel',
  xlsx: 'mdi:file-excel',
  ppt: 'mdi:file-powerpoint',
  pptx: 'mdi:file-powerpoint',
  zip: 'mdi:zip',
  rar: 'mdi:zip',
  '7z': 'mdi:zip',
  mp3: 'mdi:file-music',
  wav: 'mdi:file-music',
  flac: 'mdi:file-music',
  mp4: 'mdi:file-video',
  avi: 'mdi:file-video',
  mov: 'mdi:file-video',
  mkv: 'mdi:file-video',
  jpg: 'mdi:file-image',
  jpeg: 'mdi:file-image',
  png: 'mdi:file-image',
  gif: 'mdi:file-image',
  webp: 'mdi:file-image',
  svg: 'mdi:file-image',
  txt: 'mdi:file-document-outline',
  md: 'mdi:file-document-outline',
  json: 'mdi:file-code',
  js: 'mdi:file-code',
  ts: 'mdi:file-code',
  vue: 'mdi:file-code',
  html: 'mdi:file-code',
  css: 'mdi:file-code'
};

const iconSizeMap: Record<string, number> = {
  small: 24,
  medium: 40,
  large: 96
};

const icon = computed(() => {
  if (props.fileType === 'folder') {
    return iconMap.folder;
  }

  if (props.extension) {
    const ext = props.extension.toLowerCase();
    if (extensionIconMap[ext]) {
      return extensionIconMap[ext];
    }
  }

  return iconMap[props.fileType] || iconMap.other;
});

const iconSize = computed(() => iconSizeMap[props.size]);
</script>

<template>
  <SvgIcon :icon="icon" :size="iconSize" />
</template>