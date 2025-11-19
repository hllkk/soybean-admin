<script lang="ts" setup>
import { ref } from 'vue';
import { fetchGetDeptList } from '@/service/api/system/dept';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import DeptSearch from './modules/dept-search.vue';

defineOptions({
  name: 'DeptList'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

const { loading, data, getData, getDataByPage, columnChecks, columns, mobilePagination } = useNaivePaginatedTable({
  api: fetchGetDeptList,
  transform: response => defaultTransform(response),
  onPaginationParamsChange(params) {
    console.log(params);
  },
  columns: () => [
    {
      key: 'deptName',
      title: $t('page.system.dept.deptName'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'deptCategory',
      title: $t('page.system.dept.deptCategory'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'orderNum',
      title: $t('page.system.dept.sort'),
      align: 'center',
      minWidth: 60
    },
    {
      key: 'createTime',
      title: $t('page.system.dept.createTime'),
      align: 'center',
      minWidth: 120
    }
  ]
});

const searchParams = ref<Api.System.DeptSearchParams>({
  current: 1,
  size: 10,
  deptName: null,
  status: null
});

const resetSearchParams = () => {
  searchParams.value = {
    current: 1,
    size: 10,
    deptName: null,
    status: null
  };
};
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <DeptSearch v-model:model="searchParams" @reset="resetSearchParams" />
    <NCard :title="$t('page.system.dept.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="hasAuth('system:dept:add')"
          :show-delete="false"
          :show-sync="hasAuth('system:dept:sync')"
          @refresh="getData"
        >
          <template #prefix>
            <NButton v-if="!isCollapse" :disabled="!data.length" size="small" @click="expandAll">
              <template #icon>
                <icon-quill-expand />
              </template>
              {{ $t('page.system.dept.expandAll') }}
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
    </NCard>
  </div>
</template>
