<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import {
  fetchGetOperationLogList,
  fetchDeleteOperationLog,
  fetchBatchDeleteOperationLog,
  fetchCleanOperationLog
} from '@/service/api/system';
import { useAppStore } from '@/store/modules/app';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import ButtonIcon from '@/components/custom/button-icon.vue';
import { $t } from '@/locales';
import OperationSearch from './modules/operation-search.vue';

defineOptions({
  name: 'OperationLogList'
});

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { download } = useDownload();

const searchParams = ref<Api.System.OperationLogSearchParams>({
  pageNum: 1,
  pageSize: 10
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetOperationLogList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
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
        width: 60,
        render: (_, index) => {
          return (searchParams.value.pageNum - 1) * searchParams.value.pageSize + index + 1;
        }
      },
      {
        key: 'title',
        title: $t('page.system.operationLog.title'),
        align: 'left',
        width: 120,
        ellipsis: true
      },
      {
        key: 'businessType',
        title: $t('page.system.operationLog.businessType'),
        align: 'center',
        width: 100,
        render: row => {
          const typeMap: Record<number, { label: string; type: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' }> = {
            0: { label: '其他', type: 'default' },
            1: { label: '新增', type: 'success' },
            2: { label: '修改', type: 'primary' },
            3: { label: '删除', type: 'error' },
            4: { label: '授权', type: 'warning' },
            5: { label: '导出', type: 'info' },
            6: { label: '导入', type: 'info' },
            7: { label: '强退', type: 'error' },
            8: { label: '生成代码', type: 'primary' },
            9: { label: '清空数据', type: 'error' }
          };
          const item = typeMap[row.businessType] || { label: '未知', type: 'default' };
          return <NTag type={item.type} size="small">{item.label}</NTag>;
        }
      },
      {
        key: 'requestMethod',
        title: $t('page.system.operationLog.requestMethod'),
        align: 'center',
        width: 80,
        render: row => {
          const methodType: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
            GET: 'success',
            POST: 'primary',
            PUT: 'warning',
            DELETE: 'error'
          };
          return <NTag type={methodType[row.requestMethod] || 'default'} size="small">{row.requestMethod}</NTag>;
        }
      },
      {
        key: 'operName',
        title: $t('page.system.operationLog.operName'),
        align: 'center',
        width: 100,
        ellipsis: true
      },
      {
        key: 'operIp',
        title: $t('page.system.operationLog.operIp'),
        align: 'center',
        width: 120
      },
      {
        key: 'operLocation',
        title: $t('page.system.operationLog.operLocation'),
        align: 'left',
        width: 120,
        ellipsis: true
      },
      {
        key: 'costTime',
        title: $t('page.system.operationLog.costTime'),
        align: 'center',
        width: 80,
        render: row => `${row.costTime}ms`
      },
      {
        key: 'status',
        title: $t('page.system.operationLog.status'),
        align: 'center',
        width: 80,
        render: row => {
          return (
            <NTag type={row.status === 0 ? 'success' : 'error'} size="small">
              {row.status === 0 ? '成功' : '失败'}
            </NTag>
          );
        }
      },
      {
        key: 'operTime',
        title: $t('page.system.operationLog.operTime'),
        align: 'center',
        width: 160
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: 80,
        render: row => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:visibility-outline"
              tooltipContent={$t('common.detail')}
              onClick={() => handleDetail()}
            />
          );
        }
      }
    ]
  });

const { checkedRowKeys, onDeleted, onBatchDeleted } = useTableOperate(data, 'operId', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteOperationLog(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(operId: CommonType.IdType) {
  const { error } = await fetchDeleteOperationLog(operId);
  if (error) return;
  onDeleted();
}

function handleDetail() {
  window.$message?.info($t('common.lookForward'));
}

async function handleClean() {
  window.$dialog?.warning({
    title: $t('common.warning'),
    content: $t('page.system.operationLog.clearConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchCleanOperationLog();
      if (!error) {
        window.$message?.success($t('page.system.operationLog.clearSuccess'));
        getData();
      }
    }
  });
}

function handleExport() {
  download('/system/operlog/export', searchParams.value, `操作日志_${new Date().getTime()}.xlsx`);
}

function handleResetSearch() {
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <OperationSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />
    <NCard :title="$t('page.system.operationLog.pageTitle')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="false"
          :show-delete="hasAuth('system:operlog:remove')"
          :show-export="hasAuth('system:operlog:export')"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        >
          <template #before>
            <NButton v-if="hasAuth('system:operlog:remove')" size="small" ghost type="warning" @click="handleClean">
              {{ $t('common.clear') }}
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="row => row.operId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>

<style scoped></style>