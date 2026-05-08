<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchGetMySharedList, fetchCancelInternalShare } from '@/service/api/disk/internal-share';
import { formatFileSize } from '@/utils/format';
import FileIcon from './file-icon.vue';

defineOptions({ name: 'MyShared' });

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

function formatTargets(targets: any[]) {
  if (!targets || targets.length === 0) return '-';
  return targets.map(t => t.targetName).join('、');
}

async function getList() {
  startLoading();
  const { data, error } = await fetchGetMySharedList(pagination.value);
  if (!error && data) {
    list.value = data.rows || [];
    total.value = data.total;
  }
  endLoading();
}

async function handleCancel(id: number) {
  const { error } = await fetchCancelInternalShare(id);
  if (!error) {
    window.$message?.success('已取消共享');
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
  <div class="my-shared">
    <NCard :bordered="false" size="small">
      <div class="text-16px font-600 mb-16px">我的共享</div>

      <NSpin :show="loading">
        <NEmpty v-if="list.length === 0 && !loading" description="暂无共享记录" />

        <div v-else class="flex flex-col gap-12px">
          <div
            v-for="item in list"
            :key="item.id"
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
                <NTag size="small" :type="item.shareType === 'user' ? 'info' : 'success'">
                  {{ item.shareType === 'user' ? '用户' : '部门' }}
                </NTag>
                <span class="ml-8px">{{ formatTargets(item.targets) }}</span>
                <span class="ml-8px">{{ formatPermissions(item.permissions) }}</span>
                <span class="ml-8px">
                  <NTag size="small" :type="item.status === 'active' ? 'success' : 'default'">
                    {{ item.status === 'active' ? '生效中' : item.status === 'cancelled' ? '已取消' : item.status }}
                  </NTag>
                </span>
              </div>
            </div>
            <NButton
              v-if="item.status === 'active'"
              size="small"
              type="error"
              quaternary
              @click="handleCancel(item.id)"
            >
              取消共享
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
