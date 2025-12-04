<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchGetDeptTree } from '@/service/api/system/dept';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import PostSearch from './modules/post-search.vue';

const { hasAuth } = useAuth();
const { loading: treeLoading, startLoading: startTreeLoading, endLoading: endTreeLoading } = useLoading();

const deptData = ref<Api.Common.CommonTreeRecord>([]);
const deptPattern = ref<string>();
const selectedKeys = ref<CommonType.IdType[]>([]);
const expandedKeys = ref<CommonType.IdType[]>([]);

const searchParams = ref<Api.System.PostSearchParams>({
  postName: '',
  status: undefined,
  current: 1,
  size: 10
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: fetchGetPostList,
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
        key: 'postCode',
        title: '岗位编码',
        align: 'center',
        minWidth: 120
      },
      {
        key: 'postCategory',
        title: '类别编码',
        align: 'center',
        minWidth: 120
      },
      {
        key: 'postName',
        title: '岗位名称',
        align: 'center',
        minWidth: 120
      }
    ]
  });

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

const selectable = computed(() => {
  return !treeLoading.value;
});
function handleClickTree(keys: CommonType.IdType[]) {
  window.$message?.success(`选中的部门ID: ${keys.join(', ')}`);
}

function handleResetSearch() {
  searchParams.value = {
    postName: '',
    status: undefined,
    current: 1,
    size: 10
  };
  getDataByPage();
}
</script>

<template>
  <TableSiderLayout>
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
      <PostSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
      <NCard title="岗位信息列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
        <template #header-extra>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="hasAuth('system:post:add')"
            :show-delete="hasAuth('system:post:remove')"
            :show-export="hasAuth('system:post:export')"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @export="handleExport"
            @refresh="getData"
          />
        </template>
      </NCard>
    </div>
  </TableSiderLayout>
</template>
