<script lang="ts" setup>
import { computed, ref } from 'vue';

defineOptions({
  name: 'FileImage'
});

interface Props {
  data: Api.Disk.FileItem;
}

interface FileExtendNameIconMap {
  [key: string]: string;
}

const props = withDefaults(defineProps<Props>(), {});

/** 图片类型 */
const ImageTypes = ['jpg', 'png', 'gif', 'jpeg'];

/** 文件类型图标 Map 映射 */
const FileIcon: FileExtendNameIconMap = {
  mp3: 'file_music',
  mp4: 'file_video',
  dir: 'file_dir',
  dll: 'file-dll',
  ppt: 'file_ppt',
  doc: 'file_wps',
  docx: 'file_wps',
  xls: 'file_excel',
  xlsx: 'file_excel',
  txt: 'file_txt',
  rar: 'file_rar',
  zip: 'file_zip',
  html: 'file_html',
  css: 'file_css',
  md: 'file-md',
  js: 'file_js',
  ts: 'file-ts',
  py: 'file-python',
  exe: 'file-exe',
  msi: 'file-msi',
  mind: 'file-mind',
  xmind: 'file-mind',
  json: 'file-json',
  yaml: 'file-yaml',
  '7z': 'file-7z',
  pdf: 'file_pdf',
  tar: 'file-tar',
  png: 'file_image',
  other: 'file_other' // 未知文件
};

const hasImageError = ref<boolean>(false);
const isLoadingImage = ref(false);
// const imageBlob = ref<string>('');

// 是否是图片类型文件且成功加载
const isImage = computed(() => {
  if (!props.data || props.data.isDir) {
    return false; // 文件夹不可能是图片
  }
  const extendName = props.data.extendName?.toLowerCase() || '';
  return ImageTypes.includes(extendName) && !hasImageError.value;
});

// 获取文件图标，如果是图片就显示图片
const getFileImg = computed(() => {
  const extendName = props.data.extendName?.toLowerCase() || '';
  if (props.data?.isDir) {
    return `disk-${FileIcon.dir}`;
  }
  if (!Object.keys(FileIcon).includes(extendName)) {
    return `disk-${FileIcon.other}`;
  }
  return `disk-${FileIcon[extendName]}`;
});

// 修改后的获取缩略图函数
// const getThumbnail = computed(() => {
//   return imageBlob.value;
// });
</script>

<template>
  <div v-if="isImage" class="relative h-full w-auto">
    <img
      v-if="!isLoadingImage"
      class="h-full w-auto object-cover transition-all duration-300"
      :src="props.data.src"
      :alt="props.data.name"
    />
    <div v-else-if="isLoadingImage" class="h-full w-auto flex items-center justify-center">
      <NSpin size="small" />
    </div>
  </div>
  <SvgIcon v-else :local-icon="getFileImg" class="h-full w-auto object-cover transition-all duration-300" />
</template>
