<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import { NButton, NSpace } from 'naive-ui';

defineOptions({
  name: 'DeptManagePage'
});

const loading = ref(false);
const tableData = ref<Api.SystemManage.Dept[]>([]);

const searchParams = reactive({
  deptName: '',
  status: '' as '' | '0' | '1'
});

const showModal = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formData = ref({
  id: 0,
  deptName: '',
  parentId: 0,
  leader: '' as string | undefined,
  phone: '' as string | undefined,
  email: '' as string | undefined,
  order: 0,
  status: '1' as '0' | '1'
});

async function fetchData() {
  loading.value = true;
  loading.value = false;
}

function handleSearch() {
  fetchData();
}

function handleReset() {
  Object.assign(searchParams, { deptName: '', status: '' });
  handleSearch();
}

function handleAdd(parentId = 0) {
  modalType.value = 'add';
  formData.value = { id: 0, deptName: '', parentId, leader: '', phone: '', email: '', order: 0, status: '1' };
  showModal.value = true;
}

function handleEdit(row: Api.SystemManage.Dept) {
  modalType.value = 'edit';
  formData.value = {
    id: row.id,
    deptName: row.deptName,
    parentId: row.parentId,
    leader: row.leader || '',
    phone: row.phone || '',
    email: row.email || '',
    order: row.order,
    status: row.status
  };
  showModal.value = true;
}

function handleDelete(row: Api.SystemManage.Dept) {
  window.$dialog?.warning({
    title: '提示',
    content: `确定删除部门 "${row.deptName}" 吗？`,
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

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="h-full flex-col">
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <NForm :model="searchParams" label-placement="left" :label-width="80" inline>
        <NFormItem label="部门名称" path="deptName">
          <NInput v-model:value="searchParams.deptName" placeholder="请输入部门名称" clearable />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NSelect
            v-model:value="searchParams.status"
            :options="[
              { label: '全部', value: '' },
              { label: '正常', value: '1' },
              { label: '停用', value: '0' }
            ]"
            clearable
            style="width: 120px"
          />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false" class="flex-1 card-wrapper">
      <template #header>
        <NSpace justify="space-between">
          <span class="text-16px font-medium">部门列表</span>
          <NButton type="primary" @click="handleAdd()">新增部门</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="[
          { title: '部门名称', key: 'deptName' },
          { title: '负责人', key: 'leader' },
          { title: '联系电话', key: 'phone' },
          { title: '邮箱', key: 'email' },
          { title: '排序', key: 'order', width: 80 },
          { title: '状态', key: 'status', render: (row) => (row.status === '1' ? '正常' : '停用') },
          {
            title: '操作',
            key: 'actions',
            width: 200,
            render: (row) =>
              h(NSpace, null, {
                default: () => [
                  h(NButton, { size: 'small', onClick: () => handleAdd(row.id) }, { default: () => '新增' }),
                  h(NButton, { size: 'small', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
                  h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' })
                ]
              })
          }
        ]"
        :data="tableData"
        :loading="loading"
        :row-key="(row) => row.id"
        default-expand-all
        flex-height
        class="h-full"
      />
    </NCard>

    <NModal v-model:show="showModal" preset="card" :title="modalType === 'add' ? '新增部门' : '编辑部门'" class="w-600px">
      <NForm :model="formData" label-placement="left" :label-width="80">
        <NFormItem label="部门名称" path="deptName">
          <NInput v-model:value="formData.deptName" placeholder="请输入部门名称" />
        </NFormItem>
        <NFormItem label="负责人" path="leader">
          <NInput v-model:value="formData.leader" placeholder="请输入负责人" />
        </NFormItem>
        <NFormItem label="联系电话" path="phone">
          <NInput v-model:value="formData.phone" placeholder="请输入联系电话" />
        </NFormItem>
        <NFormItem label="邮箱" path="email">
          <NInput v-model:value="formData.email" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="排序" path="order">
          <NInputNumber v-model:value="formData.order" :min="0" />
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