<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { formatFileSize, formatDateTime } from '@/utils/format';
import { fetchGetFileInfoById } from '@/service/api/disk/office';
import FileIcon from './file-icon.vue';

defineOptions({
  name: 'FileDetailModal'
});

interface Props {
  visible: boolean;
  file: Api.Disk.FileItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const loading = ref(false);
const detailData = ref<any>(null);

/** 将 MIME 类型转为文件类别 */
function mimeToCategory(contentType: string): string {
  if (!contentType) return 'other';
  const ct = contentType.toLowerCase();
  if (ct.startsWith('image/')) return 'image';
  if (ct.startsWith('video/')) return 'video';
  if (ct.startsWith('audio/')) return 'audio';
  if (ct === 'application/pdf') return 'document';
  if (ct.startsWith('text/')) return 'document';
  return 'other';
}

const fileCategory = computed(() => {
  if (props.file?.fileType && props.file.fileType !== 'other') return props.file.fileType;
  if (detailData.value?.contentType) return mimeToCategory(detailData.value.contentType);
  return props.file?.fileType || 'other';
});

const contentTypeLabel = computed(() => {
  const map: Record<string, string> = {
    folder: '文件夹',
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    other: '其他'
  };
  return map[fileCategory.value] || fileCategory.value || '-';
});

const isVideo = computed(() => fileCategory.value === 'video');
const isAudio = computed(() => fileCategory.value === 'audio');
const isImage = computed(() => fileCategory.value === 'image');

const videoInfo = computed(() => detailData.value?.video as Api.Disk.VideoInfo | undefined);
const musicInfo = computed(() => detailData.value?.music as Api.Disk.MusicInfo | undefined);
const exifInfo = computed(() => detailData.value?.exif as any | undefined);

function handleClose() {
  emit('update:visible', false);
}

function formatDuration(duration: string | undefined) {
  if (!duration) return '-';
  const seconds = Number.parseFloat(duration);
  if (Number.isNaN(seconds)) return duration;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBitrate(bitrate: string | undefined) {
  if (!bitrate) return '-';
  const num = Number.parseFloat(bitrate);
  if (Number.isNaN(num)) return bitrate;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Mbps`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)} Kbps`;
  return `${bitrate} bps`;
}

watch(
  () => props.visible,
  async val => {
    if (!val || !props.file) {
      detailData.value = null;
      return;
    }
    loading.value = true;
    const { data, error } = await fetchGetFileInfoById(props.file.fileId);
    if (!error && data) {
      detailData.value = data;
    }
    loading.value = false;
  }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="detail-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-9998 flex items-center justify-center"
        @click.self="handleClose"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose" />
        <div
          class="relative w-680px max-w-[90vw] max-h-[85vh] rd-12px bg-white dark:bg-dark overflow-hidden shadow-2xl flex flex-col lt-sm:w-[95vw]"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-24px py-16px border-b border-gray-200 dark:border-gray-700">
            <span class="text-16px font-600 text-gray-800 dark:text-gray-200">
              {{ $t('page.disk.detail.title') }}
            </span>
            <button
              class="w-28px h-28px rd-6px flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              @click="handleClose"
            >
              <icon-mdi-close class="text-18px" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex flex-1 overflow-y-auto min-h-0">
            <NSpin :show="loading" class="flex-1">
              <div v-if="detailData || file" class="flex flex-col sm:flex-row">
                <!-- Left: File icon/thumbnail -->
                <div class="flex-shrink-0 flex items-center justify-center p-24px sm:w-1/3 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800">
                  <div class="w-160px h-160px flex items-center justify-center lt-sm:w-120px lt-sm:h-120px">
                    <FileIcon
                      :file-type="fileCategory"
                      :extension="detailData?.suffix || file?.fileExtension"
                      :file-id="file?.fileId"
                      :media-cover="detailData?.mediaCover || file?.mediaCover"
                      size="large"
                    />
                  </div>
                </div>

                <!-- Right: File info -->
                <div class="flex-1 p-24px min-w-0">
                  <div class="space-y-12px">
                    <div class="flex">
                      <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.fileName') }}</span>
                      <span class="text-13px text-gray-800 dark:text-gray-200 break-all">{{ detailData?.name || file?.fileName || '-' }}</span>
                    </div>
                    <div class="flex">
                      <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.fileType') }}</span>
                      <span class="text-13px text-gray-800 dark:text-gray-200">{{ contentTypeLabel }}</span>
                    </div>
                    <div class="flex">
                      <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.fileSize') }}</span>
                      <span class="text-13px text-gray-800 dark:text-gray-200">{{ formatFileSize(detailData?.size ?? file?.fileSize ?? 0) }}</span>
                    </div>
                    <div class="flex">
                      <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.filePath') }}</span>
                      <span class="text-13px text-gray-800 dark:text-gray-200 break-all">{{ detailData?.path || file?.filePath || '-' }}</span>
                    </div>
                    <div class="flex">
                      <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.createTime') }}</span>
                      <span class="text-13px text-gray-800 dark:text-gray-200">{{ formatDateTime(detailData?.createTime) || '-' }}</span>
                    </div>
                    <div class="flex">
                      <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.modifyTime') }}</span>
                      <span class="text-13px text-gray-800 dark:text-gray-200">{{ formatDateTime(detailData?.updateTime) || '-' }}</span>
                    </div>
                  </div>

                  <!-- Video Info -->
                  <template v-if="isVideo && videoInfo">
                    <NDivider class="!my-12px" />
                    <div class="text-13px font-500 text-gray-700 dark:text-gray-300 mb-8px">
                      {{ $t('page.disk.detail.videoInfo') }}
                    </div>
                    <div class="space-y-8px">
                      <div v-if="videoInfo.width && videoInfo.height" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.videoWidth') }}x{{ $t('page.disk.detail.videoHeight') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ videoInfo.width }} x {{ videoInfo.height }}</span>
                      </div>
                      <div v-if="videoInfo.bitrate" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.videoBitrate') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ formatBitrate(videoInfo.bitrate) }}</span>
                      </div>
                      <div v-if="videoInfo.frameRate" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.videoFrameRate') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ videoInfo.frameRate }} fps</span>
                      </div>
                      <div v-if="videoInfo.format" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.videoFormat') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ videoInfo.format }}</span>
                      </div>
                      <div v-if="videoInfo.duration" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.videoDuration') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ formatDuration(videoInfo.duration) }}</span>
                      </div>
                    </div>
                  </template>

                  <!-- Audio Info -->
                  <template v-if="isAudio && musicInfo">
                    <NDivider class="!my-12px" />
                    <div class="text-13px font-500 text-gray-700 dark:text-gray-300 mb-8px">
                      {{ $t('page.disk.detail.audioInfo') }}
                    </div>
                    <div class="space-y-8px">
                      <div class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.audioSong') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ musicInfo.songName || $t('page.disk.detail.unknown') }}</span>
                      </div>
                      <div class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.audioSinger') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ musicInfo.singer || $t('page.disk.detail.unknown') }}</span>
                      </div>
                      <div class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.audioAlbum') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ musicInfo.album || $t('page.disk.detail.unknown') }}</span>
                      </div>
                    </div>
                  </template>

                  <!-- Image EXIF Info -->
                  <template v-if="isImage && exifInfo">
                    <NDivider class="!my-12px" />
                    <div class="text-13px font-500 text-gray-700 dark:text-gray-300 mb-8px">
                      {{ $t('page.disk.detail.imageInfo') }}
                    </div>
                    <div class="space-y-8px">
                      <div v-if="exifInfo.resolution" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.imageResolution') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ exifInfo.resolution }}</span>
                      </div>
                      <div v-if="exifInfo.make || exifInfo.model" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.imageCamera') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ [exifInfo.make, exifInfo.model].filter(Boolean).join(' ') }}</span>
                      </div>
                      <div v-if="exifInfo.dateTimeOriginal" class="flex">
                        <span class="w-80px flex-shrink-0 text-gray-500 dark:text-gray-400 text-13px">{{ $t('page.disk.detail.imageDateTime') }}</span>
                        <span class="text-13px text-gray-800 dark:text-gray-200">{{ formatDateTime(exifInfo.dateTimeOriginal) }}</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </NSpin>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: opacity 0.25s ease;
}
.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
}
</style>
