<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NTag } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'LoginLogPage'
});

const appStore = useAppStore();

const loading = ref(false);
const tableData = ref<Api.SystemManage.LoginLog[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
});

const searchParams = reactive({
  userName: '',
  ip: '',
  status: '' as '' | '0' | '1',
  startTime: null as number | null,
  endTime: null as number | null
});

const columns: DataTableColumns<Api.SystemManage.LoginLog> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'userName', width: 120 },
  { title: 'IP地址', key: 'ip', width: 140 },
  { title: '登录地点', key: 'location', width: 150 },
  { title: '浏览器', key: 'browser', width: 120 },
  { title: '操作系统', key: 'os', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) =>
      h(
        NTag,
        { type: row.status === '1' ? 'success' : 'error' },
        { default: () => (row.status === '1' ? '成功' : '失败') }
      )
  },
  { title: '提示信息', key: 'msg', ellipsis: { tooltip: true } },
  { title: '登录时间', key: 'createdAt', width: 180 }
];

async function fetchData() {
  loading.value = true;
  loading.value = false;
}

function handleSearch() {
  pagination.page = 1;
  fetchData();
}

function handleReset() {
  Object.assign(searchParams, { userName: '', ip: '', status: '', startTime: null, endTime: null });
  handleSearch();
}

function handleExport() {
  window.$message?.destroyAll();
  window.$message?.info('导出功能开发中');
}

function handlePageChange(page: number) {
  pagination.page = page;
  fetchData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="h-full flex-col">
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <NForm :model="searchParams" label-placement="left" :label-width="80">
        <NGrid :cols="appStore.isMobile ? 1 : 24" :x-gap="16" :y-gap="16">
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="用户名" path="userName">
              <NInput v-model:value="searchParams.userName" placeholder="请输入用户名" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="IP地址" path="ip">
              <NInput v-model:value="searchParams.ip" placeholder="请输入IP地址" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="状态" path="status">
              <NSelect
                v-model:value="searchParams.status"
                :options="[
                  { label: '全部', value: '' },
                  { label: '成功', value: '1' },
                  { label: '失败', value: '0' }
                ]"
                clearable
              />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 6">
            <NFormItem label="时间范围">
              <NDatePicker v-model:value="searchParams.startTime" type="daterange" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 6">
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="warning" @click="handleExport">导出</NButton>
            </NSpace>
          </NGi>
        </NGrid>
      </NForm>
    </NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper">
      <template #header>
        <span class="text-16px font-medium">登录日志</span>
      </template>
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
        remote
        flex-height
        class="h-full"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </NCard>
  </div>
</template>

<style scoped></style>