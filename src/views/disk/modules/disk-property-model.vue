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
          <SvgIcon icon="iconamoon-music-2-fill" class="mr-2 color-[#4299e1]" />
          艺术家
        </div>
        <span>{{ props.item?.music?.singer || '' }}</span>
      </div>
      <div v-if="props.item?.music" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="iconamoon-music-2-fill" class="mr-2 color-[#4299e1]" />
          专辑
        </div>
        <span>{{ props.item?.music?.album || '' }}</span>
      </div>
      <div v-if="props.item?.music" class="flex items-center">
        <div class="w-30 flex items-center text-gray-500">
          <SvgIcon icon="iconamoon-music-2-fill" class="mr-2 color-[#4299e1]" />
          歌曲名称
        </div>
        <span>{{ props.item?.music?.songName || '' }}</span>
      </div>
      <div class="flex items-center">
        <div class="w-30 text-gray-500">大小</div>
        <div>{{ formatFileSize(props.item?.size || 0) }} ({{ props.item?.size || 0 }} 字节)</div>
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
