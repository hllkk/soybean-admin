<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useLoading } from '@sa/hooks';
import { useNaiveForm } from '@/hooks/common/form';

defineOptions({
  name: 'MailSettings'
});

const { formRef } = useNaiveForm();
const { loading: testLoading, startLoading: startTestLoading, endLoading: endTestLoading } = useLoading();

const testMail = ref<string>('');
const testStatus = ref<number>(1);
const testMsg = ref<string>('');

const model = reactive({
  host: '',
  port: 0,
  username: '',
  password: '',
  from_name: '',
  starttls: false,
  ssl_tls: false,
  use_credentials: false,
  validate_certs: false
});

const sendTestMail = async () => {
  if (!testMail.value) {
    return;
  }
  startTestLoading();
  try {
    // eslint-disable-next-line no-console
    console.log('sendTestMail', testMail.value);
  } finally {
    endTestLoading();
  }
};
</script>

<template>
  <div class="flex flex-col items-center space-y-4">
    <NForm ref="formRef" :model="model" class="max-w-[600px] w-full">
      <NFormItem label="邮箱服务器" prop="host">
        <NInput v-model:value="model.host" clearable placeholder="smtp.example.com" />
        <NInputNumber
          v-model:value="model.port"
          :show-button="false"
          placeholder="587"
          class="ml-2 w-20"
        ></NInputNumber>
      </NFormItem>
      <NFormItem label="邮箱用户名" prop="username">
        <NInput
          v-model:value="model.username"
          clearable
          placeholder="username"
          :input-props="{ autocomplete: 'username' }"
        />
      </NFormItem>
      <NFormItem label="邮箱密码" prop="password">
        <NInput
          v-model:value="model.password"
          type="password"
          clearable
          show-password-on="click"
          placeholder="**********"
          :input-props="{ autocomplete: 'current-password' }"
          class="mr-2"
        />
      </NFormItem>
      <NFormItem label="显示名称" prop="from_name">
        <NInput v-model:value="model.from_name" clearable placeholder="Gin backend" />
      </NFormItem>
      <NFormItem label="TLS连接" prop="starttls">
        <NSwitch v-model:value="model.starttls" />
      </NFormItem>
      <NFormItem label="TLS/SSL连接" prop="ssl_tls">
        <NSwitch v-model:value="model.ssl_tls" />
      </NFormItem>
      <NFormItem label="登录服务器" prop="use_credentials">
        <NSwitch v-model:value="model.use_credentials" />
      </NFormItem>
      <NFormItem label="验证服务器证书" prop="validate_certs">
        <NSwitch v-model:value="model.validate_certs" />
      </NFormItem>
      <NFormItem label="收件地址" path="testMail">
        <NInput v-model:value="testMail" clearable placeholder="test@example.com" class="mr-2" />
        <NButton :loading="testLoading" @click="sendTestMail">
          <icon-ooui:success v-if="testStatus == 1" class="text-18px text-success" />
          <icon-ooui:error v-if="testStatus == 2" class="text-18px text-error" />
          发送测试邮件
        </NButton>
      </NFormItem>
    </NForm>
    <span class="text-error">{{ testMsg }}</span>
  </div>
</template>
