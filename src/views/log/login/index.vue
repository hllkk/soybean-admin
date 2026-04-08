<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import {
  fetchGetLoginLogList,
  fetchDeleteLoginLog,
  fetchBatchDeleteLoginLog,
  fetchCleanLoginLog,
  fetchLockUser
} from '@/service/api/system';
import { useAppStore } from '@/store/modules/app';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import ButtonIcon from '@/components/custom/button-icon.vue';
import { $t } from '@/locales';
import LoginSearch from './modules/login-search.vue';

defineOptions({
  name: 'LoginLogList'
});

const { hasAuth } = useAuth();
const appStore = useAppStore();
const { download } = useDownload();

const searchParams = ref<Api.System.LoginLogSearchParams>({
  pageNum: 1,
  pageSize: 10
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetLoginLogList(searchParams.value),
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
        key: 'userName',
        title: $t('page.system.loginLog.userName'),
        align: 'center',
        width: 120,
        ellipsis: true
      },
      {
        key: 'deviceType',
        title: $t('page.system.loginLog.deviceType'),
        align: 'center',
        width: 100
      },
      {
        key: 'ipaddr',
        title: $t('page.system.loginLog.ipaddr'),
        align: 'center',
        width: 120
      },
      {
        key: 'loginLocation',
        title: $t('page.system.loginLog.loginLocation'),
        align: 'left',
        width: 120,
        ellipsis: true
      },
      {
        key: 'browser',
        title: $t('page.system.loginLog.browser'),
        align: 'center',
        width: 120,
        ellipsis: true
      },
      {
        key: 'os',
        title: $t('page.system.loginLog.os'),
        align: 'center',
        width: 120,
        ellipsis: true
      },
      {
        key: 'status',
        title: $t('page.system.loginLog.status'),
        align: 'center',
        width: 80,
        render: row => {
          return (
            <NTag type={row.status === '0' ? 'success' : 'error'} size="small">
              {row.status === '0' ? '成功' : '失败'}
            </NTag>
          );
        }
      },
      {
        key: 'loginTime',
        title: $t('page.system.loginLog.loginTime'),
        align: 'center',
        width: 160
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: 100,
        render: row => {
          return (
            <div class="flex-center gap-8px">
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:visibility-outline"
                tooltipContent={$t('common.detail')}
                onClick={() => handleDetail()}
              />
              <ButtonIcon
                text
                type="warning"
                icon="material-symbols:lock-outline"
                tooltipContent={$t('page.system.loginLog.lock')}
                popconfirmContent={$t('page.system.loginLog.lockConfirm')}
                onPositiveClick={() => handleLock(row.userName)}
              />
            </div>
          );
        }
      }
    ]
  });

const { checkedRowKeys, onDeleted, onBatchDeleted } = useTableOperate(data, 'infoId', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteLoginLog(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function _handleDelete(infoId: CommonType.IdType) {
  const { error } = await fetchDeleteLoginLog(infoId);
  if (error) return;
  onDeleted();
}

function handleDetail() {
  window.$message?.info($t('common.lookForward'));
}

async function handleLock(userName: string) {
  const { error } = await fetchLockUser(userName);
  if (!error) {
    window.$message?.success($t('page.system.loginLog.lockSuccess'));
  }
}

async function handleClean() {
  window.$dialog?.warning({
    title: $t('common.warning'),
    content: $t('page.system.loginLog.clearConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchCleanLoginLog();
      if (!error) {
        window.$message?.success($t('page.system.loginLog.clearSuccess'));
        getData();
      }
    }
  });
}

function handleExport() {
  download('/system/logininfor/export', searchParams.value, `登录日志_${new Date().getTime()}.xlsx`);
}

function handleResetSearch() {
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <LoginSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />
    <NCard :title="$t('page.system.loginLog.pageTitle')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="false"
          :show-delete="hasAuth('system:logininfor:remove')"
          :show-export="hasAuth('system:logininfor:export')"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        >
          <template #before>
            <NButton v-if="hasAuth('system:logininfor:remove')" size="small" ghost type="warning" @click="handleClean">
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
        :row-key="row => row.infoId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
