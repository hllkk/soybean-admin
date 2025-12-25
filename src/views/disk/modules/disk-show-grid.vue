<script lang="ts" setup>
import { ref, watch } from 'vue';
import FileImage from './disk-image.vue';
import { CreatingItem } from '@/store/modules/disk';

defineOptions({
  name: 'FileDiskplayGrid'
});

interface Props {
  data?: Api.Disk.FileItem[];
  selectedFileIds?: string[];
  isBatchMode?: boolean;
  creatingItem?: Api.Disk.FileItem | null;
}

interface Emits {
  (e: 'confirmCreate', name: string): void;
  (e: 'cancelCreate'): void;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  selectedFileIds: () => [],
  isBatchMode: false
});

const emit = defineEmits<Emits>();

const isLoading = ref<boolean>(false);
const inputRef = ref<HTMLInputElement | null>(null);
const creatingName = ref('');

function handleConfirm() {
  emit('confirmCreate', creatingName.value);
}

function handleCancel() {
  emit('cancelCreate');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleConfirm();
  } else if (e.key === 'Escape') {
    handleCancel();
  }
}

watch(() => props.creatingItem, (newItem) => {
  if (newItem) {
    creatingName.value = `${newItem.name}${newItem.extendName}`;
    setTimeout(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    }, 100);
  } else {
    creatingName.value = '';
  }
}, { immediate: true });
</script>

<template>
  <NGrid cols="4 s:5 m:6 l:7 xl:8 xxl:9" :x-gap="30" :y-gap="30" item-responsive responsive="screen">
    <!-- 正在创建的项目（显示在最前面） -->
    <NGridItem v-if="creatingItem" :key="creatingItem.id">
      <div class="pos-relative mt-12px h-150px w-auto bg-primary-50 dark:bg-[rgba(255,255,255,0.05)]">
        <!-- 顶部操作按钮 -->
        <div class="flex justify-between">
          <div class="ml-1 mt-1">
            <NCheckbox size="small" disabled></NCheckbox>
          </div>
          <div class="mr-1 mt-1 gap-1 w-40px flex-x-center rounded-md bg-white dark:bg-[rgba(255,255,255,0.1)]">
            <NButton size="tiny" text @click="handleConfirm">
              <template #icon>
                <icon-mdi-check class="text-primary" />
              </template>
            </NButton>
            <NButton size="tiny" text @click="handleCancel">
              <template #icon>
                <icon-mdi-close class="text-primary" />
              </template>
            </NButton>
          </div>
        </div>
        <!-- 图标 -->
        <div class=" mt-8px h-65px flex-x-center">
          <FileImage :data="creatingItem" />
        </div>
        <!-- 输入框 -->
        <div class="mt-12px flex-x-center px-2">
          <NInput
            ref="inputRef"
            v-model:value="creatingName"
            size="tiny"
            :placeholder="creatingItem.isDir ? '文件夹名称' : '文件名称'"
            @keydown="handleKeydown"
          />
        </div>
      </div>
    </NGridItem>
    <NGridItem v-for="item in props.data" :key="item.id">
      <div class="pos-relative mt-12px h-150px w-auto hover:bg-primary-100 dark:hover:bg-[rgba(255,255,255,0.1)]">
        <!-- 顶部操作内容，悬停展示-->
        <div class="hover-info">
          <div class="flex justify-between">
            <div class="ml-1 mt-1">
              <NCheckbox size="small"></NCheckbox>
            </div>
            <div class="mr-1 mt-1 gap-1 w-40px flex-x-center rounded-md bg-white dark:bg-[rgba(255,255,255,0.1)]">
                <NButton size="tiny" text>
                  <template #icon>
                    <icon-solar-share-outline class="text-primary" />
                  </template>
                </NButton>
                <NButton size="tiny" text>
                  <template #icon>
                    <icon-material-symbols-download-rounded class="text-primary" />
                  </template>
                </NButton>
            </div>
          </div>
        </div>
        <div class="mt-8px h-65px flex-x-center">
          <NSkeleton v-if="isLoading" :sharp="false" size="medium" :width="60" :height="60"></NSkeleton>
          <FileImage v-else :data="item" />
        </div>
        <div class="mt-12px flex-x-center select-none text-ellipsis text-center text-12px">
          <NSkeleton v-if="isLoading" :width="60" :sharp="false" text />
          <p v-else>{{ item.name }}</p>
        </div>
      </div>
    </NGridItem>
  </NGrid>
</template>

<style scoped>
.hover-info {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pos-relative:hover .hover-info {
  opacity: 1;
}
</style>
