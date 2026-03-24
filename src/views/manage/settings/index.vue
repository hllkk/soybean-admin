<script setup lang="ts">
import { reactive, ref } from 'vue';

defineOptions({
  name: 'SettingsPage'
});

const loading = ref(false);

// 系统设置表单
const formData = reactive({
  // 基础设置
  siteName: 'OPS管理系统',
  siteDescription: '企业运维管理平台',
  logo: '',
  favicon: '',

  // 安全设置
  passwordMinLength: 6,
  passwordRequireSpecial: false,
  loginFailLockCount: 5,
  loginFailLockTime: 30,

  // 文件设置
  maxUploadSize: 100,
  allowFileTypes: '.jpg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar',

  // 邮件设置
  smtpHost: '',
  smtpPort: 465,
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: ''
});

async function handleSave() {
  loading.value = true;
  // TODO: 调用API保存设置
  loading.value = false;
  window.$message?.destroyAll();
  window.$message?.success('保存成功');
}
</script>

<template>
  <div class="h-full overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <NTabs type="line" animated>
        <NTabPane name="basic" tab="基础设置">
          <NForm :model="formData" label-placement="left" :label-width="120" class="mt-16px">
            <NFormItem label="站点名称" path="siteName">
              <NInput v-model:value="formData.siteName" placeholder="请输入站点名称" class="max-w-400px" />
            </NFormItem>
            <NFormItem label="站点描述" path="siteDescription">
              <NInput v-model:value="formData.siteDescription" placeholder="请输入站点描述" class="max-w-400px" />
            </NFormItem>
            <NFormItem label="Logo" path="logo">
              <NInput v-model:value="formData.logo" placeholder="Logo URL" class="max-w-400px" />
            </NFormItem>
            <NFormItem label="Favicon" path="favicon">
              <NInput v-model:value="formData.favicon" placeholder="Favicon URL" class="max-w-400px" />
            </NFormItem>
          </NForm>
        </NTabPane>

        <NTabPane name="security" tab="安全设置">
          <NForm :model="formData" label-placement="left" :label-width="150" class="mt-16px">
            <NFormItem label="密码最小长度" path="passwordMinLength">
              <NInputNumber v-model:value="formData.passwordMinLength" :min="4" :max="20" class="w-200px" />
            </NFormItem>
            <NFormItem label="密码包含特殊字符" path="passwordRequireSpecial">
              <NSwitch v-model:value="formData.passwordRequireSpecial" />
            </NFormItem>
            <NFormItem label="登录失败锁定次数" path="loginFailLockCount">
              <NInputNumber v-model:value="formData.loginFailLockCount" :min="3" :max="10" class="w-200px" />
            </NFormItem>
            <NFormItem label="锁定时间(分钟)" path="loginFailLockTime">
              <NInputNumber v-model:value="formData.loginFailLockTime" :min="5" :max="120" class="w-200px" />
            </NFormItem>
          </NForm>
        </NTabPane>

        <NTabPane name="file" tab="文件设置">
          <NForm :model="formData" label-placement="left" :label-width="150" class="mt-16px">
            <NFormItem label="最大上传大小(MB)" path="maxUploadSize">
              <NInputNumber v-model:value="formData.maxUploadSize" :min="1" :max="500" class="w-200px" />
            </NFormItem>
            <NFormItem label="允许的文件类型" path="allowFileTypes">
              <NInput
                v-model:value="formData.allowFileTypes"
                type="textarea"
                placeholder="多个类型用逗号分隔"
                class="max-w-500px"
                :rows="3"
              />
            </NFormItem>
          </NForm>
        </NTabPane>

        <NTabPane name="email" tab="邮件设置">
          <NForm :model="formData" label-placement="left" :label-width="120" class="mt-16px">
            <NFormItem label="SMTP服务器" path="smtpHost">
              <NInput v-model:value="formData.smtpHost" placeholder="smtp.example.com" class="max-w-400px" />
            </NFormItem>
            <NFormItem label="SMTP端口" path="smtpPort">
              <NInputNumber v-model:value="formData.smtpPort" :min="1" :max="65535" class="w-200px" />
            </NFormItem>
            <NFormItem label="SMTP用户名" path="smtpUser">
              <NInput v-model:value="formData.smtpUser" placeholder="请输入SMTP用户名" class="max-w-400px" />
            </NFormItem>
            <NFormItem label="SMTP密码" path="smtpPassword">
              <NInput
                v-model:value="formData.smtpPassword"
                type="password"
                placeholder="请输入SMTP密码"
                class="max-w-400px"
              />
            </NFormItem>
            <NFormItem label="发件人地址" path="smtpFrom">
              <NInput v-model:value="formData.smtpFrom" placeholder="noreply@example.com" class="max-w-400px" />
            </NFormItem>
          </NForm>
        </NTabPane>
      </NTabs>

      <NDivider />

      <NSpace justify="end">
        <NButton type="primary" :loading="loading" @click="handleSave">保存设置</NButton>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped></style>