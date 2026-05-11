<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchCreateShare, fetchCancelShare } from '@/service/api/disk/share';
import { fetchGetUserSelect } from '@/service/api/system/user';
import { fetchCreateInternalShare } from '@/service/api/disk/internal-share';
import { formatFileSize } from '@/utils/format';
import { handleCopy } from '@/utils/copy';
import DeptTree from '@/components/custom/dept-tree.vue';
import FileIcon from './file-icon.vue';

defineOptions({
  name: 'ShareDialog'
});

interface Props {
  existingShare?: Api.Disk.ShareResult | null;
}

const props = withDefaults(defineProps<Props>(), {
  existingShare: null
});

interface Emits {
  (e: 'success', result: Api.Disk.ShareResult): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

// 有效期选项（后端期望的值：1/7/30/365/forever）
const validityOptions = computed(() => [
  { label: $t('page.disk.share.oneDay'), value: '1' },
  { label: $t('page.disk.share.sevenDays'), value: '7' },
  { label: $t('page.disk.share.thirtyDays'), value: '30' },
  { label: $t('page.disk.share.forever'), value: 'forever' }
]);

const shareTypeOptions = computed(() => [
  { label: $t('page.disk.share.publicLink'), value: 'public' },
  { label: $t('page.disk.share.privateLink'), value: 'private' }
]);

const codeModeOptions = computed(() => [
  { label: $t('page.disk.share.randomGenerate'), value: 'random' },
  { label: $t('page.disk.share.customCode'), value: 'custom' }
]);

// 配置状态
const validity = ref('7');
const shareType = ref('public');
const codeMode = ref('random');
const randomCode = ref('');
const customCode = ref('');
const customAddressEnabled = ref(false);
const customAddress = ref('');
const loading = ref(false);

// Tab management
const activeTab = ref('link');

// Share to user tab
const selectedUsers = ref<number[]>([]);
const userOptions = ref<{ label: string; value: number }[]>([]);
const userLoading = ref(false);
const userPermissions = ref<string[]>(['DOWNLOAD']);

// Share to dept tab
const selectedDepts = ref<number[]>([]);
const deptPermissions = ref<string[]>(['DOWNLOAD']);

// Common for internal share
const internalRemark = ref('');

// 待分享的文件
const shareFile = computed(() => diskStore.shareFile);

// 是否已有链接分享
const hasExistingShare = computed(() => !!props.existingShare);

// 已有分享的完整链接
const existingShareLink = computed(() => {
  if (!props.existingShare) return '';
  const baseUrl = window.location.origin;
  return `${baseUrl}${props.existingShare.link}`;
});

// 是否私密分享
const isPrivate = computed(() => shareType.value === 'private');

// 提取码验证
const codeValid = computed(() => {
  if (!isPrivate.value) return true;
  if (codeMode.value === 'random') return randomCode.value.length === 4;
  return /^[a-zA-Z0-9]{4}$/.test(customCode.value);
});

// 自定义地址验证
const addressValid = computed(() => {
  if (!customAddressEnabled.value) return true;
  if (!customAddress.value) return false;
  return /^[a-zA-Z0-9_-]{3,32}$/.test(customAddress.value);
});

// 最终分享链接预览
const shareLinkPreview = computed(() => {
  const shortId = customAddressEnabled.value && customAddress.value ? customAddress.value : 'xxxxxx';
  return `/s/${shortId}`;
});

// 整体表单验证
const formValid = computed(() => {
  if (!shareFile.value) return false;
  if (!codeValid.value) return false;
  if (!addressValid.value) return false;
  return true;
});

// 文件信息展示
const fileInfo = computed(() => {
  if (!shareFile.value) return null;
  return {
    name: shareFile.value.fileName,
    type: shareFile.value.isFolder ? 'folder' : shareFile.value.fileType,
    extension: shareFile.value.fileExtension,
    size: shareFile.value.fileSize
  };
});

function generateRandomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345789';
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

async function loadUserOptions() {
  if (userOptions.value.length > 0) return;
  userLoading.value = true;
  const { data } = await fetchGetUserSelect();
  if (data) {
    userOptions.value = data.map(u => ({
      label: u.nickName ? `${u.nickName}（${u.userName}）` : u.userName,
      value: u.userId as number
    }));
  }
  userLoading.value = false;
}

const canSubmit = computed(() => {
  if (!shareFile.value) return false;
  if (activeTab.value === 'link' && hasExistingShare.value) return false;
  if (activeTab.value === 'link') return formValid.value;
  if (activeTab.value === 'user') return selectedUsers.value.length > 0;
  if (activeTab.value === 'dept') return selectedDepts.value.length > 0;
  return false;
});

watch(() => diskStore.shareDialogVisible, visible => {
  if (visible) {
    validity.value = '7';
    shareType.value = 'public';
    codeMode.value = 'random';
    randomCode.value = generateRandomCode();
    customCode.value = '';
    customAddressEnabled.value = false;
    customAddress.value = '';
    selectedUsers.value = [];
    selectedDepts.value = [];
    internalRemark.value = '';
    userPermissions.value = ['DOWNLOAD'];
    deptPermissions.value = ['DOWNLOAD'];
    // 已有链接分享时默认切到用户分享 Tab
    activeTab.value = hasExistingShare.value ? 'user' : 'link';
  }
});

function handleCancel() {
  diskStore.closeShareDialog();
}

async function handleConfirm() {
  if (activeTab.value === 'link') {
    await handleLinkShare();
  } else if (activeTab.value === 'user') {
    await handleUserShare();
  } else if (activeTab.value === 'dept') {
    await handleDeptShare();
  }
}

async function handleLinkShare() {
  if (!formValid.value || !shareFile.value) return;
  loading.value = true;
  const fileIdNum = typeof shareFile.value.fileId === 'string'
    ? parseInt(shareFile.value.fileId, 10)
    : shareFile.value.fileId;
  const params: Api.Disk.CreateShareParams = {
    fileId: fileIdNum,
    isPrivate: isPrivate.value,
    validity: validity.value,
    autoFillExtractCode: isPrivate.value && codeMode.value === 'random',
    extractionCode: isPrivate.value ? (codeMode.value === 'custom' ? customCode.value : randomCode.value) : undefined,
    customAddress: customAddressEnabled.value ? customAddress.value : undefined
  };
  const { data, error } = await fetchCreateShare(params);
  loading.value = false;
  if (!error && data) {
    emit('success', data);
    diskStore.closeShareDialog();
  }
}

async function handleUserShare() {
  if (!shareFile.value || selectedUsers.value.length === 0) return;
  loading.value = true;
  const fileIdNum = typeof shareFile.value.fileId === 'string'
    ? parseInt(shareFile.value.fileId, 10) : shareFile.value.fileId;
  const { error } = await fetchCreateInternalShare({
    fileId: fileIdNum,
    shareType: 'user',
    targetIds: selectedUsers.value,
    permissions: userPermissions.value,
    remark: internalRemark.value
  });
  loading.value = false;
  if (!error) {
    window.$message?.success('共享成功');
    diskStore.closeShareDialog();
  }
}

async function handleDeptShare() {
  if (!shareFile.value || selectedDepts.value.length === 0) return;
  loading.value = true;
  const fileIdNum = typeof shareFile.value.fileId === 'string'
    ? parseInt(shareFile.value.fileId, 10) : shareFile.value.fileId;
  const { error } = await fetchCreateInternalShare({
    fileId: fileIdNum,
    shareType: 'dept',
    targetIds: selectedDepts.value,
    permissions: deptPermissions.value,
    remark: internalRemark.value
  });
  loading.value = false;
  if (!error) {
    window.$message?.success('共享成功');
    diskStore.closeShareDialog();
  }
}

async function handleCancelExistingShare() {
  if (!props.existingShare?.shareId) return;
  loading.value = true;
  const { error } = await fetchCancelShare(props.existingShare.shareId);
  loading.value = false;
  if (!error) {
    window.$message?.success($t('page.disk.share.cancelSuccess'));
    diskStore.closeShareDialog();
  }
}

function handleCopyExistingLink() {
  handleCopy(existingShareLink.value);
}
</script>

<template>
  <NModal
    v-model:show="diskStore.shareDialogVisible"
    preset="card"
    :title="$t('page.disk.share.configTitle')"
    style="width: 90%; max-width: 480px"
    :mask-closable="false"
    :bordered="false"
  >
    <div class="flex flex-col gap-16px">
      <!-- 文件信息 -->
      <div v-if="fileInfo" class="flex items-center gap-12px p-12px rounded bg-gray-50 dark:bg-gray-800">
        <FileIcon
          :file-type="fileInfo.type"
          :extension="fileInfo.extension"
          size="medium"
        />
        <div class="flex-1 min-w-0">
          <div class="text-14px font-medium truncate">{{ fileInfo.name }}</div>
          <div class="text-12px opacity-60">
            {{ fileInfo.type === 'folder' ? $t('page.disk.file.folder') : formatFileSize(fileInfo.size) }}
          </div>
        </div>
      </div>

      <!-- 已有链接分享状态条 -->
      <div v-if="hasExistingShare" class="flex items-center gap-8px p-10px rounded bg-primary/8 dark:bg-primary/15">
        <SvgIcon icon="mdi:link-variant" :size="18" class="text-primary shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="text-13px">
            <span class="opacity-70">链接分享：</span>
            <span class="font-mono text-12px select-all">{{ existingShareLink }}</span>
          </div>
          <div v-if="props.existingShare?.isPrivate && props.existingShare.extractionCode" class="text-12px opacity-60 mt-2px">
            提取码：{{ props.existingShare.extractionCode }}
          </div>
        </div>
        <NButton quaternary size="tiny" @click="handleCopyExistingLink">
          <template #icon><SvgIcon icon="mdi:content-copy" :size="14" /></template>
        </NButton>
        <NButton quaternary size="tiny" type="error" :loading="loading" @click="handleCancelExistingShare">
          <template #icon><SvgIcon icon="mdi:close-circle-outline" :size="14" /></template>
        </NButton>
      </div>

      <!-- Share Type Tabs -->
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Link Share Tab -->
        <NTabPane name="link" tab="链接分享" :disabled="hasExistingShare">
          <div v-if="hasExistingShare" class="text-13px opacity-50 py-8px text-center">
            已创建链接分享，如需修改请先取消现有链接
          </div>
          <div v-else class="flex flex-col gap-16px">
            <!-- 有效期设置 -->
            <div>
              <div class="text-13px opacity-70 mb-8px">{{ $t('page.disk.share.validity') }}</div>
              <NTabs v-model:value="validity" type="segment" size="small">
                <NTabPane v-for="opt in validityOptions" :key="opt.value" :name="opt.value" :tab="opt.label" />
              </NTabs>
            </div>

            <!-- 分享形式 -->
            <div>
              <div class="text-13px opacity-70 mb-8px">{{ $t('page.disk.share.shareType') }}</div>
              <NTabs v-model:value="shareType" type="segment" size="small">
                <NTabPane v-for="opt in shareTypeOptions" :key="opt.value" :name="opt.value" :tab="opt.label" />
              </NTabs>
            </div>

            <!-- 提取码设置（私密分享时显示） -->
            <div v-if="isPrivate">
              <div class="text-13px opacity-70 mb-8px">{{ $t('page.disk.share.extractionCode') }}</div>
              <NTabs v-model:value="codeMode" type="segment" size="small">
                <NTabPane v-for="opt in codeModeOptions" :key="opt.value" :name="opt.value" :tab="opt.label" />
              </NTabs>

              <div v-if="codeMode === 'random'" class="flex items-center gap-12px mt-12px">
                <div class="flex-1 text-center">
                  <span class="inline-block px-16px py-8px text-18px font-bold tracking-widest rounded bg-primary/10 text-primary">
                    {{ randomCode }}
                  </span>
                </div>
                <NButton quaternary size="small" @click="randomCode = generateRandomCode()">
                  {{ $t('page.disk.share.regenerate') }}
                </NButton>
              </div>

              <div v-else class="mt-12px">
                <NInput
                  v-model:value="customCode"
                  :placeholder="$t('page.disk.share.extractionCode')"
                  :maxlength="4"
                  size="large"
                  class="text-center"
                  @input="customCode = customCode.replace(/[^a-zA-Z0-9]/g, '')"
                />
                <div v-if="customCode && !codeValid" class="text-12px text-error mt-4px">
                  提取码需为4位字母或数字组合
                </div>
              </div>
            </div>

            <!-- 自定义地址 -->
            <div>
              <div class="flex items-center justify-between mb-8px">
                <span class="text-13px opacity-70">{{ $t('page.disk.share.customAddress') }}</span>
                <NSwitch v-model:value="customAddressEnabled" size="small" />
              </div>
              <div v-if="customAddressEnabled" class="flex items-center gap-8px">
                <span class="text-14px opacity-60 whitespace-nowrap">/s/</span>
                <NInput
                  v-model:value="customAddress"
                  :placeholder="$t('page.disk.share.customAddressPlaceholder')"
                  :maxlength="32"
                  class="flex-1 min-w-0"
                  @input="customAddress = customAddress.replace(/[^a-zA-Z0-9_-]/g, '')"
                />
              </div>
              <div v-if="customAddressEnabled && customAddress && !addressValid" class="text-12px text-error mt-4px">
                地址需为3-32位字母、数字、下划线或中划线组合
              </div>
              <div class="text-12px opacity-50 mt-8px">
                链接预览: {{ shareLinkPreview }}
              </div>
            </div>
          </div>
        </NTabPane>

        <!-- Share to User Tab -->
        <NTabPane name="user" tab="共享给用户">
          <div class="flex flex-col gap-12px mt-8px">
            <div>
              <div class="text-13px opacity-70 mb-8px">选择用户</div>
              <NSelect
                v-model:value="selectedUsers"
                :options="userOptions"
                :loading="userLoading"
                multiple
                filterable
                placeholder="搜索并选择用户"
              />
            </div>
            <div>
              <div class="text-13px opacity-70 mb-8px">权限</div>
              <NCheckboxGroup v-model:value="userPermissions">
                <NSpace>
                  <NCheckbox value="DOWNLOAD">下载</NCheckbox>
                  <NCheckbox value="UPLOAD">上传</NCheckbox>
                  <NCheckbox value="PUT">编辑</NCheckbox>
                  <NCheckbox value="DELETE">删除</NCheckbox>
                </NSpace>
              </NCheckboxGroup>
            </div>
            <div>
              <div class="text-13px opacity-70 mb-8px">备注</div>
              <NInput v-model:value="internalRemark" type="textarea" placeholder="可选备注" :rows="2" />
            </div>
          </div>
        </NTabPane>

        <!-- Share to Dept Tab -->
        <NTabPane name="dept" tab="共享给部门">
          <div class="flex flex-col gap-12px mt-8px">
            <div>
              <div class="text-13px opacity-70 mb-8px">选择部门</div>
              <DeptTree v-model:value="selectedDepts" :immediate="true" />
            </div>
            <div>
              <div class="text-13px opacity-70 mb-8px">权限</div>
              <NCheckboxGroup v-model:value="deptPermissions">
                <NSpace>
                  <NCheckbox value="DOWNLOAD">下载</NCheckbox>
                  <NCheckbox value="UPLOAD">上传</NCheckbox>
                  <NCheckbox value="PUT">编辑</NCheckbox>
                  <NCheckbox value="DELETE">删除</NCheckbox>
                </NSpace>
              </NCheckboxGroup>
            </div>
            <div>
              <div class="text-13px opacity-70 mb-8px">备注</div>
              <NInput v-model:value="internalRemark" type="textarea" placeholder="可选备注" :rows="2" />
            </div>
          </div>
        </NTabPane>
      </NTabs>
    </div>

    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" :disabled="!canSubmit" @click="handleConfirm">
          {{ $t('page.disk.share.createShare') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
