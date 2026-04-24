<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCancelShare } from '@/service/api/disk/share';
import { handleCopy } from '@/utils/copy';

defineOptions({
  name: 'ShareResultDialog'
});

interface Props {
  visible: boolean;
  result: Api.Disk.ShareResult | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'cancelled'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);

// 分享链接（完整URL）
const shareLink = computed(() => {
  if (!props.result) return '';
  const baseUrl = window.location.origin;
  return `${baseUrl}${props.result.link}`;
});

// 是否私密分享
const isPrivate = computed(() => props.result?.isPrivate ?? false);

// 提取码
const extractionCode = computed(() => props.result?.extractionCode ?? '');

// 口令文本（链接 + 提取码）
const shareText = computed(() => {
  if (!props.result) return '';
  if (isPrivate.value && extractionCode.value) {
    return $t('page.disk.share.shareTextTemplate', { link: shareLink.value, code: extractionCode.value });
  }
  return $t('page.disk.share.shareTextTemplate', { link: shareLink.value, code: '' });
});

// 复制提取码
function handleCopyCode() {
  if (!extractionCode.value) return;
  handleCopy(extractionCode.value);
}

// 复制口令
function handleCopyText() {
  handleCopy(shareText.value);
}

// 复制链接
function handleCopyLink() {
  handleCopy(shareLink.value);
}

// 取消分享
async function handleCancelShare() {
  if (!props.result?.shareId) return;

  loading.value = true;
  const { error } = await fetchCancelShare(props.result.shareId);
  loading.value = false;

  if (!error) {
    window.$message?.success($t('page.disk.share.cancelSuccess'));
    emit('cancelled');
    handleClose();
  }
}

// 关闭对话框
function handleClose() {
  emit('update:visible', false);
}

// 监听关闭，重置状态
watch(() => props.visible, visible => {
  if (!visible) {
    loading.value = false;
  }
});
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="$t('page.disk.share.resultTitle')"
    style="width: 90%; max-width: 480px"
    :mask-closable="false"
    :bordered="false"
    @update:show="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-16px">
      <!-- 成功提示 -->
      <div class="flex items-center gap-12px p-12px rounded bg-success/10 text-success">
        <SvgIcon icon="mdi:check-circle" :size="24" />
        <span class="text-14px font-medium">{{ $t('page.disk.share.createSuccess') }}</span>
      </div>

      <!-- 分享链接 -->
      <div>
        <div class="text-13px opacity-70 mb-8px">{{ $t('page.disk.share.shareLink') }}</div>
        <div class="flex items-center gap-8px">
          <NInput :value="shareLink" readonly class="flex-1" />
          <NButton quaternary @click="handleCopyLink">
            <template #icon>
              <SvgIcon icon="mdi:content-copy" :size="18" />
            </template>
          </NButton>
        </div>
      </div>

      <!-- 提取码（私密分享时显示） -->
      <div v-if="isPrivate && extractionCode">
        <div class="text-13px opacity-70 mb-8px">{{ $t('page.disk.share.extractionCode') }}</div>
        <div class="flex items-center gap-12px">
          <span class="inline-block px-16px py-8px text-18px font-bold tracking-widest rounded bg-primary/10 text-primary">
            {{ extractionCode }}
          </span>
          <NButton quaternary size="small" @click="handleCopyCode">
            {{ $t('page.disk.share.copyExtractionCode') }}
          </NButton>
        </div>
      </div>

      <!-- 口令复制 -->
      <div class="flex justify-center">
        <NButton type="primary" @click="handleCopyText">
          <template #icon>
            <SvgIcon icon="mdi:content-copy" :size="18" />
          </template>
          {{ $t('page.disk.share.copyShareText') }}
        </NButton>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between gap-8px">
        <NButton :loading="loading" @click="handleCancelShare">
          {{ $t('page.disk.share.cancelShare') }}
        </NButton>
        <NButton @click="handleClose">
          {{ $t('page.disk.share.close') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
