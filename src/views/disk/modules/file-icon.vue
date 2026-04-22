<script setup lang="ts">
import { computed } from 'vue';

import apkIcon from '@/assets/imgs/file-icons/apk.png';
import audioIcon from '@/assets/imgs/file-icons/audio.png';
import btIcon from '@/assets/imgs/file-icons/bt.png';
import codeIcon from '@/assets/imgs/file-icons/code.png';
import defaultIcon from '@/assets/imgs/file-icons/default.png';
import dmgIcon from '@/assets/imgs/file-icons/dmg.png';
import docIcon from '@/assets/imgs/file-icons/doc.png';
import exeIcon from '@/assets/imgs/file-icons/exe.png';
import flvIcon from '@/assets/imgs/file-icons/flv.png';
import folderIcon from '@/assets/imgs/file-icons/folder.png';
import imageIcon from '@/assets/imgs/file-icons/image.png';
import pdfIcon from '@/assets/imgs/file-icons/pdf.png';
import pptIcon from '@/assets/imgs/file-icons/ppt.png';
import ttfIcon from '@/assets/imgs/file-icons/ttf.png';
import txtIcon from '@/assets/imgs/file-icons/txt.png';
import videoIcon from '@/assets/imgs/file-icons/video.png';
import xlsIcon from '@/assets/imgs/file-icons/xls.png';
import zipIcon from '@/assets/imgs/file-icons/zip.png';

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

/** 扩展名 → 图标映射 */
const extensionIconMap: Record<string, string> = {
  // 文档
  pdf: pdfIcon,
  doc: docIcon,
  docx: docIcon,
  xls: xlsIcon,
  xlsx: xlsIcon,
  csv: xlsIcon,
  ppt: pptIcon,
  pptx: pptIcon,
  txt: txtIcon,
  md: txtIcon,
  log: txtIcon,
  // 图片
  jpg: imageIcon,
  jpeg: imageIcon,
  png: imageIcon,
  gif: imageIcon,
  webp: imageIcon,
  svg: imageIcon,
  bmp: imageIcon,
  ico: imageIcon,
  // 视频
  mp4: videoIcon,
  avi: videoIcon,
  mov: videoIcon,
  mkv: videoIcon,
  wmv: videoIcon,
  flv: flvIcon,
  // 音频
  mp3: audioIcon,
  wav: audioIcon,
  flac: audioIcon,
  aac: audioIcon,
  ogg: audioIcon,
  wma: audioIcon,
  ape: audioIcon,
  // 压缩包
  zip: zipIcon,
  rar: zipIcon,
  '7z': zipIcon,
  tar: zipIcon,
  gz: zipIcon,
  // 代码
  json: codeIcon,
  js: codeIcon,
  ts: codeIcon,
  vue: codeIcon,
  html: codeIcon,
  css: codeIcon,
  py: codeIcon,
  java: codeIcon,
  go: codeIcon,
  xml: codeIcon,
  yaml: codeIcon,
  yml: codeIcon,
  sql: codeIcon,
  // 安装包 / 可执行
  apk: apkIcon,
  exe: exeIcon,
  msi: exeIcon,
  dmg: dmgIcon,
  // 字体
  ttf: ttfIcon,
  otf: ttfIcon,
  woff: ttfIcon,
  woff2: ttfIcon,
  // 种子
  torrent: btIcon
};

/** 文件类型分类 → 图标映射（扩展名未命中时使用） */
const fileTypeIconMap: Record<string, string> = {
  folder: folderIcon,
  image: imageIcon,
  document: docIcon,
  video: videoIcon,
  audio: audioIcon,
  other: defaultIcon
};

const iconSizeMap: Record<string, number> = {
  small: 30,
  medium: 40,
  large: 80
};

const icon = computed(() => {
  if (props.fileType === 'folder') {
    return folderIcon;
  }

  if (props.extension) {
    const ext = props.extension.toLowerCase();
    if (extensionIconMap[ext]) {
      return extensionIconMap[ext];
    }
  }

  return fileTypeIconMap[props.fileType] || defaultIcon;
});

const iconSize = computed(() => iconSizeMap[props.size]);
</script>

<template>
  <img :src="icon" :width="iconSize" :height="iconSize" class="shrink-0 select-none" draggable="false" />
</template>
