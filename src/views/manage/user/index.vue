<script setup lang="ts">
import { h, onMounted, ref, shallowRef, computed } from 'vue';
import { NAvatar, NButton, NDivider, NEllipsis, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { useNaivePaginatedTable, defaultTransform } from '@/hooks/common/table';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import TableRowCheckAlert from '@/components/advanced/table-row-check-alert.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

defineOptions({
  name: 'UserManagePage'
});

const { formRef, validate } = useNaiveForm();
const { createRequiredRule, patternRules } = useFormRules();

const searchParams = ref<Api.SystemManage.UserSearchParams>({
  page: 1,
  pageSize: 10,
  userName: '',
  nickName: '',
  phone: '',
  status: ''
});

const deptPattern = ref('');
const expandedKeys = ref<number[]>([]);
const selectedKeys = ref<number[]>([]);
const deptData = shallowRef<Api.SystemManage.Dept[]>([]);
const treeLoading = ref(false);

const { columns, data, getData, loading, pagination, mobilePagination, scrollX } = useNaivePaginatedTable<
  any,
  Api.SystemManage.User
>({
  api: async () => {
    return { data: { records: [], total: 0, current: 1, size: 10 }, error: null };
  },
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.page = params.page ?? 1;
    searchParams.value.pageSize = params.pageSize ?? 10;
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    {
      key: 'userName',
      title: '用户名',
      align: 'left',
      width: 200,
      render: (row: Api.SystemManage.User) => {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(NAvatar, { src: row.avatar, class: 'bg-primary', size: 36 }, () => (row.avatar ? undefined : row.nickName?.charAt(0) || 'U')),
          h('div', { class: 'flex flex-col max-w-140px' }, [
            h(NEllipsis, null, () => row.userName),
            h(NEllipsis, { class: 'text-gray-400 text-12px' }, () => row.nickName)
          ])
        ]);
      }
    },
    { key: 'deptName', title: '部门', align: 'center', width: 120, ellipsis: true },
    { key: 'phone', title: '手机号', align: 'center', width: 130, ellipsis: true },
    { key: 'email', title: '邮箱', align: 'center', width: 180, ellipsis: true },
    {
      key: 'status',
      title: '状态',
      align: 'center',
      width: 80,
      render: (row: Api.SystemManage.User) => {
        const isNormal = row.status === '1';
        return h(NTag, { type: isNormal ? 'success' : 'error', size: 'small' }, () => isNormal ? '正常' : '停用');
      }
    },
    { key: 'createdAt', title: '创建时间', align: 'center', width: 160 },
    {
      key: 'operate',
      title: '操作',
      align: 'center',
      width: 160,
      render: (row: Api.SystemManage.User) => {
        if (row.id === 1) return null;
        return h('div', { class: 'flex items-center justify-center gap-4px' }, [
          h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row.id) }, () => '编辑'),
          h(NDivider, { vertical: true }),
          h(NButton, { text: true, type: 'primary', onClick: () => handleResetPwd(row) }, () => '重置密码'),
          h(NDivider, { vertical: true }),
          h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row.id) }, () => '删除')
        ]);
      }
    }
  ]
});

const checkedRowKeys = ref<number[]>([]);
const { bool: drawerVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();
const operateType = ref<'add' | 'edit'>('add');
const editingId = ref<number | null>(null);
const { bool: passwordVisible, setTrue: openPasswordDrawer, setFalse: closePasswordDrawer } = useBoolean();
const passwordUserId = ref<number>(0);

const formData = ref({
  id: 0, deptId: null as number | null, userName: '', nickName: '', email: '', phone: '',
  sex: '0', password: '', status: '0', roleIds: [] as number[], remark: ''
});

const rules = computed(() => ({
  userName: [createRequiredRule('请输入用户名')],
  nickName: [createRequiredRule('请输入昵称')],
  password: operateType.value === 'add' ? [createRequiredRule('请输入密码'), patternRules.pwd] : [],
  phone: [patternRules.phone],
  email: [patternRules.email],
  status: [createRequiredRule('请选择状态')]
}));

function handleAdd() {
  operateType.value = 'add';
  Object.assign(formData.value, { id: 0, deptId: null, userName: '', nickName: '', email: '', phone: '', sex: '0', password: '', status: '0', roleIds: [], remark: '' });
  openDrawer();
}

function handleEdit(id: number) {
  operateType.value = 'edit';
  editingId.value = id;
  const row = data.value.find(item => item.id === id);
  if (row) Object.assign(formData.value, { ...row, password: '' });
  openDrawer();
}

function handleResetPwd(row: Api.SystemManage.User) {
  passwordUserId.value = row.id;
  openPasswordDrawer();
}

async function handleDelete(_id: number) {
  window.$message?.destroyAll();
  window.$message?.success('删除成功');
  getData();
}

async function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning('请选择要删除的用户');
    return;
  }
  window.$dialog?.warning({
    title: '提示',
    content: `确定删除选中的 ${checkedRowKeys.value.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      window.$message?.destroyAll();
      window.$message?.success('删除成功');
      checkedRowKeys.value = [];
      getData();
    }
  });
}

async function handleSubmit() {
  await validate();
  window.$message?.destroyAll();
  window.$message?.success(operateType.value === 'add' ? '添加成功' : '编辑成功');
  closeDrawer();
  getData();
}

function handleExport() {
  window.$message?.info('导出功能开发中');
}

function handleResetSearch() {
  Object.assign(searchParams.value, { userName: '', nickName: '', phone: '', status: '' });
  getData();
}

function handleSearch() {
  getData();
}

function handleClickTree(keys: number[]) {
  if (keys.length > 0) {
    searchParams.value.deptId = keys[0];
  } else {
    searchParams.value.deptId = null;
  }
  getData();
}

async function getDeptTree() {
  treeLoading.value = true;
  treeLoading.value = false;
}

onMounted(() => {
  getDeptTree();
  getData();
});
</script>

<template>
  <div class="h-full flex gap-16px overflow-hidden">
    <NCard :bordered="false" size="small" class="w-280px flex-shrink-0 card-wrapper" content-class="overflow-auto">
      <template #header>
        <div class="flex items-center justify-between">
          <span>部门列表</span>
          <NButton size="small" text @click.stop="getDeptTree">
            <template #icon><SvgIcon icon="ic:round-refresh" /></template>
          </NButton>
        </div>
      </template>
      <NInput v-model:value="deptPattern" clearable placeholder="请输入关键词搜索" class="mb-12px" />
      <NSpin :show="treeLoading">
        <NTree
          v-model:expanded-keys="expandedKeys"
          v-model:selected-keys="selectedKeys"
          block-line
          :data="deptData as any"
          :pattern="deptPattern"
          key-field="id"
          label-field="deptName"
          class="min-h-200px"
          selectable
          @update:selected-keys="handleClickTree"
        />
      </NSpin>
    </NCard>

    <div class="flex-1 flex flex-col gap-12px overflow-hidden">
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NForm :model="searchParams" label-placement="left" inline>
          <NFormItem label="用户名" path="userName">
            <NInput v-model:value="searchParams.userName" placeholder="请输入用户名" clearable style="width: 160px" />
          </NFormItem>
          <NFormItem label="昵称" path="nickName">
            <NInput v-model:value="searchParams.nickName" placeholder="请输入昵称" clearable style="width: 160px" />
          </NFormItem>
          <NFormItem label="手机号" path="phone">
            <NInput v-model:value="searchParams.phone" placeholder="请输入手机号" clearable style="width: 160px" />
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="searchParams.status"
              :options="[{ label: '全部', value: '' }, { label: '正常', value: '1' }, { label: '停用', value: '0' }]"
              clearable
              placeholder="请选择状态"
              style="width: 120px"
            />
          </NFormItem>
          <NFormItem>
            <NSpace>
              <NButton type="primary" @click="handleSearch">
                <template #icon><icon-ic-round-search /></template>搜索
              </NButton>
              <NButton @click="handleResetSearch">
                <template #icon><icon-ic-round-refresh /></template>重置
              </NButton>
            </NSpace>
          </NFormItem>
        </NForm>
      </NCard>

      <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />

      <NCard title="用户列表" :bordered="false" size="small" class="card-wrapper flex-1">
        <template #header-extra>
          <TableHeaderOperation
            :loading="loading"
            :disabled-delete="checkedRowKeys.length === 0"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @export="handleExport"
            @refresh="getData"
          />
        </template>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          size="small"
          :flex-height="true"
          :scroll-x="scrollX"
          :loading="loading"
          remote
          :row-key="row => row.id"
          :pagination="false ? mobilePagination : pagination"
          class="h-full"
        />
      </NCard>
    </div>

    <NDrawer v-model:show="drawerVisible" :width="600" class="max-w-90%">
      <NDrawerContent :title="operateType === 'add' ? '新增用户' : '编辑用户'" closable>
        <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="80" require-mark-placement="right-hanging">
          <NFormItem v-if="operateType === 'add'" label="用户名" path="userName">
            <NInput v-model:value="formData.userName" placeholder="请输入用户名" />
          </NFormItem>
          <NFormItem label="昵称" path="nickName">
            <NInput v-model:value="formData.nickName" placeholder="请输入昵称" />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" label="密码" path="password">
            <NInput v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" />
          </NFormItem>
          <NFormItem label="手机号" path="phone">
            <NInput v-model:value="formData.phone" placeholder="请输入手机号" />
          </NFormItem>
          <NFormItem label="邮箱" path="email">
            <NInput v-model:value="formData.email" placeholder="请输入邮箱" />
          </NFormItem>
          <NFormItem label="性别" path="sex">
            <NRadioGroup v-model:value="formData.sex">
              <NRadioButton value="0">男</NRadioButton>
              <NRadioButton value="1">女</NRadioButton>
              <NRadioButton value="2">未知</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NRadioGroup v-model:value="formData.status">
              <NRadioButton value="1">正常</NRadioButton>
              <NRadioButton value="0">停用</NRadioButton>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="备注" path="remark">
            <NInput v-model:value="formData.remark" type="textarea" placeholder="请输入备注" :rows="3" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="closeDrawer">取消</NButton>
            <NButton type="primary" :loading="loading" @click="handleSubmit">确定</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NDrawer v-model:show="passwordVisible" :width="400" class="max-w-90%">
      <NDrawerContent title="重置密码" closable>
        <NForm label-placement="left" :label-width="80">
          <NFormItem label="新密码">
            <NInput type="password" show-password-on="click" placeholder="请输入新密码" />
          </NFormItem>
          <NFormItem label="确认密码">
            <NInput type="password" show-password-on="click" placeholder="请再次输入密码" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="closePasswordDrawer">取消</NButton>
            <NButton type="primary">确定</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
:deep(.n-data-table-wrapper),
:deep(.n-data-table-base-table),
:deep(.n-data-table-base-table-body) {
  height: 100%;
}
</style>
