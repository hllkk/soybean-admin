<script lang="ts" setup>
import { ref } from 'vue';
import { fetchGetRoleList } from '@/service/api/system/role';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import RoleSearch from './modules/role-search.vue';

defineOptions({
  name: 'RoleManage'
});

const { hasAuth } = useAuth();
const appStore = useAppStore();

const searchParams = ref<Api.System.RoleSearchParams>({
  current: 1,
  size: 10,
  roleName: null,
  roleKey: null,
  status: null,
  params: { beginTime: null, endTime: null }
});

const { loading, data, getData, getDataByPage, columnChecks, columns, mobilePagination } = useNaivePaginatedTable({
  api: fetchGetRoleList,
  transform: response => defaultTransform(response),
  onPaginationParamsChange(params) {
    console.log(params);
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
      align: 'center',
      width: 64
    },
    {
      key: 'roleName',
      title: '角色名称',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'roleKey',
      title: '角色编码',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'roleSort',
      title: '排序',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 120
    }
  ]
});

// 操作的辅助方法
const { checkedRowKeys, handleAdd, onBatchDeleted } = useTableOperate(data, 'id', getData);

function handleResetSearchParams() {
  searchParams.value = {
    current: 1,
    size: 10,
    roleName: null,
    roleKey: null,
    status: null,
    params: { beginTime: null, endTime: null }
  };
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <RoleSearch v-model:model="searchParams" @search="getDataByPage" @reset="handleResetSearchParams" />
    <NCard :title="$t('page.system.role.list')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('system:role:add')"
          :show-delete="hasAuth('system:role:remove')"
          :show-export="hasAuth('system:role:export')"
          @add="handleAdd"
          @delete="onBatchDeleted"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1200"
        :loading="loading"
        remote
        :row-key="row => row.roleId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>
