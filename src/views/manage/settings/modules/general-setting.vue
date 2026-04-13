<script setup lang="ts">
import { ref } from 'vue';
import type { GeneralSettingConfig } from '../types';
import { fetchUploadLogo, fetchUploadFavicon } from '@/service/api/system/setting';

defineOptions({
  name: 'GeneralSetting'
});

interface Props {
  config: GeneralSettingConfig;
}

defineProps<Props>();
const configModel = defineModel<GeneralSettingConfig>('config', { required: true });

const captchaTypeOptions = [
  { label: '点选式', value: 'click' },
  { label: '滑动式', value: 'slide' },
  { label: '拖拽式', value: 'drag' },
  { label: '旋转式', value: 'rotate' }
];

const roleOptions = [
  { label: '普通用户', value: 1 },
  { label: '管理员', value: 2 }
];

const logoUploading = ref(false);
const faviconUploading = ref(false);

// Logo 上传前的校验
function beforeLogoUpload(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
  const isAllowed = allowedTypes.includes(file.type);
  if (!isAllowed) {
    window.$message?.error('只支持 JPG、PNG、SVG 格式');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    window.$message?.error('Logo 文件大小不能超过 2MB');
    return false;
  }
  return true;
}

// Logo 上传处理
async function handleLogoUpload(options: { file: { file: File | null } }) {
  const file = options.file.file;
  if (!file) return;

  logoUploading.value = true;
  try {
    const { data: url } = await fetchUploadLogo(file);
    if (url) {
      configModel.value.logoUrl = url;
    }
    window.$message?.success('Logo 上传成功');
  } catch {
    window.$message?.error('Logo 上传失败');
  } finally {
    logoUploading.value = false;
  }
}

// Favicon 上传前的校验
function beforeFaviconUpload(file: File) {
  const allowedTypes = ['image/x-icon', 'image/png'];
  const isAllowed = allowedTypes.includes(file.type) || file.name.endsWith('.ico');
  if (!isAllowed) {
    window.$message?.error('只支持 ICO、PNG 格式');
    return false;
  }
  const isLt100K = file.size / 1024 < 100;
  if (!isLt100K) {
    window.$message?.error('Favicon 文件大小不能超过 100KB');
    return false;
  }
  return true;
}

// Favicon 上传处理
async function handleFaviconUpload(options: { file: { file: File | null } }) {
  const file = options.file.file;
  if (!file) return;

  faviconUploading.value = true;
  try {
    const { data: url } = await fetchUploadFavicon(file);
    if (url) {
      configModel.value.faviconUrl = url;
    }
    window.$message?.success('Favicon 上传成功');
  } catch {
    window.$message?.error('Favicon 上传失败');
  } finally {
    faviconUploading.value = false;
  }
}

// 清除 Logo
function clearLogo() {
  configModel.value.logoUrl = '';
}

// 清除 Favicon
function clearFavicon() {
  configModel.value.faviconUrl = '';
}
</script>

<template>
  <div class="general-setting">
    <NForm :model="configModel" label-placement="left" :label-width="120">
      <NFormItem label="后台管理名称" path="systemName">
        <NInput v-model:value="configModel.systemName" placeholder="请输入后台管理名称" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="后台管理描述" path="systemDescription">
        <NInput v-model:value="configModel.systemDescription" placeholder="请输入后台管理描述" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="Logo" path="logoUrl">
        <div class="flex items-center gap-16px">
          <NUpload
            :max="1"
            accept=".jpg,.jpeg,.png,.svg"
            :custom-request="handleLogoUpload"
            :before-upload="beforeLogoUpload"
            :show-file-list="false"
          >
            <NButton :loading="logoUploading">
              <template #icon>
                <icon-ic-outline-upload class="text-icon" />
              </template>
              上传 Logo
            </NButton>
          </NUpload>
          <NInput v-model:value="configModel.logoUrl" placeholder="或直接输入 URL" class="max-w-300px" />
          <NButton v-if="configModel.logoUrl" quaternary size="small" @click="clearLogo">
            <template #icon>
              <icon-ic-outline-close class="text-icon" />
            </template>
          </NButton>
          <!-- Logo 预览 -->
          <img v-if="configModel.logoUrl" :src="configModel.logoUrl" class="size-32px" alt="logo preview" />
        </div>
      </NFormItem>
      <NFormItem label="Favicon" path="faviconUrl">
        <div class="flex items-center gap-16px">
          <NUpload
            :max="1"
            accept=".ico,.png"
            :custom-request="handleFaviconUpload"
            :before-upload="beforeFaviconUpload"
            :show-file-list="false"
          >
            <NButton :loading="faviconUploading">
              <template #icon>
                <icon-ic-outline-upload class="text-icon" />
              </template>
              上传 Favicon
            </NButton>
          </NUpload>
          <NInput v-model:value="configModel.faviconUrl" placeholder="或直接输入 URL" class="max-w-300px" />
          <NButton v-if="configModel.faviconUrl" quaternary size="small" @click="clearFavicon">
            <template #icon>
              <icon-ic-outline-close class="text-icon" />
            </template>
          </NButton>
          <!-- Favicon 预览 -->
          <img v-if="configModel.faviconUrl" :src="configModel.faviconUrl" class="size-32px" alt="favicon preview" />
        </div>
      </NFormItem>
      <NFormItem label="用户默认密码" path="userDefaultPassword">
        <NInput
          v-model:value="configModel.userDefaultPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入默认密码"
          class="max-w-400px"
        />
      </NFormItem>
      <NFormItem label="默认角色" path="userDefaultRole">
        <NSelect
          v-model:value="configModel.userDefaultRole"
          :options="roleOptions"
          placeholder="请选择默认角色"
          class="max-w-200px"
          clearable
        />
      </NFormItem>
    </NForm>

    <NDivider />

    <div class="section-title">验证码配置</div>
    <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
      <NFormItem label="开启验证码登录" path="enableVerifyCode">
        <NSwitch v-model:value="configModel.enableVerifyCode" />
      </NFormItem>
      <NFormItem label="验证码类型" path="verifyCodeType">
        <NSelect v-model:value="configModel.verifyCodeType" :options="captchaTypeOptions" class="max-w-200px" />
      </NFormItem>
      <NFormItem label="验证码误差配置" path="verifyInaccuracy">
        <NInputNumber v-model:value="configModel.verifyInaccuracy" :min="0" :max="50" class="max-w-200px">
          <template #suffix>像素</template>
        </NInputNumber>
      </NFormItem>
    </NForm>
  </div>
</template>

<style scoped>
.section-title {
  font-weight: 500;
  color: #333;
  font-size: 15px;
  margin-bottom: 16px;
}
</style>