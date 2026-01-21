<script lang="ts" setup>
import { computed } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'FileImage'
});

interface Props {
  item: Api.Disk.FileItem;
  public?: boolean;
  details?: boolean;
  gridWidth?: number;
}

interface FileExtendNameIconMap {
  [key: string]: string;
}

const props = withDefaults(defineProps<Props>(), {
  public: false,
  details: false,
  gridWidth: 120
});

const appStore = useAppStore();
const diskStore = useDiskStore();

// 是否是Pc
const isPC = computed(() => appStore.isMobile === false);
const imageUrl = computed(() => `${import.meta.env.VITE_APP_BASE_API}/view/thumbnail?id=`);

/** 图片类型 */
// const ImageTypes = ['jpg', 'png', 'gif', 'jpeg'];

/** 文件类型图标 Map 映射 */
const FileIcon: FileExtendNameIconMap = {
  mp3: 'file_music',
  mp4: 'file_video',
  dll: 'file_dll',
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
  exe: 'file_exe',
  msi: 'file-msi',
  mind: 'file-mind',
  xmind: 'file-mind',
  json: 'file-json',
  yaml: 'file-yaml',
  '7z': 'file_7z',
  pdf: 'file_pdf',
  tar: 'file-tar',
  png: 'file_image',
  iso: 'file_iso',
  other: 'file_other' // 未知文件
};

// const hasImageError = ref<boolean>(false);
// const isLoadingImage = ref(false);
// const imageBlob = ref<string>('');

// 是否是图片类型文件且成功加载
// const isImage = computed(() => {
//   if (!props.item || props.item.isDir) {
//     return false; // 文件夹不可能是图片
//   }
//   const extendName = props.item.extendName?.toLowerCase() || '';
//   return ImageTypes.includes(extendName) && !hasImageError.value;
// });

// 获取文件图标，如果是图片就显示图片
const getFileImg = computed(() => {
  const extendName = props.item.extendName?.toLowerCase() || '';
  if (!Object.keys(FileIcon).includes(extendName)) {
    return `disk-${FileIcon.other}`;
  }
  return `disk-${FileIcon[extendName]}`;
});

const imageHeightStyle = computed(() => {
  if (props.details) {
    return 'height: 110px';
  }
  return `height: ${props.gridWidth - 35}px;`;
});
// const getThumbnail = computed(() => {
//   return imageBlob.value;
// });
</script>

<template>
  <div class="relative h-full w-auto">
    <!-- 收藏图标 -->
    <div v-if="item.isFavorite && !public">
      <div v-if="isPC">
        <SvgIcon
          v-if="diskStore.fileShowMode === 'grid'"
          icon="ic-round-favorite"
          class="absolute left-0 top-2 z-1 text-5 c-emerald"
        />
        <SvgIcon
          v-if="diskStore.fileShowMode === 'list'"
          icon="ic-round-favorite"
          class="absolute left-0 top-0 z-1 text-3 c-emerald"
        />
      </div>
      <div v-else></div>
    </div>
    <!-- 分享图标 -->
    <div v-if="item.isShare && !public">
      <div v-if="isPC">
        <SvgIcon
          v-if="diskStore.fileShowMode === 'grid'"
          icon="ic-round-share"
          class="absolute right-0 top-2 z-1 text-5 c-emerald"
        />
        <SvgIcon
          v-if="diskStore.fileShowMode === 'list'"
          icon="ic-round-share"
          class="absolute right-0 top-0 z-1 text-3 c-emerald"
        />
      </div>
      <div v-else></div>
    </div>
    <!-- 文件夹图标 -->
    <SvgIcon
      v-if="item.isDir"
      local-icon="disk-file_dir"
      class="h-full w-auto object-cover transition-all duration-300"
    />
    <!-- 图片缩略图 -->
    <div v-else-if="item.contentType && item.contentType.startsWith('image')" class="h-full">
      <NImage
        v-if="diskStore.fileShowMode === 'grid'"
        object-fit="contain"
        :style="imageHeightStyle"
        class="h-full w-auto transition-all duration-300"
        :src="imageUrl + item.id"
      >
        <template #error>
          <SvgIcon local-icon="disk-file_image" class="h-full w-auto transition-all duration-300" />
        </template>
      </NImage>
      <NAvatar v-if="diskStore.fileShowMode !== 'grid'" :src="imageUrl + item.id"></NAvatar>
    </div>
    <!-- 音频缩略图 -->
    <div v-else-if="item.contentType && item.contentType.includes('audio')"></div>
    <!-- 视频缩略图 -->
    <div v-else-if="item.contentType && item.contentType.includes('video')"></div>
    <!-- 其他文件图标 -->
    <SvgIcon v-else :local-icon="getFileImg" class="h-full w-auto object-cover transition-all duration-300" />
    <!--
 <img
      v-if="!isLoadingImage"
      class="h-full w-auto object-cover transition-all duration-300"
      :src="props.item.src"
      :alt="props.item.name"
    />
    <div v-else-if="isLoadingImage" class="h-full w-auto flex items-center justify-center">
      <NSpin size="small" />
    </div>
-->
  </div>
  <!-- <SvgIcon v-else :local-icon="getFileImg" class="h-full w-auto object-cover transition-all duration-300" /> -->
</template>
