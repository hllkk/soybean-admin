<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchCreateShare } from '@/service/api/disk/share';
import { fetchGetUserSelect } from '@/service/api/system/user';
import { fetchCreateInternalShare } from '@/service/api/disk/internal-share';
import { formatFileSize } from '@/utils/format';
import DeptTree from '@/components/custom/dept-tree.vue';
import FileIcon from './file-icon.vue';

defineOptions({
  name: 'ShareDialog'
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

// 分享形式选项
const shareTypeOptions = computed(() => [
  { label: $t('page.disk.share.publicLink'), value: 'public' },
  { label: $t('page.disk.share.privateLink'), value: 'private' }
]);

// 提取码模式选项
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

// 是否私密分享
const isPrivate = computed(() => shareType.value === 'private');

// 最终提取码（用于显示）
const _extractionCode = computed(() => {
  if (!isPrivate.value) return '';
  return codeMode.value === 'random' ? randomCode.value : customCode.value;
});

// 提取码验证
const codeValid = computed(() => {
  if (!isPrivate.value) return true;
  if (codeMode.value === 'random') return randomCode.value.length === 4;
  // 自定义：4位大小写字母和数字组合
  return /^[a-zA-Z0-9]{4}$/.test(customCode.value);
});

// 自定义地址验证（字母、数字、中划线、下划线，至少3位）
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

/** 生成随机提取码（4位大小写字母和数字，使用 crypto.getRandomValues） */
function generateRandomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 4;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

/** 重新生成随机提取码 */
function regenerateCode() {
  randomCode.value = generateRandomCode();
}

/** Load user options for share to user tab */
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

onMounted(() => {
  loadUserOptions();
});

/** Computed for submit button state */
const canSubmit = computed(() => {
  if (!shareFile.value) return false;
  if (activeTab.value === 'link') return formValid.value;
  if (activeTab.value === 'user') return selectedUsers.value.length > 0;
  if (activeTab.value === 'dept') return selectedDepts.value.length > 0;
  return false;
});

// 监听对话框打开
watch(() => diskStore.shareDialogVisible, visible => {
  if (visible) {
    // 重置默认值
    validity.value = '7';
    shareType.value = 'public';
    codeMode.value = 'random';
    randomCode.value = generateRandomCode();
    customCode.value = '';
    customAddressEnabled.value = false;
    customAddress.value = '';
    activeTab.value = 'link';
    selectedUsers.value = [];
    selectedDepts.value = [];
    internalRemark.value = '';
    userPermissions.value = ['DOWNLOAD'];
    deptPermissions.value = ['DOWNLOAD'];
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

  // 确保 fileId 为数字类型（后端期望 int64）
  const fileIdNum = typeof shareFile.value.fileId === 'string'
    ? parseInt(shareFile.value.fileId, 10)
    : shareFile.value.fileId;

  const params: Api.Disk.CreateShareParams = {
    fileId: fileIdNum,
    isPrivate: isPrivate.value,
    validity: validity.value,
    autoFillExtractCode: isPrivate.value && codeMode.value === 'random',
    extractionCode: isPrivate.value && codeMode.value === 'custom' ? customCode.value : undefined,
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

      <!-- Share Type Tabs -->
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Link Share Tab -->
        <NTabPane name="link" tab="链接分享">
          <div class="flex flex-col gap-16px">
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

              <!-- 随机生成模式 -->
              <div v-if="codeMode === 'random'" class="flex items-center gap-12px mt-12px">
                <div class="flex-1 text-center">
                  <span class="inline-block px-16px py-8px text-18px font-bold tracking-widest rounded bg-primary/10 text-primary">
                    {{ randomCode }}
                  </span>
                </div>
                <NButton quaternary size="small" @click="regenerateCode">
                  {{ $t('page.disk.share.regenerate') }}
                </NButton>
              </div>

              <!-- 自定义模式 -->
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
              <!-- 自定义地址输入框 -->
              <div v-if="customAddressEnabled" class="flex items-center gap-8px">
                <span class="text-14px opacity-60">/s/</span>
                <NInput
                  v-model:value="customAddress"
                  :placeholder="$t('page.disk.share.customAddressPlaceholder')"
                  :maxlength="32"
                  @input="customAddress = customAddress.replace(/[^a-zA-Z0-9_-]/g, '')"
                />
              </div>
              <div v-if="customAddressEnabled && customAddress && !addressValid" class="text-12px text-error mt-4px">
                地址需为3-32位字母、数字、下划线或中划线组合
              </div>
              <!-- 链接预览 -->
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