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
const audioCoverUrl = computed(() => `${import.meta.env.VITE_APP_BASE_API}/view/cover?id=`);

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
        lazy
        object-fit="contain"
        :style="imageHeightStyle"
        class="h-full w-auto transition-all duration-300"
        :src="imageUrl + item.id"
      >
        <template #error>
          <SvgIcon local-icon="disk-file_image" class="h-full w-auto transition-all duration-300" />
        </template>
      </NImage>
      <NAvatar
        v-if="diskStore.fileShowMode !== 'grid'"
        object-fit="cover"
        :src="imageUrl + item.id"
        class="h-full"
      ></NAvatar>
    </div>
    <!-- 音频缩略图 -->
    <div v-else-if="item.contentType && item.contentType.includes('audio')" class="h-full">
      <div v-if="item.music !== null && item.mediaCover">
        <NImage
          v-if="diskStore.fileShowMode === 'grid'"
          object-fit="contain"
          lazy
          :style="{ height: details ? '110px' : gridWidth - 50 + 'px' }"
          :src="audioCoverUrl + item.id"
        >
          <template #error>
            <SvgIcon local-icon="disk-file_music" class="h-full w-auto transition-all duration-300" />
          </template>
        </NImage>
        <NAvatar
          v-if="diskStore.fileShowMode !== 'grid'"
          object-fit="cover"
          :src="audioCoverUrl + item.id"
          class="h-full"
        ></NAvatar>
      </div>
      <SvgIcon v-else local-icon="disk-file_music" class="h-full w-auto object-cover transition-all duration-300" />
    </div>
    <!-- 视频缩略图 -->
    <div v-else-if="item.contentType && item.contentType.includes('video')" class="h-full">
      <div v-if="item.mediaCover">
        <div v-if="diskStore.fileShowMode === 'grid' && isPC && !details" class="grid-play-icon">
          <SvgIcon icon="ic-sharp-play-circle-outline" class="text-2em" />
        </div>
      </div>
      <NImage
        v-if="diskStore.fileShowMode === 'grid'"
        lazy
        object-fit="contain"
        :style="{ height: details ? '110px' : gridWidth - 50 + 'px' }"
        :src="audioCoverUrl + item.id"
      >
        <template #error>
          <SvgIcon local-icon="disk-file_video" class="h-full w-auto transition-all duration-300" />
        </template>
      </NImage>
      <NAvatar v-if="diskStore.fileShowMode !== 'grid'" :src="audioCoverUrl + item.id" class="h-full"></NAvatar>
    </div>
    <!-- 其他文件图标 -->
    <SvgIcon v-else :local-icon="getFileImg" class="h-full w-auto object-cover transition-all duration-300" />
  </div>
</template>

<style scoped lang="scss">
.grid-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  background: rgb(255 255 255 / 30%);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(14px);
  border-radius: 50%;
}
</style>
