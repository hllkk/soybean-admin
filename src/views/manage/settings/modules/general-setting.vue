<script setup lang="ts">
import type { GeneralSettingConfig } from '../types';

defineOptions({
  name: 'GeneralSetting'
});

interface Props {
  config: GeneralSettingConfig;
}

interface Emits {
  (e: 'update:config', value: GeneralSettingConfig): void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<Props>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emit = defineEmits<Emits>();

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
      <NFormItem label="Logo URL" path="logoUrl">
        <NInput v-model:value="configModel.logoUrl" placeholder="请输入Logo图片地址" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="Favicon URL" path="faviconUrl">
        <NInput v-model:value="configModel.faviconUrl" placeholder="请输入网站图标地址" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="用户默认密码" path="userDefaultPassword">
        <NInput v-model:value="configModel.userDefaultPassword" type="password" placeholder="请输入默认密码" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="默认角色" path="userDefaultRole">
        <NSelect v-model:value="configModel.userDefaultRole" :options="roleOptions" placeholder="请选择默认角色" class="max-w-200px" />
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