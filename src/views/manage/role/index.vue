<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'RoleManagePage'
});

const appStore = useAppStore();

const loading = ref(false);
const tableData = ref<Api.SystemManage.Role[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
});

const searchParams = reactive({
  roleName: '',
  roleCode: '',
  status: '' as '' | '0' | '1'
});

const showModal = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formData = reactive({
  id: 0,
  roleName: '',
  roleCode: '',
  description: '',
  status: '1'
});

const columns: DataTableColumns<Api.SystemManage.Role> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '角色名称', key: 'roleName' },
  { title: '角色编码', key: 'roleCode' },
  { title: '描述', key: 'description' },
  { title: '状态', key: 'status', render: (row) => (row.status === '1' ? '正常' : '停用') },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', type: 'primary', onClick: () => handlePermission(row) }, { default: () => '权限' }),
          h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' })
        ]
      });
    }
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
  Object.assign(searchParams, { roleName: '', roleCode: '', status: '' });
  handleSearch();
}

function handleAdd() {
  modalType.value = 'add';
  Object.assign(formData, { id: 0, roleName: '', roleCode: '', description: '', status: '1' });
  showModal.value = true;
}

function handleEdit(row: Api.SystemManage.Role) {
  modalType.value = 'edit';
  Object.assign(formData, row);
  showModal.value = true;
}

function handlePermission(row: Api.SystemManage.Role) {
  window.$message?.destroyAll();
  window.$message?.info(`配置角色 "${row.roleName}" 的权限`);
}

function handleDelete(row: Api.SystemManage.Role) {
  window.$dialog?.warning({
    title: '提示',
    content: `确定删除角色 "${row.roleName}" 吗？`,
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
            <NFormItem label="角色名称" path="roleName">
              <NInput v-model:value="searchParams.roleName" placeholder="请输入角色名称" clearable />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="角色编码" path="roleCode">
              <NInput v-model:value="searchParams.roleCode" placeholder="请输入角色编码" clearable />
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
          <span class="text-16px font-medium">角色列表</span>
          <NButton type="primary" @click="handleAdd">新增角色</NButton>
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

    <NModal v-model:show="showModal" preset="card" :title="modalType === 'add' ? '新增角色' : '编辑角色'" class="w-600px">
      <NForm :model="formData" label-placement="left" :label-width="80">
        <NFormItem label="角色名称" path="roleName">
          <NInput v-model:value="formData.roleName" placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem label="角色编码" path="roleCode">
          <NInput v-model:value="formData.roleCode" placeholder="请输入角色编码" />
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