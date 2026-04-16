<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { useSvgIcon } from '@/hooks/common/icon';

defineOptions({
  name: 'FileTypeMenu'
});

const { SvgIconVNode } = useSvgIcon();

interface Props {
  /** 显示容量开关 */
  showCapacity?: boolean;
  /** 已使用容量 (GB) */
  usedCapacity?: number;
  /** 总容量 (GB) */
  totalCapacity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showCapacity: false,
  usedCapacity: 0,
  totalCapacity: 0
});

const diskStore = useDiskStore();

// 计算容量百分比
const usedPercent = computed(() => {
  if (props.totalCapacity === 0) return 0;
  return Math.round((props.usedCapacity / props.totalCapacity) * 100);
});

// 容量数据
const capacityData = computed(() => ({
  used: props.usedCapacity,
  total: props.totalCapacity,
  usedPercent: usedPercent.value
}));

/** 文件类型列表 */
const fileTypeList = computed(() => [
  {
    name: $t('page.disk.fileType.all'),
    value: 'all',
    localIcon: 'disk-menu-file'
  },
  {
    name: $t('page.disk.fileType.image'),
    value: 'image',
    localIcon: 'disk-file-image'
  },
  {
    name: $t('page.disk.fileType.document'),
    value: 'document',
    localIcon: 'disk-file-txt'
  },
  {
    name: $t('page.disk.fileType.video'),
    value: 'video',
    localIcon: 'disk-file-video'
  },
  {
    name: $t('page.disk.fileType.audio'),
    value: 'audio',
    localIcon: 'disk-file-music'
  },
  {
    name: $t('page.disk.fileType.other'),
    value: 'other',
    localIcon: 'disk-file-other'
  }
]);

// 当前选中的文件类型
const selectedType = computed({
  get: () => diskStore.currentFileType,
  set: (val: Api.Disk.FileType) => diskStore.setFileType(val)
});

// 菜单选项配置
const menuOptions = computed(() => [
  {
    key: 'file-types',
    label: '文件类型',
    icon: SvgIconVNode({ icon: 'fluent-text-bullet-list-square-16-regular', fontSize: 20 }),
    children: fileTypeList.value.map(item => ({
      key: item.value,
      label: item.name,
      icon: SvgIconVNode({ localIcon: item.localIcon, fontSize: 30 })
    }))
  }
]);

// 默认展开的菜单
const expandedKeys = ref(['file-types']);

// 处理菜单选择
function handleMenuSelect(key: string) {
  if (key !== 'file-types') {
    selectedType.value = key as Api.Disk.FileType;
  }
}

// 容量进度条颜色
const capacityColor = computed(() => {
  const percent = usedPercent.value;
  if (percent < 50) return '#18a058'; // 绿色
  if (percent < 80) return '#2080f0'; // 蓝色
  if (percent < 90) return '#f0a020'; // 橙色
  return '#d03050'; // 红色
});

// 格式化容量显示
function formatSize(size: number): string {
  return `${size.toFixed(1)} GB`;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <NMenu
      v-model:expanded-keys="expandedKeys"
      :value="selectedType"
      :options="menuOptions"
      mode="vertical"
      :indent="12"
      class="flex-1 select-none"
      @update:value="handleMenuSelect"
    />

    <!-- 容量显示区域 - 固定在底部 -->
    <div v-if="props.showCapacity" class="mt-auto">
      <div class="p-12px rd-12px flex gap-16px items-center capacity-bg">
        <!-- 科技感容量环 -->
        <div class="relative size-80px">
          <div class="absolute inset-0 rd-full ring-bg" />
          <div
            class="absolute inset-4px rd-full"
            :style="{
              background: `conic-gradient(${capacityColor} 0deg, ${capacityColor} ${capacityData.usedPercent * 3.6}deg, transparent ${capacityData.usedPercent * 3.6}deg, transparent 360deg)`
            }"
          />
          <div class="absolute inset-12px rd-full flex-center ring-inner">
            <div class="flex items-baseline font-600">
              <span class="text-20px text-[var(--n-text-color)]">{{ capacityData.usedPercent }}</span>
              <span class="text-12px text-[var(--n-text-color-3)] ml-2px">%</span>
            </div>
          </div>
        </div>

        <!-- 容量信息 -->
        <div class="flex-1">
          <div class="flex items-center gap-6px text-14px font-500 mb-12px text-[var(--n-text-color)]">
            <SvgIcon icon="mdi:cloud-outline" class="text-18px text-[#2080f0]" />
            <span>存储空间</span>
          </div>

          <div class="flex gap-16px mb-12px">
            <div class="flex flex-col gap-2px">
              <span class="text-12px text-[var(--n-text-color-3)]">已使用</span>
              <span class="text-14px font-600" :style="{ color: capacityColor }">
                {{ formatSize(capacityData.used) }}
              </span>
            </div>
            <div class="flex flex-col gap-2px">
              <span class="text-12px text-[var(--n-text-color-3)]">总容量</span>
              <span class="text-14px font-600 text-[var(--n-text-color)]">{{ formatSize(capacityData.total) }}</span>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="relative h-6px rd-3px overflow-hidden">
            <div class="absolute inset-0 rd-3px bar-bg" />
            <div
              class="absolute left-0 top-0 bottom-0 rd-3px bar-progress"
              :style="{
                width: `${capacityData.usedPercent}%`,
                background: capacityColor
              }"
            >
              <div class="absolute right-0 top--2px bottom--2px w-12px bar-glow" :style="{ background: capacityColor }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-menu-item-content) {
  .n-menu-item-content__icon {
    width: 48px !important;
  }
}
// 仅保留需要动态样式或复杂效果的 SCSS（渐变、阴影、动画等）
.capacity-bg {
  background: linear-gradient(135deg, rgba(18, 160, 88, 0.05) 0%, rgba(32, 80, 240, 0.05) 100%);
}

.ring-bg {
  background: rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
}

.ring-inner {
  background: var(--n-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bar-bg {
  background: rgba(0, 0, 0, 0.08);
}

.bar-progress {
  transition: width 0.3s ease;
}

.bar-glow {
  filter: blur(4px);
  opacity: 0.6;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
