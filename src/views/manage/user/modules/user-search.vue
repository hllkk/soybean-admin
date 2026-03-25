<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'UserSearch'
});

const appStore = useAppStore();

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.UserSearchParams>('model', { required: true });

function reset() {
  Object.assign(model.value, {
    userName: '',
    nickName: '',
    phone: '',
    status: ''
  });
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" label-placement="left" :label-width="80">
      <NGrid :cols="appStore.isMobile ? 1 : 24" :x-gap="16" :y-gap="16">
        <NGi :span="appStore.isMobile ? 24 : 4">
          <NFormItem label="用户名" path="userName">
            <NInput v-model:value="model.userName" placeholder="请输入用户名" clearable />
          </NFormItem>
        </NGi>
        <NGi :span="appStore.isMobile ? 24 : 4">
          <NFormItem label="昵称" path="nickName">
            <NInput v-model:value="model.nickName" placeholder="请输入昵称" clearable />
          </NFormItem>
        </NGi>
        <NGi :span="appStore.isMobile ? 24 : 4">
          <NFormItem label="手机号" path="phone">
            <NInput v-model:value="model.phone" placeholder="请输入手机号" clearable />
          </NFormItem>
        </NGi>
        <NGi :span="appStore.isMobile ? 24 : 4">
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="model.status"
              :options="[
                { label: '全部', value: '' },
                { label: '正常', value: '1' },
                { label: '停用', value: '0' }
              ]"
              clearable
            />
          </NFormItem>
        </NGi>
        <NGi :span="appStore.isMobile ? 24 : 8">
          <NSpace>
            <NButton type="primary" @click="search">
              <template #icon>
                <icon-ic-round-search />
              </template>
              搜索
            </NButton>
            <NButton @click="reset">
              <template #icon>
                <icon-ic-round-refresh />
              </template>
              重置
            </NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>