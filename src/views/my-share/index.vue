<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { fetchGetMyShareList, fetchCancelShare } from '@/service/api/disk/share';
import { handleCopy } from '@/utils/copy';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import ButtonIcon from '@/components/custom/button-icon.vue';

defineOptions({
  name: 'MySharePage'
});

const { loading, startLoading, endLoading } = useLoading();

// 使用较大的pageSize，支持滚动模式
const searchParams = ref<Api.Disk.MyShareListParams>({
  pageNum: 1,
  pageSize: 50,
  sortField: null,
  sortOrder: null
});

// 获取文件图标
function getFileIcon(row: Api.Disk.MyShareItem): string {
  if (row.isFolder) return 'mdi:folder';
  const contentType = row.contentType?.toLowerCase() || '';
  if (contentType.includes('image')) return 'mdi:image';
  if (contentType.includes('video')) return 'mdi:videocam';
  if (contentType.includes('audio')) return 'mdi:audiotrack';
  if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) return 'mdi:file-document';
  return 'mdi:file';
}

// 格式化日期
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return $t('page.disk.myShare.forever');
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 判断是否过期
function isExpired(row: Api.Disk.MyShareItem): boolean {
  if (!row.expireDate) return false;
  return new Date(row.expireDate) < new Date();
}

// 分享链接
function getShareLink(row: Api.Disk.MyShareItem): string {
  return `${window.location.origin}/s/${row.shortId}`;
}

// 复制链接
function handleCopyLink(row: Api.Disk.MyShareItem) {
  handleCopy(getShareLink(row));
}


// 配置隐藏分页选择器（滚动模式）
const paginationProps = {
  showSizePicker: false,
  showQuickJumper: false,
  prefix: () => null
};

const { columns, data, getData, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetMyShareList(searchParams.value),
    transform: response => defaultTransform(response),
    paginationProps,
    showTotal: false,
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 50;
    },
    columns: () => [
      {
        key: 'fileName',
        title: $t('page.disk.myShare.fileName'),
        align: 'left',
        width: 200,
        ellipsis: true,
        sorter: true,
        render: row => {
          return (
            <div class="flex items-center gap-8px">
              <SvgIcon icon={getFileIcon(row)} class="text-24px text-amber-500" />
              <span class="truncate">{row.fileName}</span>
            </div>
          );
        }
      },
      {
        key: 'shareLink',
        title: $t('page.disk.myShare.shareLink'),
        align: 'left',
        width: 180,
        render: row => {
          return (
            <div class="flex items-center gap-8px">
              <span class="text-12px opacity-60 truncate max-w-120px">{`/s/${row.shortId}`}</span>
              <ButtonIcon
                text
                icon="mdi:content-copy"
                tooltipContent={$t('page.disk.myShare.copyLink')}
                onClick={() => handleCopyLink(row)}
              />
            </div>
          );
        }
      },
      {
        key: 'createDate',
        title: $t('page.disk.myShare.createTime'),
        align: 'center',
        width: 140,
        sorter: true,
        render: row => formatDate(row.createDate)
      },
      {
        key: 'isPrivate',
        title: $t('page.disk.myShare.shareType'),
        align: 'center',
        width: 80,
        render: row => {
          return row.isPrivate
            ? <NTag type="warning" size="small">{ $t('page.disk.myShare.private') }</NTag>
            : <NTag type="success" size="small">{ $t('page.disk.myShare.public') }</NTag>;
        }
      },
      {
        key: 'expireDate',
        title: $t('page.disk.myShare.expireTime'),
        align: 'center',
        width: 120,
        render: row => {
          const expired = isExpired(row);
          const text = formatDate(row.expireDate);
          return expired
            ? <span class="text-error">{text}</span>
            : <span>{text}</span>;
        }
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
              type="error"
              icon="mdi:delete-outline"
              tooltipContent={$t('page.disk.myShare.cancelShare')}
              onClick={() => handleCancelShare(row)}
            />
          );
        }
      }
    ]
  });

// 取消分享确认
async function handleCancelShare(row: Api.Disk.MyShareItem) {
  window.$dialog?.warning({
    title: $t('page.disk.myShare.cancelShare'),
    content: $t('page.disk.myShare.cancelConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      const { error } = await fetchCancelShare(row.shareId);
      endLoading();

      if (!error) {
        window.$message?.success($t('page.disk.myShare.cancelSuccess'));
        getData();
      }
    }
  });
}


// 处理排序变化
function handleSorterChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (sorter.order === false) {
    searchParams.value.sortField = null;
    searchParams.value.sortOrder = null;
  } else {
    searchParams.value.sortField = sorter.columnKey as 'fileName' | 'createDate';
    searchParams.value.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
  }
  getData();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-lg:overflow-auto">
    <!-- 顶部标题 -->
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-12px">
          <SvgIcon icon="mdi:share-variant" :size="24" class="text-primary" />
          <span class="text-16px font-medium">{{ $t('page.disk.myShare.title') }}</span>
        </div>
        <div class="flex items-center gap-8px">
          <NButton quaternary size="small" @click="getData">
            <template #icon>
              <SvgIcon icon="mdi:refresh" :size="18" />
            </template>
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- 表格区域 -->
    <NCard :bordered="false" size="small" class="card-wrapper flex-1 overflow-hidden">
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="false"
        :scroll-x="scrollX"
        :row-key="(row) => row.shareId"
        flex-height
        remote
        @update:sorter="handleSorterChange"
      />
    </NCard>
  </div>
</template>

<style scoped>
.text-24px {
  font-size: 24px;
}
</style>
