<script setup lang="ts">
import { ref } from 'vue';
import type { LdapSettingConfig } from '../types';

defineOptions({
  name: 'LdapSetting'
});

const configModel = defineModel<LdapSettingConfig>('config', { required: true });

const activeTab = ref<string>('basic');

const syncStrategyOptions = [
  { label: '增量同步', value: 'incremental' },
  { label: '全量同步', value: 'full' }
];

const conflictStrategyOptions = [
  { label: '跳过', value: 'skip' },
  { label: '覆盖', value: 'overwrite' },
  { label: '合并', value: 'merge' }
];

function handleTestConnection() {
  window.$message?.info('测试连接功能开发中...');
}

function handleSyncNow() {
  window.$message?.info('立即同步功能开发中...');
}
</script>

<template>
  <div class="ldap-setting">
    <NTabs v-model:value="activeTab" type="line">
      <NTabPane name="basic" tab="基础配置">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="启用LDAP" path="enabled">
            <NSwitch v-model:value="configModel.enabled" />
          </NFormItem>
          <NFormItem label="服务器地址" path="server">
            <NInput v-model:value="configModel.server" placeholder="请输入LDAP服务器地址，如 ldap://192.168.1.100:389" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="绑定用户" path="bindUser">
            <NInput v-model:value="configModel.bindUser" placeholder="请输入绑定用户DN" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="绑定密码" path="bindPassword">
            <NInput v-model:value="configModel.bindPassword" type="password" placeholder="请输入绑定密码" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="基础OU" path="baseOU">
            <NInput v-model:value="configModel.baseOU" placeholder="请输入搜索基础OU，如 ou=users,dc=example,dc=com" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="搜索分页大小" path="searchPageSize">
            <NInputNumber v-model:value="configModel.searchPageSize" :min="1" :max="1000" class="max-w-200px" />
          </NFormItem>
          <NFormItem label="字段映射" path="fieldMapping">
            <NInput
              v-model:value="configModel.fieldMapping"
              type="textarea"
              placeholder="请输入字段映射JSON配置"
              :rows="4"
              class="max-w-400px"
            />
          </NFormItem>
          <NFormItem :label-width="120">
            <NButton type="success" @click="handleTestConnection">测试连接</NButton>
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="sync" tab="同步配置">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="默认启用同步" path="syncDefaultEnabled">
            <NSwitch v-model:value="configModel.syncDefaultEnabled" />
          </NFormItem>
          <NFormItem label="同步策略" path="syncStrategy">
            <NSelect v-model:value="configModel.syncStrategy" :options="syncStrategyOptions" class="max-w-200px" />
          </NFormItem>
          <NFormItem label="冲突策略" path="conflictStrategy">
            <NSelect v-model:value="configModel.conflictStrategy" :options="conflictStrategyOptions" class="max-w-200px" />
          </NFormItem>
          <NFormItem label="启用同步" path="syncEnabled">
            <NSwitch v-model:value="configModel.syncEnabled" />
          </NFormItem>
          <NFormItem :label-width="120">
            <NButton type="primary" @click="handleSyncNow">立即同步</NButton>
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.ldap-setting {
  padding: 16px 0;
}
</style>
