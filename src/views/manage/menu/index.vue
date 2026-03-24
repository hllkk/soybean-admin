<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NButton, NSpace } from 'naive-ui';

defineOptions({
  name: 'MenuManagePage'
});

const loading = ref(false);
const tableData = ref<Api.SystemManage.Menu[]>([]);

const showModal = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formData = ref({
  id: 0,
  menuName: '',
  menuType: 'directory' as 'directory' | 'menu' | 'button',
  path: '' as string | undefined,
  component: '' as string | undefined,
  icon: '' as string | undefined,
  order: 0,
  status: '1' as '0' | '1',
  parentId: 0
});

async function fetchData() {
  loading.value = true;
  loading.value = false;
}

function handleAdd(parentId = 0) {
  modalType.value = 'add';
  formData.value = { id: 0, menuName: '', menuType: 'directory', path: '', component: '', icon: '', order: 0, status: '1', parentId };
  showModal.value = true;
}

function handleEdit(row: Api.SystemManage.Menu) {
  modalType.value = 'edit';
  formData.value = {
    id: row.id,
    menuName: row.menuName,
    menuType: row.menuType,
    path: row.path || '',
    component: row.component || '',
    icon: row.icon || '',
    order: row.order,
    status: row.status,
    parentId: row.parentId
  };
  showModal.value = true;
}

function handleDelete(row: Api.SystemManage.Menu) {
  window.$dialog?.warning({
    title: '提示',
    content: `确定删除菜单 "${row.menuName}" 吗？`,
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
    <NCard :bordered="false" class="flex-1 card-wrapper">
      <template #header>
        <NSpace justify="space-between">
          <span class="text-16px font-medium">菜单列表</span>
          <NButton type="primary" @click="handleAdd()">新增菜单</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="[
          { title: '菜单名称', key: 'menuName' },
          { title: '类型', key: 'menuType', render: (row) => (row.menuType === 'directory' ? '目录' : row.menuType === 'menu' ? '菜单' : '按钮') },
          { title: '路径', key: 'path' },
          { title: '图标', key: 'icon' },
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

    <NModal v-model:show="showModal" preset="card" :title="modalType === 'add' ? '新增菜单' : '编辑菜单'" class="w-600px">
      <NForm :model="formData" label-placement="left" :label-width="80">
        <NFormItem label="菜单名称" path="menuName">
          <NInput v-model:value="formData.menuName" placeholder="请输入菜单名称" />
        </NFormItem>
        <NFormItem label="菜单类型" path="menuType">
          <NRadioGroup v-model:value="formData.menuType">
            <NRadioButton value="directory">目录</NRadioButton>
            <NRadioButton value="menu">菜单</NRadioButton>
            <NRadioButton value="button">按钮</NRadioButton>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="路径" path="path">
          <NInput v-model:value="formData.path" placeholder="请输入路径" />
        </NFormItem>
        <NFormItem label="组件" path="component">
          <NInput v-model:value="formData.component" placeholder="请输入组件路径" />
        </NFormItem>
        <NFormItem label="图标" path="icon">
          <NInput v-model:value="formData.icon" placeholder="请输入图标" />
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