<script lang="tsx" setup>
import { computed, ref } from 'vue';
import { NEllipsis } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchGetDeptTree } from '@/service/api/system/dept';
import { fetchBatchDeleteUser, fetchGetUserList } from '@/service/api/system/user';
import { useAppStore } from '@/store/modules/app';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import UserSearch from './modules/user-search.vue';
import UserOperateModal from './modules/user-operate-modal.vue';

defineOptions({
  name: 'UserList'
});

useDict('sys_user_sex');
useDict('sys_normal_disable');

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { download } = useDownload();

const { loading: treeLoading, startLoading: startTreeLoading, endLoading: endTreeLoading } = useLoading();

const deptPattern = ref<string>();
const selectedKeys = ref<CommonType.IdType[]>([]);
const expandedKeys = ref<CommonType.IdType[]>([]);
const deptData = ref<Api.Common.CommonTreeRecord>([]);

const searchParams = ref<Api.System.UserSearchParams>({
  current: 1,
  size: 10,
  userName: null,
  nickName: null,
  userPhone: null,
  status: null,
  params: { beginTime: null, endTime: null }
});

const { loading, data, getData, getDataByPage, columnChecks, columns, mobilePagination } = useNaivePaginatedTable({
  api: fetchGetUserList,
  transform: response => defaultTransform(response),
  onPaginationParamsChange({ page, pageSize }) {
    searchParams.value.current = page;
    searchParams.value.size = pageSize;
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      width: 48,
      align: 'center',
      render: (_, index) => index + 1
    },
    {
      key: 'userName',
      title: $t('page.system.user.userName'),
      width: 120,
      align: 'left',
      ellipsis: true,
      render: row => {
        return (
          <div class="flex items-center justify-center gap-2">
            <NAvatar src={row.avatar} class="bg-primary">
              {row.avatar ? undefined : row.nickName.charAt(0)}
            </NAvatar>
            <div class="max-w-160px flex flex-col">
              <NEllipsis>{row.userName}</NEllipsis>
              <NEllipsis>{row.nickName}</NEllipsis>
            </div>
          </div>
        );
      }
    },
    {
      key: 'gender',
      title: $t('page.system.user.gender'),
      align: 'center',
      width: 80,
      ellipsis: true,
      render(row) {
        return <DictTag value={row.gender} dictCode="sys_user_sex" />;
      }
    },
    {
      key: 'deptName',
      title: $t('page.system.user.deptName'),
      align: 'center',
      width: 120,
      ellipsis: true,
      render: row => {
        return row.deptName || '-';
      }
    },
    {
      key: 'userEmail',
      title: $t('page.system.user.userEmail'),
      align: 'center',
      width: 120,
      ellipsis: true
    },
    {
      key: 'userPhone',
      title: $t('page.system.user.userPhone'),
      align: 'center',
      width: 120,
      ellipsis: true
    },
    {
      key: 'status',
      title: $t('page.system.user.status'),
      align: 'center',
      width: 80,
      render(row) {
        return <DictTag value={row.status} dictCode="sys_normal_disable" />;
      }
    },
    {
      key: 'createTime',
      title: $t('page.system.user.createTime'),
      align: 'center',
      width: 120
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 150,
      render: row => {
        if (row.userName === 'SuperAdmin') {
          return null;
        }
        const editBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => edit(row.userId!)}
            />
          );
        };

        const passwordBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:key-vertical-outline"
              tooltipContent="重置密码"
              onClick={() => handleResetPwd(row.userId!)}
            />
          );
        };

        const deleteBtn = () => {
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(row.userId!)}
            />
          );
        };

        const buttons = [];
        if (hasAuth('system:user:edit')) buttons.push(editBtn());
        if (hasAuth('system:user:resetPwd')) buttons.push(passwordBtn());
        if (hasAuth('system:user:remove')) buttons.push(deleteBtn());

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>
                {index !== 0 && <NDivider vertical />}
                {btn}
              </>
            ))}
          </div>
        );
      }
    }
  ]
});

// 操作的辅助方法
const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onDeleted, onBatchDeleted } =
  useTableOperate(data, 'userId', getData);

function edit(userId: CommonType.IdType) {
  handleEdit(userId);
}

async function handleBatchDelete() {
  // request
  const { error } = await fetchBatchDeleteUser(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

function handleResetPwd(userId: CommonType.IdType) {
  window.$message?.success(`重置密码成功，用户ID: ${userId}`);
}

function handleDelete(userId: CommonType.IdType) {
  onDeleted();
  window.$message?.success(`删除用户成功，用户ID: ${userId}`);
}

async function getTreeData() {
  startTreeLoading();
  const { data: tree, error } = await fetchGetDeptTree();
  if (!error) {
    deptData.value = tree;
  }
  endTreeLoading();
}

function handleResetTreeData() {
  deptPattern.value = undefined;
  getTreeData();
}

function handleExport() {
  download('/user/export', searchParams.value, `${$t('page.system.user.title')}_${new Date().getTime()}.xlsx`);
}

function handleResetSearchParams() {
  searchParams.value = {
    current: 1,
    size: 10,
    userName: null,
    nickName: null,
    userPhone: null,
    status: null,
    params: { beginTime: null, endTime: null }
  };
  getDataByPage();
}

const selectable = computed(() => {
  return !loading.value;
});
function handleClickTree(keys: CommonType.IdType[]) {
  window.$message?.success(`选中的部门ID: ${keys.join(', ')}`);
}
</script>

<template>
  <TableSiderLayout :sider-title="$t('page.system.dept.title')">
    <template #header-extra>
      <NButton size="small" text class="h-18px" @click.stop="() => handleResetTreeData()">
        <template #icon>
          <SvgIcon icon="ic:round-refresh" />
        </template>
      </NButton>
    </template>
    <template #sider>
      <NInput v-model:value="deptPattern" clearable :placeholder="$t('common.keywordSearch')" />
      <NSpin class="dept-tree" :show="treeLoading">
        <NTree
          v-model:expanded-keys="expandedKeys"
          v-model:selected-keys="selectedKeys"
          block-node
          show-line
          :data="deptData as []"
          :show-irrelevant-nodes="false"
          :pattern="deptPattern"
          virtual-scroll
          key-field="id"
          label-field="label"
          class="h-full min-h-200px py-3"
          :selectable="selectable"
          @update:selected-keys="handleClickTree"
        >
          <template #empty>
            <NEmpty :description="$t('page.system.dept.empty')" class="h-full min-h-200px justify-center" />
          </template>
        </NTree>
      </NSpin>
    </template>
    <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
      <UserSearch v-model:model="searchParams" @search="getDataByPage" @reset="handleResetSearchParams" />
      <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />
      <NCard :title="$t('page.system.user.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
        <template #header-extra>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="hasAuth('system:user:add')"
            :show-delete="hasAuth('system:user:remove')"
            :show-export="hasAuth('system:user:export')"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @export="handleExport"
            @refresh="getData"
          ></TableHeaderOperation>
        </template>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          size="small"
          :flex-height="!appStore.isMobile"
          :loading="loading"
          :scroll-x="1200"
          remote
          :row-key="row => row.userId"
          :pagination="mobilePagination"
          class="h-full"
        >
          <template #empty>
            <NEmpty :description="$t('page.system.user.empty')" class="h-full min-h-200px justify-center" />
          </template>
        </NDataTable>
        <UserOperateModal
          v-model:visible="drawerVisible"
          :operate-type="operateType"
          :row-data="editingData"
          :dept-data="deptData"
          :dept-id="searchParams.deptId"
          @submitted="getDataByPage"
        />
      </NCard>
    </div>
  </TableSiderLayout>
</template>

<style scoped lang="scss">
.dept-tree {
  .n-button {
    --n-padding: 8px !important;
  }

  :deep(.n-tree__empty) {
    height: 100%;
    justify-content: center;
  }

  :deep(.n-spin-content) {
    height: 100%;
  }

  :deep(.infinite-scroll) {
    height: calc(100vh - 228px - var(--calc-footer-height, 0px)) !important;
    max-height: calc(100vh - 228px - var(--calc-footer-height, 0px)) !important;
  }

  @media screen and (max-width: 1024px) {
    :deep(.infinite-scroll) {
      height: calc(100vh - 227px - var(--calc-footer-height, 0px)) !important;
      max-height: calc(100vh - 227px - var(--calc-footer-height, 0px)) !important;
    }
  }

  :deep(.n-tree-node) {
    height: 30px;
  }

  :deep(.n-tree-node-switcher) {
    height: 30px;
  }

  :deep(.n-tree-node-switcher__icon) {
    font-size: 16px !important;
    height: 16px !important;
    width: 16px !important;
  }
}

:deep(.n-data-table-wrapper),
:deep(.n-data-table-base-table),
:deep(.n-data-table-base-table-body) {
  height: 100%;
}

@media screen and (max-width: 800px) {
  :deep(.n-data-table-base-table-body) {
    max-height: calc(100vh - 400px - var(--calc-footer-height, 0px));
  }
}

@media screen and (max-width: 802px) {
  :deep(.n-data-table-base-table-body) {
    max-height: calc(100vh - 473px - var(--calc-footer-height, 0px));
  }
}

:deep(.n-card-header__main) {
  min-width: 69px !important;
}
</style>
