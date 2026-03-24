<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, shallowRef } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NAvatar, NButton, NDivider, NEllipsis, NSpace, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'UserManagePage'
});

const appStore = useAppStore();
const { formRef, validate } = useNaiveForm();
const { createRequiredRule, patternRules } = useFormRules();

// 加载状态
const loading = ref(false);

// 表格数据
const tableData = ref<Api.SystemManage.User[]>([]);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
});

// 搜索条件
const searchParams = reactive({
  userName: '',
  nickName: '',
  phone: '',
  status: '' as '' | '0' | '1'
});

// 选中的行
const checkedRowKeys = ref<number[]>([]);

// 抽屉控制
const { bool: drawerVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();
const operateType = shallowRef<'add' | 'edit'>('add');
const editingData = shallowRef<Api.SystemManage.User | null>(null);

// 表单数据
const formData = reactive({
  userId: 0,
  deptId: null as number | null,
  userName: '',
  nickName: '',
  email: '',
  phone: '',
  sex: '0',
  password: '',
  status: '0',
  roleIds: [] as number[],
  remark: ''
});

// 表单规则
const rules = computed(() => ({
  userName: [createRequiredRule('请输入用户名')],
  nickName: [createRequiredRule('请输入昵称')],
  password: operateType.value === 'add' ? [createRequiredRule('请输入密码'), patternRules.pwd] : [],
  phone: [patternRules.phone],
  email: [patternRules.email],
  status: [createRequiredRule('请选择状态')]
}));

// 表格列定义
const columns: DataTableColumns<Api.SystemManage.User> = [
  {
    type: 'selection',
    align: 'center',
    width: 48
  },
  {
    key: 'userName',
    title: '用户名',
    align: 'left',
    width: 200,
    render: row => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(NAvatar, { src: row.avatar, class: 'bg-primary', size: 36 }, () =>
          row.avatar ? undefined : row.nickName?.charAt(0) || 'U'
        ),
        h('div', { class: 'flex flex-col max-w-140px' }, [
          h(NEllipsis, null, () => row.userName),
          h(NEllipsis, { class: 'text-gray-400 text-12px' }, () => row.nickName)
        ])
      ]);
    }
  },
  {
    key: 'deptName',
    title: '部门',
    align: 'center',
    width: 120,
    ellipsis: true
  },
  {
    key: 'phone',
    title: '手机号',
    align: 'center',
    width: 130,
    ellipsis: true
  },
  {
    key: 'email',
    title: '邮箱',
    align: 'center',
    width: 180,
    ellipsis: true
  },
  {
    key: 'status',
    title: '状态',
    align: 'center',
    width: 80,
    render: row => {
      const isNormal = row.status === '1';
      return h(
        NTag,
        { type: isNormal ? 'success' : 'error', size: 'small' },
        () => (isNormal ? '正常' : '停用')
      );
    }
  },
  {
    key: 'createdAt',
    title: '创建时间',
    align: 'center',
    width: 160
  },
  {
    key: 'operate',
    title: '操作',
    align: 'center',
    width: 160,
    render: row => {
      if (row.id === 1) return null; // 超级管理员不能操作

      const buttons = [
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => handleEdit(row)
          },
          () => '编辑'
        ),
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => handleResetPwd(row)
          },
          () => '重置密码'
        ),
        h(
          NButton,
          {
            text: true,
            type: 'error',
            onClick: () => handleDelete(row)
          },
          () => '删除'
        )
      ];

      return h(NSpace, { size: 4 }, () =>
        buttons.map((btn, index) =>
          h('span', { class: 'flex items-center' }, [
            index > 0 && h(NDivider, { vertical: true }),
            btn
          ])
        )
      );
    }
  }
];

// 获取表格数据
async function getData() {
  loading.value = true;
  // TODO: 调用API获取数据
  // const { data, error } = await fetchGetUserList({ ...searchParams, page: pagination.page, pageSize: pagination.pageSize });
  loading.value = false;
}

// 搜索
function handleSearch() {
  pagination.page = 1;
  getData();
}

// 重置搜索
function handleReset() {
  Object.assign(searchParams, { userName: '', nickName: '', phone: '', status: '' });
  handleSearch();
}

// 新增
function handleAdd() {
  operateType.value = 'add';
  Object.assign(formData, {
    userId: 0,
    deptId: null,
    userName: '',
    nickName: '',
    email: '',
    phone: '',
    sex: '0',
    password: '',
    status: '0',
    roleIds: [],
    remark: ''
  });
  openDrawer();
}

// 编辑
function handleEdit(row: Api.SystemManage.User) {
  operateType.value = 'edit';
  editingData.value = jsonClone(row);
  Object.assign(formData, {
    ...row,
    password: ''
  });
  openDrawer();
}

// 重置密码
function handleResetPwd(row: Api.SystemManage.User) {
  window.$dialog?.warning({
    title: '提示',
    content: `确定重置用户 "${row.nickName}" 的密码吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      // TODO: 调用API重置密码
      window.$message?.destroyAll();
      window.$message?.success('密码已重置为: 123456');
    }
  });
}

// 删除
function handleDelete(row: Api.SystemManage.User) {
  window.$dialog?.warning({
    title: '提示',
    content: `确定删除用户 "${row.nickName}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      // TODO: 调用API删除
      window.$message?.destroyAll();
      window.$message?.success('删除成功');
      getData();
    }
  });
}

// 批量删除
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
      // TODO: 调用API批量删除
      window.$message?.destroyAll();
      window.$message?.success('删除成功');
      checkedRowKeys.value = [];
      getData();
    }
  });
}

// 提交表单
async function handleSubmit() {
  await validate();

  loading.value = true;
  // TODO: 调用API保存
  loading.value = false;

  window.$message?.destroyAll();
  window.$message?.success(operateType.value === 'add' ? '添加成功' : '编辑成功');
  closeDrawer();
  getData();
}

// 导出
function handleExport() {
  window.$message?.destroyAll();
  window.$message?.info('导出功能开发中');
}

// 分页变化
function handlePageChange(page: number) {
  pagination.page = page;
  getData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  getData();
}

// 初始化
onMounted(() => {
  getData();
});
</script>

<template>
  <div class="h-full flex-col">
    <!-- 搜索区域 -->
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <NForm :model="searchParams" label-placement="left" :label-width="80">
        <NGrid :cols="appStore.isMobile ? 1 : 24" :x-gap="16" :y-gap="16">
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="用户名" path="userName">
              <NInput v-model:value="searchParams.userName" placeholder="请输入用户名" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="昵称" path="nickName">
              <NInput v-model:value="searchParams.nickName" placeholder="请输入昵称" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
            <NFormItem label="手机号" path="phone">
              <NInput v-model:value="searchParams.phone" placeholder="请输入手机号" clearable />
            </NFormItem>
          </NGi>
          <NGi :span="appStore.isMobile ? 24 : 4">
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
          <NGi :span="appStore.isMobile ? 24 : 8">
            <NSpace>
              <NButton type="primary" @click="handleSearch">
                <template #icon>
                  <icon-ic-round-search />
                </template>
                搜索
              </NButton>
              <NButton @click="handleReset">
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

    <!-- 表格区域 -->
    <NCard :bordered="false" class="flex-1 card-wrapper">
      <template #header>
        <NSpace justify="space-between">
          <span class="text-16px font-medium">用户列表</span>
          <NSpace>
            <NButton type="primary" @click="handleAdd">
              <template #icon>
                <icon-ic-round-plus />
              </template>
              新增
            </NButton>
            <NButton type="error" :disabled="checkedRowKeys.length === 0" @click="handleBatchDelete">
              <template #icon>
                <icon-ic-round-delete />
              </template>
              批量删除
            </NButton>
            <NButton @click="handleExport">
              <template #icon>
                <icon-uil-export />
              </template>
              导出
            </NButton>
          </NSpace>
        </NSpace>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
        :scroll-x="1200"
        remote
        flex-height
        class="h-full"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </NCard>

    <!-- 新增/编辑抽屉 -->
    <NDrawer v-model:show="drawerVisible" :width="600" class="max-w-90%">
      <NDrawerContent :title="operateType === 'add' ? '新增用户' : '编辑用户'" closable>
        <NForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="left"
          :label-width="80"
          require-mark-placement="right-hanging"
        >
          <NFormItem v-if="operateType === 'add'" label="用户名" path="userName">
            <NInput v-model:value="formData.userName" placeholder="请输入用户名" />
          </NFormItem>
          <NFormItem label="昵称" path="nickName">
            <NInput v-model:value="formData.nickName" placeholder="请输入昵称" />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" label="密码" path="password">
            <NInput
              v-model:value="formData.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
            />
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
  </div>
</template>

<style scoped></style>