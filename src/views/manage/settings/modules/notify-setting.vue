<script setup lang="ts">
import type { NotifySettingConfig } from '../types';

defineOptions({
  name: 'NotifySetting'
});

const configModel = defineModel<NotifySettingConfig>('config', { required: true });
</script>

<template>
  <div class="notify-setting">
    <NTabs type="line">
      <NTabPane name="email" tab="邮件通知">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="SMTP服务器" path="smtpHost">
            <NInput v-model:value="configModel.smtpHost" placeholder="请输入SMTP服务器地址" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="SMTP端口" path="smtpPort">
            <NInputNumber v-model:value="configModel.smtpPort" :min="1" :max="65535" placeholder="请输入端口号" class="max-w-200px" />
          </NFormItem>
          <NFormItem label="SMTP用户名" path="smtpUser">
            <NInput v-model:value="configModel.smtpUser" placeholder="请输入SMTP用户名" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="SMTP密码" path="smtpPassword">
            <NInput v-model:value="configModel.smtpPassword" type="password" placeholder="请输入SMTP密码" class="max-w-400px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="sms" tab="短信通知">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="启用短信" path="smsEnabled">
            <NSwitch v-model:value="configModel.smsEnabled" />
          </NFormItem>
          <NFormItem label="短信网关" path="smsGateway">
            <NInput v-model:value="configModel.smsGateway" placeholder="请输入短信网关地址" class="max-w-400px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="feishu" tab="飞书推送">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="启用飞书" path="feishuEnabled">
            <NSwitch v-model:value="configModel.feishuEnabled" />
          </NFormItem>
          <NFormItem label="App ID" path="feishuAppId">
            <NInput v-model:value="configModel.feishuAppId" placeholder="请输入飞书App ID" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="App Secret" path="feishuAppSecret">
            <NInput v-model:value="configModel.feishuAppSecret" type="password" placeholder="请输入飞书App Secret" class="max-w-400px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="webhook" tab="Webhook">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="Webhook URL" path="webhookUrl">
            <NInput v-model:value="configModel.webhookUrl" placeholder="请输入Webhook地址" class="max-w-400px" />
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.notify-setting {
  padding: 0;
}
</style>