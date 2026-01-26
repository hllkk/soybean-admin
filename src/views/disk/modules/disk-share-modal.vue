<script lang="ts" setup>
import { computed, ref } from 'vue';

defineOptions({
  name: 'DiskShareModal'
});

interface Props {
  fileName?: string;
  fileIds?: CommonType.IdType[];
}

const props = withDefaults(defineProps<Props>(), {
  fileName: '',
  fileIds: () => []
});

const visible = defineModel<boolean>('visible', {
  default: false
});

const shareTitle = computed(() => {
  if (!props.fileName) return '分享文件(夹)';
  if (props.fileIds.length === 1) return `分享文件(夹): ${props.fileName}`;
  return `分享文件(夹):${props.fileName}等 ${props.fileIds.length} 个文件(夹)`;
});

const shareType = ref<'link' | 'group' | 'department'>('link');
const isPrivateLink = ref(false);
const validityPeriod = ref<'1' | '7' | '30' | '365' | 'forever' | 'custom'>('7');
const extractCodeType = ref<'random' | 'custom'>('random');
const customExtractCode = ref('');
const customValidityDays = ref('');

const showExtractCode = computed(() => isPrivateLink.value);
const showCustomExtractInput = computed(() => extractCodeType.value === 'custom');
const showCustomValidityInput = computed(() => validityPeriod.value === 'custom');

function handleCreateShare() {
  console.log('创建分享', {
    shareType: shareType.value,
    isPrivateLink: isPrivateLink.value,
    validityPeriod: validityPeriod.value,
    extractCodeType: extractCodeType.value,
    customExtractCode: customExtractCode.value,
    customValidityDays: customValidityDays.value,
    fileIds: props.fileIds
  });
  visible.value = false;
}
</script>

<template>
  <div>
    <NModal v-model:show="visible" display-directive="show" class="max-w-40%" preset="card">
      <template #header>
        <div class="flex items-center gap-2">
          <icon-ic-outline-share class="text-18px" />
          <span class="text-14px font-bold">{{ shareTitle }}</span>
        </div>
      </template>

      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-gray-700 font-medium dark:text-gray-300">分享类型</span>
          <NTabs v-model:value="shareType" type="segment" animated size="medium">
            <NTabPane name="link" tab="链接分享" />
            <NTabPane name="group" tab="群组分享" />
            <NTabPane name="department" tab="部门分享" />
          </NTabs>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700 font-medium dark:text-gray-300">分享形式</span>
            <NSwitch
              v-model:value="isPrivateLink"
              :rail-style="
                ({ checked, focused }) => ({
                  backgroundColor: checked ? '#2080f0' : '#e5e7eb',
                  boxShadow: focused ? '0 0 0 2px #2080f040' : 'none'
                })
              "
            >
              <template #checked>私密链接</template>
              <template #unchecked>公开链接</template>
            </NSwitch>
            <NTooltip trigger="hover">
              <template #trigger>
                <icon-mdi-help-circle-outline
                  class="cursor-help text-16px text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                />
              </template>
              <span>私密链接需要提取码，公开链接不需要</span>
            </NTooltip>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-sm text-gray-700 font-medium dark:text-gray-300">有效期</span>
          <NTabs v-model:value="validityPeriod" type="segment" animated size="medium">
            <NTabPane name="1" tab="1天" />
            <NTabPane name="7" tab="7天" />
            <NTabPane name="30" tab="30天" />
            <NTabPane name="365" tab="365天" />
            <NTabPane name="forever" tab="永久有效" />
            <NTabPane name="custom" tab="自定义" />
          </NTabs>
          <div v-if="showCustomValidityInput" class="mt-2">
            <NInput v-model:value="customValidityDays" placeholder="请输入有效天数" :min="1" :max="3650">
              <template #suffix>天</template>
            </NInput>
          </div>
        </div>

        <div v-if="showExtractCode" class="flex flex-col gap-2">
          <span class="text-sm text-gray-700 font-medium dark:text-gray-300">提取码</span>
          <NTabs v-model:value="extractCodeType" type="segment" animated size="medium">
            <NTabPane name="random" tab="随机生成" />
            <NTabPane name="custom" tab="自定义" />
          </NTabs>
          <div v-if="showCustomExtractInput" class="mt-2">
            <NInput v-model:value="customExtractCode" placeholder="请输入4位提取码" maxlength="4" show-count />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="visible = false">取消</NButton>
          <NButton type="primary" @click="handleCreateShare">创建分享</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
