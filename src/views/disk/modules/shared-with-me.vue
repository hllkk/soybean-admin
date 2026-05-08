<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchGetSharedWithMeList, fetchRejectInternalShare } from '@/service/api/disk/internal-share';
import { formatFileSize } from '@/utils/format';
import FileIcon from './file-icon.vue';

defineOptions({ name: 'SharedWithMe' });

const { loading, startLoading, endLoading } = useLoading();
const list = ref<any[]>([]);
const total = ref(0);
const pagination = ref({ pageNum: 1, pageSize: 20 });

const permissionLabels: Record<string, string> = {
  DOWNLOAD: '下载', UPLOAD: '上传', PUT: '编辑', DELETE: '删除'
};

function formatPermissions(permissions: string[]) {
  return (permissions || []).map(p => permissionLabels[p] || p).join('、');
}

async function getList() {
  startLoading();
  const { data, error } = await fetchGetSharedWithMeList(pagination.value);
  if (!error && data) {
    list.value = data.rows || [];
    total.value = data.total;
  }
  endLoading();
}

async function handleReject(fileShareId: number) {
  const { error } = await fetchRejectInternalShare(fileShareId);
  if (!error) {
    window.$message?.success('已拒绝共享');
    getList();
  }
}

function handlePageChange(page: number) {
  pagination.value.pageNum = page;
  getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="shared-with-me">
    <NCard :bordered="false" size="small">
      <div class="text-16px font-600 mb-16px">共享给我</div>

      <NSpin :show="loading">
        <NEmpty v-if="list.length === 0 && !loading" description="暂无共享文件" />

        <div v-else class="flex flex-col gap-12px">
          <div
            v-for="item in list"
            :key="item.fileShareId"
            class="flex items-center gap-12px p-12px rd-8px bg-gray-50 dark:bg-gray-800"
          >
            <FileIcon
              :file-type="item.isFolder ? 'folder' : item.fileType"
              :extension="item.fileExtension"
              size="small"
            />
            <div class="flex-1 min-w-0">
              <div class="text-14px font-medium truncate">{{ item.fileName }}</div>
              <div class="text-12px opacity-60">
                {{ item.isFolder ? '文件夹' : formatFileSize(item.fileSize) }}
                <span class="ml-8px">来自 {{ item.shareUserName }}</span>
                <span class="ml-8px">{{ formatPermissions(item.permissions) }}</span>
                <span v-if="item.expireDate" class="ml-8px">
                  有效期至 {{ new Date(item.expireDate).toLocaleDateString() }}
                </span>
              </div>
            </div>
            <NButton size="small" type="error" quaternary @click="handleReject(item.fileShareId)">
              拒绝
            </NButton>
          </div>
        </div>
      </NSpin>

      <NPagination
        v-if="total > pagination.pageSize"
        :page="pagination.pageNum"
        :page-count="Math.ceil(total / pagination.pageSize)"
        :page-size="pagination.pageSize"
        class="mt-16px justify-end"
        @update:page="handlePageChange"
      />
    </NCard>
  </div>
</template>
