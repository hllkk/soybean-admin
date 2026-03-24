<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'DictManagePage'
});

const appStore = useAppStore();

const loading = ref(false);
const tableData = ref<Api.SystemManage.Dict[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
});

const searchParams = reactive({
  dictName: '',
  dictCode: '',
  status: '' as '' | '0' | '1'
});

const showModal = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formData = reactive({
  id: 0,
  dictName: '',
  dictCode: '',
  description: '',
  status: '1'
});

const columns: DataTableColumns<Api.SystemManage.Dict> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '字典名称', key: 'dictName' },
  { title: '字典编码', key: 'dictCode' },
  { title: '描述', key: 'description' },
  { title: '状态', key: 'status', render: (row) => (row.status === '1' ? '正常' : '停用') },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleDictData(row) }, { default: () => '字典数据' }),
          h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' })
        ]
      })
  }
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
  Object.assign(searchParams, { dictName: '', dictCode: '', status: '' });
  handleSearch();
}

function handleAdd() {
  modalType.value = 'add';
  Object.assign(formData, { id: 0, dictName: '', dictCode: '', description: '', status: '1' });
  showModal.value = true;
}

function handleEdit(row: Api.SystemManage.Dict) {
  modalType.value = 'edit';
  Object.assign(formData, row);
  showModal.value = true;
}

function handleDictData(row: Api.SystemManage.Dict) {
  window.$message?.destroyAll();
  window.$message?.info(`配置字典 "${row.dictName}" 的数据`);
}

function handleDelete(row: Api.SystemManage.Dict) {
  window.$dialog?.warning({
    title: '提示',
    content: `确定删除字典 "${row.dictName}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      window.$message?.destroyAll();
      window.$message?.success('删除成功');
      fetchData();
    }
  });
}

async function handleSubmit() {
  window.$message?.destroyAll();
  window.$message?.success(modalType.value === 'add' ? '添加成功' : '编辑成功');
  showModal.value = false;
  fetchData();
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
        <NGrid :cols="appStore.isMobile ? 1 : 4" :x-gap="16" :y-gap="16">
          <NGi>
            <NFormItem label="字典名称" path="dictName">
              <NInput v-model:value="searchParams.dictName" placeholder="请输入字典名称" clearable />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="字典编码" path="dictCode">
              <NInput v-model:value="searchParams.dictCode" placeholder="请输入字典编码" clearable />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="状态" path="status">
              <NSelect
                v-model:value="searchParams.status"
                :options="[
                  { label: '全部', value: '' },
                  { label: '正常', value: '1' },
                  { label: '停用', value: '0' }
                ]"
                clearable
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
            </NSpace>
          </NGi>
        </NGrid>
      </NForm>
    </NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper">
      <template #header>
        <NSpace justify="space-between">
          <span class="text-16px font-medium">字典列表</span>
          <NButton type="primary" @click="handleAdd">新增字典</NButton>
        </NSpace>
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

    <NModal v-model:show="showModal" preset="card" :title="modalType === 'add' ? '新增字典' : '编辑字典'" class="w-600px">
      <NForm :model="formData" label-placement="left" :label-width="80">
        <NFormItem label="字典名称" path="dictName">
          <NInput v-model:value="formData.dictName" placeholder="请输入字典名称" />
        </NFormItem>
        <NFormItem label="字典编码" path="dictCode">
          <NInput v-model:value="formData.dictCode" placeholder="请输入字典编码" />
        </NFormItem>
        <NFormItem label="描述" path="description">
          <NInput v-model:value="formData.description" placeholder="请输入描述" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="formData.status">
            <NRadioButton value="1">正常</NRadioButton>
            <NRadioButton value="0">停用</NRadioButton>
          </NRadioGroup>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped></style>