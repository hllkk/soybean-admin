<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'OperationLogPage'
});

const appStore = useAppStore();

const loading = ref(false);
const tableData = ref<Api.SystemManage.Log[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
});

const searchParams = reactive({
  operator: '',
  module: '',
  action: '',
  startTime: null as number | null,
  endTime: null as number | null
});

const columns: DataTableColumns<Api.SystemManage.Log> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '操作人', key: 'operator', width: 120 },
  { title: '模块', key: 'module', width: 120 },
  { title: '操作', key: 'action', width: 120 },
  { title: 'IP地址', key: 'ip', width: 140 },
  { title: '请求方法', key: 'method', width: 100 },
  { title: '请求路径', key: 'path', ellipsis: { tooltip: true } },
  { title: '状态', key: 'status', width: 80, render: (row) => (row.status === 200 ? '成功' : '失败') },
  { title: '操作时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => h(NButton, { size: 'small', onClick: () => handleDetail(row) }, { default: () => '详情' })
  }
];

const showDetail = ref(false);
const detailData = ref<Api.SystemManage.Log | null>(null);

async function fetchData() {
  loading.value = true;
  loading.value = false;
}

function handleSearch() {
  pagination.page = 1;
  fetchData();
}

function handleReset() {
  Object.assign(searchParams, { operator: '', module: '', action: '', startTime: null, endTime: null });
  handleSearch();
}

function handleDetail(row: Api.SystemManage.Log) {
  detailData.value = row;
  showDetail.value = true;
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
            <NFormItem label="操作人" path="operator">
              <NInput v-model:value="searchParams.operator" placeholder="请输入操作人" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="模块" path="module">
              <NInput v-model:value="searchParams.module" placeholder="请输入模块" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="操作" path="action">
              <NInput v-model:value="searchParams.action" placeholder="请输入操作" clearable />
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
        <span class="text-16px font-medium">操作日志</span>
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

    <NModal v-model:show="showDetail" preset="card" title="日志详情" class="w-800px">
      <NDescriptions v-if="detailData" label-placement="left" :column="2" bordered>
        <NDescriptionsItem label="ID">{{ detailData.id }}</NDescriptionsItem>
        <NDescriptionsItem label="操作人">{{ detailData.operator }}</NDescriptionsItem>
        <NDescriptionsItem label="模块">{{ detailData.module }}</NDescriptionsItem>
        <NDescriptionsItem label="操作">{{ detailData.action }}</NDescriptionsItem>
        <NDescriptionsItem label="IP地址">{{ detailData.ip }}</NDescriptionsItem>
        <NDescriptionsItem label="请求方法">{{ detailData.method }}</NDescriptionsItem>
        <NDescriptionsItem label="请求路径" :span="2">{{ detailData.path }}</NDescriptionsItem>
        <NDescriptionsItem label="状态">{{ detailData.status }}</NDescriptionsItem>
        <NDescriptionsItem label="操作时间">{{ detailData.createdAt }}</NDescriptionsItem>
      </NDescriptions>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showDetail = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped></style>