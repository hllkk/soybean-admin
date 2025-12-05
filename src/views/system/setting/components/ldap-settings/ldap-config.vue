<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useLoading } from '@sa/hooks';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'LdapConfig'
});

type MapAttribute = {
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
};

interface FormModel {
  hosts?: string;
  user?: string;
  password?: string;
  base_ou?: string;
  paged_size?: number;
  attributes?: MapAttribute;
  enable?: boolean;
  testUser?: string;
}

interface TestSuccessData {
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
}

const appStore = useAppStore();
const { loading: testLoading, startLoading: startTestLoading, endLoading: endTestLoading } = useLoading();

const testStatus = ref<number>(1);
const testMsg = ref<string | null>(null);

const testSuccessData = ref<TestSuccessData>({});
const model = reactive<FormModel>({});

const handleTestClick = async () => {
  startTestLoading();
  try {
    // eslint-disable-next-line no-console
    console.log('test-loading');
  } finally {
    endTestLoading();
  }
};
</script>

<template>
  <div class="flex flex-row items-center space-x-8">
    <NSplit :direction="appStore.isMobile ? 'vertical' : 'horizontal'" :max="0.7" :min="0.4">
      <template #1>
        <div class="flex flex-col flex-1 p-4 space-y-4">
          <NForm :model="model" label-placement="left" label-width="auto" label-align="right">
            <NFormItem label="域服务器" path="hosts">
              <NDynamicInput :model="model.hosts" :min="1" clearable placeholder="ldap(s)://ldap.dc01.com:389" />
            </NFormItem>
            <NFormItem label="绑定用户" path="user">
              <NInput :model="model.user" clearable placeholder="CN=test,CN=Users,DC=example,DC=com" />
            </NFormItem>
            <NFormItem label="绑定密码" path="password">
              <NInput :model="model.password" clearable show-password-on="click" placeholder="**********" />
            </NFormItem>
            <NFormItem label="基础OU" path="base_ou">
              <NInput :model="model.base_ou" clearable placeholder="OU=base,DC=example,DC=com" />
            </NFormItem>
            <NFormItem label="搜索分页" path="paged_size">
              <NInputNumber :model="model.paged_size" clearable :show-button="false" placeholder="<1000" />
            </NFormItem>
            <NFormItem label="字段映射" path="attributes">
              <NDescriptions label-placement="left" label-align="left" :column="1" bordered size="small">
                <NDescriptionsItem label="用户名">
                  <NInput :model="model.attributes?.username" size="small" clearable />
                </NDescriptionsItem>
                <NDescriptionsItem label="显示名">
                  <NInput :model="model.attributes?.nickname" size="small" clearable />
                </NDescriptionsItem>
                <NDescriptionsItem label="邮箱">
                  <NInput :model="model.attributes?.email" size="small" clearable />
                </NDescriptionsItem>
                <NDescriptionsItem label="手机">
                  <NInput :model="model.attributes?.phone" size="small" clearable />
                </NDescriptionsItem>
              </NDescriptions>
            </NFormItem>
            <NFormItem label="启用ldap登录" path="config.enable">
              <NSwitch :model="model.enable" />
            </NFormItem>
          </NForm>
        </div>
      </template>
      <template #2>
        <div class="flex flex-col flex-1 p-4 space-y-4">
          <NFormItem label-placement="left" label="用户名" path="testUser">
            <NInput :model="model.testUser" class="mr-2 w-50%" clearable :placeholder="model.attributes?.username" />
            <NButton :loading="testLoading" @click="handleTestClick">
              <icon-ooui:success v-if="testStatus == 1" class="text-18px text-success" />
              <icon-ooui:error v-if="testStatus == 2" class="text-18px text-error" />
              测试连接
            </NButton>
          </NFormItem>
          <span class="text-error">{{ testMsg }}</span>
          <NDescriptions v-if="testStatus == 1" label-placement="top" :column="4" bordered size="small">
            <NDescriptionsItem label="用户名">
              {{ testSuccessData.username }}
            </NDescriptionsItem>
            <NDescriptionsItem label="显示名">
              {{ testSuccessData.nickname }}
            </NDescriptionsItem>
            <NDescriptionsItem label="邮箱">
              {{ testSuccessData.email }}
            </NDescriptionsItem>
            <NDescriptionsItem label="手机">
              {{ testSuccessData.phone }}
            </NDescriptionsItem>
          </NDescriptions>
        </div>
      </template>
    </NSplit>
  </div>
</template>
