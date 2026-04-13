<script setup lang="tsx">
import { ref, onMounted } from 'vue';
import { NTag, NButton, NModal } from 'naive-ui';
import { fetchGetMyNoticeList, fetchGetMyNoticeDetail } from '@/service/api/system/notice';
import { useAppStore } from '@/store/modules/app';
import { useNoticeStore } from '@/store/modules/notice';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import DictTag from '@/components/custom/dict-tag.vue';

defineOptions({
  name: 'NoticeUserPage'
});

useDict('sys_notice_type');
const appStore = useAppStore();
const noticeStore = useNoticeStore();

const searchParams = ref<Api.System.MyNoticeSearchParams>({
  pageNum: 1,
  pageSize: 10,
  noticeTitle: null,
  noticeType: null,
  readStatus: null
});

// 公告详情弹窗
const detailVisible = ref(false);
const currentNotice = ref<Api.System.MyNoticeDetail | null>(null);

const { columns, columnChecks, data, getData, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetMyNoticeList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'noticeTitle',
        title: '公告标题',
        align: 'left',
        minWidth: 200,
        render(row) {
          const topTag = row.topFlag === '1' ? (
            <NTag type="warning" size="small" class="mr-8px">置顶</NTag>
          ) : null;
          return (
            <div class="flex items-center">
              {topTag}
              <span>{row.noticeTitle}</span>
            </div>
          );
        }
      },
      {
        key: 'noticeType',
        title: '公告类型',
        align: 'center',
        minWidth: 100,
        render(row) {
          return <DictTag size="small" value={row.noticeType} dictCode="sys_notice_type" />;
        }
      },
      {
        key: 'createTime',
        title: '发布时间',
        align: 'center',
        minWidth: 150
      },
      {
        key: 'read',
        title: '阅读状态',
        align: 'center',
        minWidth: 100,
        render(row) {
          if (row.read) {
            return <NTag type="success" size="small">已读</NTag>;
          }
          return <NTag type="error" size="small">未读</NTag>;
        }
      },
      {
        key: 'readCount',
        title: '阅读次数',
        align: 'center',
        minWidth: 100
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 100,
        render(row) {
          return (
            <NButton type="primary" size="small" onClick={() => viewDetail(row.noticeId)}>
              查看
            </NButton>
          );
        }
      }
    ]
  });

// 查看公告详情
async function viewDetail(noticeId: CommonType.IdType) {
  const { error, data: detailData } = await fetchGetMyNoticeDetail(noticeId);
  if (!error) {
    currentNotice.value = detailData;
    detailVisible.value = true;
    // 更新未读数量
    noticeStore.fetchUnreadCount();
  }
}

// 关闭详情弹窗
function closeDetail() {
  detailVisible.value = false;
  currentNotice.value = null;
}

// 重置搜索
function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    noticeTitle: null,
    noticeType: null,
    readStatus: null
  };
  getData();
}

onMounted(() => {
  getData();
  noticeStore.fetchUnreadCount();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 搜索区域 -->
    <NCard :bordered="false" size="small">
      <div class="flex flex-wrap gap-16px">
        <NInput
          v-model:value="searchParams.noticeTitle"
          placeholder="请输入公告标题"
          clearable
          class="w-200px"
          @keyup.enter="() => getData()"
        />
        <DictSelect
          v-model:value="searchParams.noticeType"
          dict-code="sys_notice_type"
          placeholder="公告类型"
          clearable
          class="w-150px"
        />
        <NSelect
          v-model:value="searchParams.readStatus"
          placeholder="阅读状态"
          clearable
          class="w-150px"
          :options="[
            { label: '未读', value: '0' },
            { label: '已读', value: '1' }
          ]"
        />
        <NButton type="primary" @click="() => getData()">
          <template #icon>
            <icon-ic-round-search class="text-icon" />
          </template>
          搜索
        </NButton>
        <NButton @click="handleReset">
          <template #icon>
            <icon-ic-round-refresh class="text-icon" />
          </template>
          重置
        </NButton>
      </div>
    </NCard>

    <!-- 公告列表 -->
    <NCard title="公告列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="false"
          :show-delete="false"
          :show-export="false"
          @refresh="getData"
        />
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="row => row.noticeId"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>

    <!-- 公告详情弹窗 -->
    <NModal
      v-model:show="detailVisible"
      preset="card"
      :title="currentNotice?.noticeTitle"
      class="w-800px max-w-90%"
      :mask-closable="true"
      @close="closeDetail"
    >
      <div class="flex flex-col gap-16px">
        <div class="flex gap-16px">
          <div>
            <span class="text-gray">公告类型：</span>
            <DictTag :value="currentNotice?.noticeType" dict-code="sys_notice_type" size="small" />
          </div>
          <div>
            <span class="text-gray">发布时间：</span>
            <span>{{ currentNotice?.createTime }}</span>
          </div>
          <div>
            <span class="text-gray">发布者：</span>
            <span>{{ currentNotice?.createByName }}</span>
          </div>
          <div>
            <span class="text-gray">阅读次数：</span>
            <span>{{ currentNotice?.readCount }}</span>
          </div>
        </div>
        <NDivider />
        <div class="notice-content">{{ currentNotice?.noticeContent }}</div>
      </div>
      <template #footer>
        <NButton @click="closeDetail">关闭</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.notice-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid #e0e0e6;
  border-radius: 8px;
}
</style>
