<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useLoading } from '@sa/hooks';

defineOptions({
  name: 'LdapSync'
});

const { loading: syncLoading, startLoading: startSyncLoading, endLoading: endSyncLoading } = useLoading();

const formModel = reactive<{
  sync_interval?: number;
  sync_rule?: number;
  default_status?: boolean;
  enable?: boolean;
}>({});

const syncStatus = ref<number>(1);
const syncMsg = ref<string | null>(null);

const ruleOtion = [
  {
    label: '平台为主',
    value: 1
  },
  {
    label: 'LDAP为主',
    value: 2
  }
];

const handleSyncClick = async () => {
  startSyncLoading();
  try {
    // eslint-disable-next-line no-console
    console.log('sync-loading');
  } finally {
    endSyncLoading();
  }
};
</script>

<template>
  <div class="flex flex-col flex-1 items-start p-4 space-y-4">
    <NForm :model="formModel" label-placement="left" label-width="auto" label-align="right">
      <NFormItem label="同步频率" path="sync_interval">
        <div class="flex flex-col space-y-2">
          <span>
            <NInputNumber v-model:value="formModel.sync_interval" :min="1" clearable :show-button="false" />
          </span>
          <span>
            <NText depth="3" class="text-sm">同步间隔时间，以分钟为单位</NText>
          </span>
        </div>
      </NFormItem>
      <NFormItem label="冲突策略" path="sync_rule">
        <div class="flex flex-col space-y-2">
          <span>
            <NSelect v-model:value="formModel.sync_rule" :options="ruleOtion" />
          </span>
          <span>
            <NText depth="3" class="text-sm">
              平台为主: 当用户名一致用户类型不会更改
              <br />
              LDAP为主: 覆盖已存在的用户更改用户类型为LDAP
            </NText>
          </span>
        </div>
      </NFormItem>
      <NFormItem label="默认启用" path="default_status">
        <div class="flex flex-col space-y-2">
          <span>
            <NSwitch v-model:value="formModel.default_status" />
          </span>
          <span>
            <NText depth="3" class="text-sm">新同步的用户是否默认启用，初次同步生效</NText>
          </span>
        </div>
      </NFormItem>
      <NFormItem label="启用同步" path="enable">
        <div class="flex flex-col space-y-2">
          <span>
            <NSwitch v-model:value="formModel.enable" />
          </span>
          <span>
            <NText depth="3" class="text-sm">打开后才会同步</NText>
          </span>
        </div>
      </NFormItem>
    </NForm>
    <div class="flex flex-row space-x-2">
      <NButton type="primary" :loading="syncLoading" @click="handleSyncClick">
        <icon-ooui:success v-if="syncStatus == 1" class="text-18px text-success" />
        <icon-ooui:error v-if="syncStatus == 2" class="text-18px text-error" />
        立即同步
      </NButton>
      <span :class="syncStatus == 1 ? 'text-success' : 'text-error'">
        {{ syncMsg }}
      </span>
    </div>
  </div>
</template>
