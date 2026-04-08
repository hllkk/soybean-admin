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

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const configModel = defineModel<GeneralSettingConfig>('config', { required: true });

const captchaTypeOptions = [
  { label: '点选式', value: 'click' },
  { label: '滑动式', value: 'slide' },
  { label: '拖拽式', value: 'drag' },
  { label: '旋转式', value: 'rotate' }
];

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' }
];
</script>

<template>
  <div class="general-setting">
    <NForm :model="configModel" label-placement="left" :label-width="120">
      <NFormItem label="后台管理名称" path="siteName">
        <NInput v-model:value="configModel.siteName" placeholder="请输入后台管理名称" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="后台管理描述" path="siteDescription">
        <NInput v-model:value="configModel.siteDescription" placeholder="请输入后台管理描述" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="Logo URL" path="logo">
        <NInput v-model:value="configModel.logo" placeholder="请输入Logo图片地址" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="Favicon URL" path="favicon">
        <NInput v-model:value="configModel.favicon" placeholder="请输入网站图标地址" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="用户默认密码" path="defaultPassword">
        <NInput v-model:value="configModel.defaultPassword" type="password" placeholder="请输入默认密码" class="max-w-400px" />
      </NFormItem>
      <NFormItem label="默认角色" path="defaultRole">
        <NSelect v-model:value="configModel.defaultRole" :options="roleOptions" placeholder="请选择默认角色" class="max-w-200px" />
      </NFormItem>
    </NForm>

    <NDivider />

    <div class="section-title">验证码配置</div>
    <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
      <NFormItem label="开启验证码登录" path="captchaEnabled">
        <NSwitch v-model:value="configModel.captchaEnabled" />
      </NFormItem>
      <NFormItem label="验证码类型" path="captchaType">
        <NSelect v-model:value="configModel.captchaType" :options="captchaTypeOptions" class="max-w-200px" />
      </NFormItem>
      <NFormItem label="验证码误差配置" path="captchaTolerance">
        <NInputNumber v-model:value="configModel.captchaTolerance" :min="0" :max="50" class="max-w-200px">
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