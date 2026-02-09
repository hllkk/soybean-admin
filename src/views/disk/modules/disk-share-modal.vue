<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { NQrCode } from 'naive-ui';
import {
  fetchCancelShare,
  fetchCheckSubShareConflict,
  fetchCreateShare,
  fetchGetShareInfo
} from '@/service/api/disk/list';
import { useAppStore } from '@/store/modules/app';
import { useDiskStore } from '@/store/modules/disk';
import { handleCopy } from '@/utils/copy';

defineOptions({
  name: 'DiskShareModal'
});

interface Props {
  fileName?: string;
  fileIds?: CommonType.IdType[];
  fileItem?: Api.Disk.FileItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  fileName: '',
  fileIds: () => [],
  fileItem: null
});

const visible = defineModel<boolean>('visible', {
  default: false
});

const appStore = useAppStore();
const diskStore = useDiskStore();

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
const autoFillExtractCode = ref(true);
const shareInfo = ref<Api.Disk.ShareInfo | null>(null);
const sharedMode = ref(false);
const isCreating = ref(false);
const isLoadingShare = ref(false);
const isCanceling = ref(false);

const showExtractCode = computed(() => isPrivateLink.value);
const showCustomExtractInput = computed(() => extractCodeType.value === 'custom');
// const showCustomValidityInput = computed(() => validityPeriod.value === 'custom');
const shareLink = computed(() => {
  if (!shareInfo.value?.link) return '';
  return `${window.location.origin}${shareInfo.value.link}`;
});
const shareExtractCode = computed(() => shareInfo.value?.extractionCode || '');
const currentFileItem = computed(() => {
  if (props.fileItem) return props.fileItem;
  const fileId = props.fileIds?.[0];
  if (!fileId) return null;
  return diskStore.fileList.find(item => String(item.id) === String(fileId)) || null;
});
const isSharedView = computed(() => Boolean(shareInfo.value) || sharedMode.value);
const qrSize = computed(() => (appStore.isMobile ? 90 : 120));
const qrBoxSize = computed(() => qrSize.value + 40);
const rowClass = computed(() => (appStore.isMobile ? 'flex flex-col gap-2' : 'flex items-center'));
const labelClass = computed(() =>
  appStore.isMobile
    ? 'text-sm text-gray-700 font-medium dark:text-gray-300'
    : 'w-90px text-sm text-gray-700 font-medium dark:text-gray-300'
);
const inputClass = computed(() => (appStore.isMobile ? 'w-full' : 'flex-1'));

function validateShareType() {
  if (shareType.value !== 'link') {
    window.$message?.warning('当前仅支持链接分享');
    return false;
  }
  return true;
}

function getSelectedFileId() {
  if (!props.fileIds?.length) {
    window.$message?.error('请选择要分享的文件');
    return null;
  }
  if (props.fileIds.length !== 1) {
    window.$message?.error('仅支持单个文件或文件夹分享');
    return null;
  }
  const fileId = Number(props.fileIds[0]);
  if (!Number.isFinite(fileId)) {
    window.$message?.error('文件ID无效');
    return null;
  }
  return fileId;
}

function getCustomDays() {
  if (validityPeriod.value !== 'custom') return undefined;
  const days = Number(customValidityDays.value);
  if (!Number.isFinite(days) || days <= 0) {
    window.$message?.error('请输入有效的自定义天数');
    return null;
  }
  return days;
}

function getExtractionCode() {
  if (!isPrivateLink.value) return undefined;
  if (extractCodeType.value !== 'custom') return undefined;
  const code = customExtractCode.value.trim().toUpperCase();
  if (code.length !== 4) {
    window.$message?.error('自定义提取码需要4位');
    return null;
  }
  return code;
}

async function checkShareConflict(fileId: number) {
  if (!currentFileItem.value?.isDir) return true;
  const { data: conflictData, error: conflictError } = await fetchCheckSubShareConflict({ folderId: fileId });
  if (!conflictError && conflictData?.count) {
    window.$dialog?.warning({
      title: '分享冲突',
      content: `当前目录存在 ${conflictData.count} 个分享冲突，请先处理冲突后再分享`,
      positiveText: '知道了'
    });
    return false;
  }
  return true;
}

async function loadShareInfo() {
  shareInfo.value = null;
  const fileId = getSelectedFileId();
  if (!fileId) return;
  if (!currentFileItem.value?.isShare && !sharedMode.value) {
    return;
  }
  isLoadingShare.value = true;
  const { data, error } = await fetchGetShareInfo({ fileId });
  isLoadingShare.value = false;
  if (error) {
    sharedMode.value = false;
    return;
  }
  shareInfo.value = data;
  sharedMode.value = true;
  if (props.fileIds?.length) {
    diskStore.updateFileShareStatus(props.fileIds[0], true);
  }
}

function resetForm() {
  shareType.value = 'link';
  isPrivateLink.value = false;
  validityPeriod.value = '7';
  extractCodeType.value = 'random';
  customExtractCode.value = '';
  customValidityDays.value = '';
  autoFillExtractCode.value = true;
}

watch(
  () => visible.value,
  async val => {
    if (!val) {
      shareInfo.value = null;
      sharedMode.value = false;
      resetForm();
      return;
    }
    sharedMode.value = Boolean(currentFileItem.value?.isShare);
    await loadShareInfo();
  },
  { immediate: true }
);

async function handleCreateShare() {
  if (!validateShareType()) return;
  const fileId = getSelectedFileId();
  if (!fileId) return;
  const customDays = getCustomDays();
  if (customDays === null) return;
  const extractionCode = getExtractionCode();
  if (extractionCode === null) return;
  const allowShare = await checkShareConflict(fileId);
  if (!allowShare) return;
  autoFillExtractCode.value = isPrivateLink.value && extractCodeType.value === 'random';
  const params: Api.Disk.CreateShareRequest = {
    fileId,
    isPrivate: isPrivateLink.value,
    validity: validityPeriod.value,
    customDays,
    extractionCode,
    autoFillExtractCode: autoFillExtractCode.value,
    operationPermissionList: []
  };
  isCreating.value = true;
  const { data, error } = await fetchCreateShare(params);
  isCreating.value = false;
  if (error) {
    return;
  }
  shareInfo.value = data;
  sharedMode.value = true;
  window.$message?.success('创建分享成功');
  if (props.fileIds?.length) {
    diskStore.updateFileShareStatus(props.fileIds[0], true);
  }
}

async function handleCopyLink() {
  if (!shareLink.value) return;
  await handleCopy(shareLink.value);
}

async function handleCopyCode() {
  if (!shareExtractCode.value) return;
  await handleCopy(shareExtractCode.value);
}

async function handleCancelShare() {
  if (!shareInfo.value?.shareId) return;
  isCanceling.value = true;
  const { error } = await fetchCancelShare({ shareId: shareInfo.value.shareId });
  isCanceling.value = false;
  if (error) {
    return;
  }
  shareInfo.value = null;
  sharedMode.value = false;
  if (props.fileIds?.length) {
    diskStore.updateFileShareStatus(props.fileIds[0], false);
  }
  window.$message?.success('取消分享成功');
  visible.value = false;
}
</script>

<template>
  <div>
    <NModal
      v-model:show="visible"
      display-directive="show"
      class="max-w-60% lt-sm:max-w-96vw lt-sm:w-96vw"
      preset="card"
      closable
    >
      <template #header>
        <div class="flex items-center gap-2">
          <icon-ic-outline-share class="text-18px" />
          <span class="text-14px font-bold">{{ shareTitle }}</span>
        </div>
      </template>

      <div class="flex flex-col gap-6 lt-sm:gap-4">
        <div v-if="isLoadingShare" class="h-200px flex-center">
          <NSpin size="large" />
        </div>
        <div v-else-if="isSharedView" class="flex flex-col gap-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
            <div class="min-w-0 flex flex-col flex-1 gap-3">
              <div :class="rowClass">
                <span :class="labelClass">分享链接:</span>
                <NInput :class="inputClass" readonly :value="shareLink" />
              </div>
              <div v-if="shareInfo?.isPrivate" :class="rowClass">
                <span :class="labelClass">提取码:</span>
                <NInput :class="inputClass" readonly :value="shareExtractCode" />
              </div>
            </div>
            <div
              class="box-border flex flex-col flex-none items-center rounded-2 bg-gray-50 p-3 sm:self-start dark:bg-gray-800"
              :style="{ minWidth: `${qrBoxSize}px` }"
            >
              <div class="flex items-center justify-center" :style="{ width: `${qrSize}px`, height: `${qrSize}px` }">
                <NQrCode :value="shareLink" :size="qrSize" />
              </div>
              <span class="mt-2 text-xs text-gray-500 leading-none dark:text-gray-400">扫码访问</span>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col gap-2">
          <NTabs v-model:value="shareType" type="line" animated :size="appStore.isMobile ? 'small' : 'medium'">
            <NTabPane name="link" tab="链接分享">
              <div :class="rowClass">
                <span :class="labelClass">有效期:</span>
                <NTabs
                  v-model:value="validityPeriod"
                  type="segment"
                  animated
                  :size="appStore.isMobile ? 'small' : 'medium'"
                  class="mt-10px flex-1 lt-sm:w-full"
                >
                  <NTabPane name="1" tab="1天" />
                  <NTabPane name="7" tab="7天" />
                  <NTabPane name="30" tab="30天" />
                  <NTabPane name="365" tab="365天" />
                  <NTabPane name="forever" tab="永久有效" />
                </NTabs>
              </div>
              <div class="mt-10px" :class="rowClass">
                <span :class="labelClass">分享形式:</span>
                <NSwitch v-model:value="isPrivateLink">
                  <template #checked>私密链接</template>
                  <template #unchecked>公开链接</template>
                </NSwitch>
              </div>
              <div v-if="showExtractCode" class="mt-10px" :class="rowClass">
                <span :class="labelClass">提取码:</span>
                <div class="w-50% lt-sm:w-full">
                  <NTabs
                    v-model:value="extractCodeType"
                    type="segment"
                    animated
                    :size="appStore.isMobile ? 'small' : 'medium'"
                    class="mt-10px flex-1"
                  >
                    <NTabPane name="random" tab="随机提取码" />
                    <NTabPane name="custom" tab="自定义提取码" />
                  </NTabs>
                </div>
                <NInput
                  v-if="showCustomExtractInput"
                  v-model:value="customExtractCode"
                  maxlength="4"
                  show-count
                  clearable
                  placeholder="请输入自定义提取码"
                  class="ml-10px flex-1 lt-sm:ml-0 lt-sm:mt-8px"
                />
              </div>
            </NTabPane>
            <NTabPane name="group" tab="群组分享"></NTabPane>
            <NTabPane name="department" tab="部门分享"></NTabPane>
          </NTabs>
        </div>
      </div>

      <template #footer>
        <div class="w-full">
          <div class="flex flex-wrap gap-8px sm:justify-end">
            <NButton v-if="isSharedView" :loading="isCanceling" @click="handleCancelShare">取消分享</NButton>
            <NButton v-if="isSharedView" type="primary" @click="handleCopyLink">复制链接</NButton>
            <NButton v-if="isSharedView && shareInfo?.isPrivate" @click="handleCopyCode">复制提取码</NButton>
            <NButton v-else type="primary" :loading="isCreating" @click="handleCreateShare">创建分享</NButton>
          </div>
        </div>
      </template>
    </NModal>
  </div>
</template>
