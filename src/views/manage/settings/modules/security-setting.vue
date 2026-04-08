<script setup lang="ts">
import type { SecuritySettingConfig } from '../types';
import { computed } from 'vue';

defineOptions({
  name: 'SecuritySetting'
});

const configModel = defineModel<SecuritySettingConfig>('config', { required: true });

const ipValidationModeOptions = [
  { label: '黑名单模式', value: 'blacklist' },
  { label: '白名单模式', value: 'whitelist' }
];

const isBlacklistMode = computed(() => configModel.value.ipValidationMode === 'blacklist');
const isWhitelistMode = computed(() => configModel.value.ipValidationMode === 'whitelist');
</script>

<template>
  <div class="security-setting">
    <div class="section-title">密码策略</div>
    <NForm :model="configModel" label-placement="left" :label-width="150">
      <NFormItem label="密码最小长度" path="passwordMinLength">
        <NInputNumber v-model:value="configModel.passwordMinLength" :min="6" :max="32" class="w-180px" />
      </NFormItem>
      <NFormItem label="密码包含特殊字符" path="passwordRequireSpecial">
        <NSwitch v-model:value="configModel.passwordRequireSpecial" />
      </NFormItem>
      <NFormItem label="登录失败锁定次数" path="loginFailLockCount">
        <NInputNumber v-model:value="configModel.loginFailLockCount" :min="1" :max="10" class="w-180px" />
      </NFormItem>
      <NFormItem label="登录失败锁定时间" path="loginFailLockTime">
        <NInputNumber v-model:value="configModel.loginFailLockTime" :min="1" :max="1440" class="w-180px">
          <template #suffix>分钟</template>
        </NInputNumber>
      </NFormItem>
    </NForm>

    <NDivider />

    <div class="section-title">IP校验</div>
    <NForm :model="configModel" label-placement="left" :label-width="150" class="mt-16px">
      <NFormItem label="启用IP校验" path="ipValidationEnabled">
        <NSwitch v-model:value="configModel.ipValidationEnabled" />
      </NFormItem>
      <NFormItem label="IP校验模式" path="ipValidationMode">
        <NSelect v-model:value="configModel.ipValidationMode" :options="ipValidationModeOptions" class="max-w-200px" />
      </NFormItem>
      <NFormItem label="IP黑名单" path="ipBlacklist">
        <NInput
          v-model:value="configModel.ipBlacklist"
          type="textarea"
          placeholder="每行一个IP地址或IP段"
          :rows="4"
          :disabled="isWhitelistMode"
          class="max-w-400px"
        />
      </NFormItem>
      <NFormItem label="IP白名单" path="ipWhitelist">
        <NInput
          v-model:value="configModel.ipWhitelist"
          type="textarea"
          placeholder="每行一个IP地址或IP段"
          :rows="4"
          :disabled="isBlacklistMode"
          class="max-w-400px"
        />
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

.w-180px {
  width: 180px;
}
</style>