<script lang="ts" setup>
import { ref } from 'vue';
import FileImage from './disk-image.vue';

defineOptions({
  name: 'FileDiskplayGrid'
});

interface Props {
  data?: Api.Disk.FileItem[];
  selectedFileIds?: string[];
  isBatchMode?: boolean;
}

const isLoading = ref<boolean>(false);

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  selectedFileIds: () => [],
  isBatchMode: false
});
</script>

<template>
  <NGrid cols="4 s:5 m:6 l:7 xl:8 xxl:9" :x-gap="30" :y-gap="30" item-responsive responsive="screen">
    <NGridItem v-for="item in props.data" :key="item.id">
      <div class="pos-relative mt-12px h-150px w-auto hover:bg-primary-100 dark:hover:bg-[rgba(255,255,255,0.1)]">
        <!-- 顶部操作内容，悬停展示-->
        <div class="hover-info">
          <div class="flex justify-between">
            <div class="ml-1 mt-1">
              <NCheckbox size="small"></NCheckbox>
            </div>
            <div class="mr-1 mt-1 w-40px flex-x-center rounded-md bg-white dark:bg-[rgba(255,255,255,0.1)]">
              <NButtonGroup>
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
              </NButtonGroup>
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
