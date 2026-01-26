<script lang="ts" setup>
import { computed } from 'vue';
import { formatFileSize } from '../../../utils/file';
import DiskImage from './disk-image.vue';

defineOptions({
  name: 'DiskPropertyModel'
});

interface Props {
  item?: Api.Disk.FileItem;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const title = computed(() => `详细信息 - ${props.item?.name || ''}`);

function formatBitrate(bitrate?: number | string): string {
  if (!bitrate) return '';
  const numBitrate = typeof bitrate === 'string' ? Number.parseFloat(bitrate) : bitrate;
  if (Number.isNaN(numBitrate)) return '';
  if (numBitrate >= 1000000) {
    return `${(numBitrate / 1000000).toFixed(2)} Mbps`;
  }
  if (numBitrate >= 1000) {
    return `${(numBitrate / 1000).toFixed(2)} kbps`;
  }
  return `${numBitrate} bps`;
}

function formatFrameRate(frameRate?: number | string): string {
  if (!frameRate) return '';
  const numFrameRate = typeof frameRate === 'string' ? Number.parseFloat(frameRate) : frameRate;
  if (Number.isNaN(numFrameRate)) return '';
  return `${numFrameRate} fps`;
}

function formatDuration(duration?: number | string): string {
  if (!duration) return '';
  const numDuration = typeof duration === 'string' ? Number.parseFloat(duration) : duration;
  if (Number.isNaN(numDuration)) return '';
  const hours = Math.floor(numDuration / 3600);
  const minutes = Math.floor((numDuration % 3600) / 60);
  const seconds = Math.floor(numDuration % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
</script>

<template>
  <NModal v-model:show="visible" display-directive="show" class="max-w-40%" preset="card">
    <template #header>
      <div class="flex items-center justify-between text-3.5 font-bold">
        <span>{{ title }}</span>
      </div>
    </template>
    <div class="mb-6 flex items-center">
      <DiskImage v-if="props.item" :item="props.item" :details="true" class="mr-4 text-6" />
      <span class="text-base">{{ props.item?.name || '' }}</span>
    </div>
    <NDivider />
    <div class="flex flex-col space-y-4">
      <div class="flex items-center">
        <div class="w-30 text-gray-500">类型</div>
        <div>
          {{
            props.item?.isDir
              ? '文件夹'
              : `${props.item?.extendName ? `${props.item?.extendName}文件` : '未知文件'} (.${props.item?.extendName || ''})`
          }}
        </div>
      </div>
      <div v-if="props.item?.music" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="iconamoon-music-2-fill" class="mr-2 text-4 color-[#4299e1]" />
          艺术家
        </div>
        <span>{{ props.item?.music?.singer || '' }}</span>
      </div>
      <div v-if="props.item?.music" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="iconamoon-music-2-fill" class="mr-2 text-4 color-[#4299e1]" />
          专辑
        </div>
        <span>{{ props.item?.music?.album || '' }}</span>
      </div>
      <div v-if="props.item?.music" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="iconamoon-music-2-fill" class="mr-2 text-4 color-[#4299e1]" />
          歌曲名称
        </div>
        <span>{{ props.item?.music?.songName || '' }}</span>
      </div>
      <div class="flex items-center">
        <div class="w-30 text-gray-500">大小</div>
        <div>{{ formatFileSize(props.item?.size || 0) }} ({{ props.item?.size || 0 }} 字节)</div>
      </div>
      <div class="flex items-center">
        <div class="w-30 text-gray-500">文件位置</div>
        <div>{{ props.item?.filePath || '' }}</div>
      </div>
      <div v-if="props.item?.video" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="bx-film" class="mr-2 text-4 color-[#4299e1]" />
          视频尺寸
        </div>
        <div>{{ props.item?.video?.width || '' }} x {{ props.item?.video?.height || '' }}</div>
      </div>
      <div v-if="props.item?.video" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="bx-film" class="mr-2 text-4 color-[#4299e1]" />
          视频码率
        </div>
        <div>{{ formatBitrate(props.item?.video?.bitrate) }}</div>
      </div>
      <div v-if="props.item?.video" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="bx-film" class="mr-2 text-4 color-[#4299e1]" />
          视频帧率
        </div>
        <div>{{ formatFrameRate(props.item?.video?.frameRate) }}</div>
      </div>
      <div v-if="props.item?.video" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="bx-film" class="mr-2 text-4 color-[#4299e1]" />
          视频时长
        </div>
        <div>{{ formatDuration(props.item?.video?.duration) }}</div>
      </div>
      <div v-if="props.item?.video" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="bx-film" class="mr-2 text-4 color-[#4299e1]" />
          视频格式
        </div>
        <div>{{ props.item?.video?.format || '' }}</div>
      </div>
      <div class="flex items-center">
        <div class="w-30 text-gray-500">创建时间</div>
        <div>{{ props.item?.createTime || '0' }}</div>
      </div>
      <div class="flex items-center">
        <div class="w-30 text-gray-500">修改时间</div>
        <div>{{ props.item?.updateTime || '0' }}</div>
      </div>
    </div>
  </NModal>
</template>
