<script lang="ts" setup>
import { ref } from 'vue';
import VueSimpleUploader from 'vue-simple-uploader';

defineOptions({
  name: 'GlobalUploaderList'
});

interface Props {
  fileList?: SimpleUploader.Uploader.File[];
}

const props = withDefaults(defineProps<Props>(), {
  publicApi: false,
  fileList: () => []
});

const { UploaderList } = VueSimpleUploader;
const collapse = ref(false);
</script>

<template>
  <UploaderList>
    <div
      class="fixed bottom-[2%] right-[2%] m-auto h-300px w-720px overflow-hidden border-[1px] border-[#e2e2e2] rounded-[7px_7px_0_0] border-solid bg-[#fff] c-black shadow-[0_0_10px_0_rgba(0,0,0,0.2)] transition-all duration-500 delay-0 ease-in-out .dark:bg-[#1e1e1e]"
      :class="{ collapse: collapse }"
    >
      <!-- 上传列表标题 -->
      <div class="h-3rem flex border-b-1px border-gray-3 p-[0_10px]">
        <h2 class="ml-3% select-none text-14px text-primary line-height-[3rem] dark:text-[#fff]">传输列表</h2>
        <div class="flex-[1] text-right">
          <NButton text class="ml-0 p-[16px_5px] text-25px c-primary">
            <template #icon>
              <icon-ep-position />
            </template>
          </NButton>
          <NButton text class="ml-0 p-[16px_5px] text-25px c-primary">
            <template #icon>
              <icon-ep:circle-close />
            </template>
          </NButton>
        </div>
      </div>
      <!-- 上传列表内容 -->
      <ul class="file-list">
        <li v-for="file in props.fileList" :key="file.id"></li>
        <div
          v-if="!props.fileList.length"
          class="flex flex-col items-center justify-center py-12 text-gray-500 lt-sm:py-8 dark:text-gray-400"
        >
          <icon-ep-upload class="mb-2 text-4xl opacity-50 lt-sm:mb-1 lt-sm:text-3xl" />
          暂无待传输文件
        </div>
      </ul>
    </div>
  </UploaderList>
</template>

<style scoped lang="scss">
.file-list {
  position: relative;
  max-height: 300px;
  /*height: 49px;*/
  overflow-x: hidden;
  list-style-type: none;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}
</style>
