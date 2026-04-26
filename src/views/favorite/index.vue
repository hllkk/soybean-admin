<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchGetFavoriteList, fetchRemoveFavorite } from '@/service/api/disk/favorite';
import { mapBackendFileList } from '@/service/api/disk/file';
import SimpleToolbar from '../disk/modules/simple-toolbar.vue';
import FileGrid from '../disk/modules/file-grid.vue';
import FileList from '../disk/modules/file-list.vue';
import FileEmpty from '../disk/modules/file-empty.vue';

defineOptions({
  name: 'FavoritePage'
});

const router = useRouter();
const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

// 搜索参数
const searchParams = ref<Api.Disk.FavoriteListParams>({
  pageNum: 1,
  pageSize: 50,
  sortField: null,
  sortOrder: null
});

// 收藏列表
const favoriteList = ref<Api.Disk.FileItem[]>([]);

// 本地选中状态（不污染 diskStore）
const selectedFiles = ref<CommonType.IdType[]>([]);

// 选中数量
const selectedCount = computed(() => selectedFiles.value.length);

// 是否显示空状态
const showEmpty = computed(() => favoriteList.value.length === 0 && !loading.value);

// 获取收藏列表
async function getData() {
  startLoading();
  const { data, error } = await fetchGetFavoriteList(searchParams.value);
  endLoading();

  if (!error && data) {
    // 后端返回 { list: [...], total: ... }，转换为前端格式
    const mapped = mapBackendFileList({ list: data.list, total: data.total });
    favoriteList.value = mapped.rows;
  } else {
    favoriteList.value = [];
  }
}

// 处理排序
function handleSort(field: string, order: 'asc' | 'desc') {
  searchParams.value.sortField = field as 'name' | 'size' | 'modifyTime' | 'type';
  searchParams.value.sortOrder = order;
  getData();
}

// 切换视图
function toggleView() {
  diskStore.setViewMode(diskStore.viewMode === 'grid' ? 'list' : 'grid');
}

// 取消选中
function handleClearSelection() {
  selectedFiles.value = [];
}

// 取消收藏
function handleRemoveFavorite() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  window.$dialog?.warning({
    title: $t('page.disk.favorite.remove'),
    content: selectedIds.length === 1
      ? '确定取消收藏此文件？'
      : `确定取消收藏 ${selectedIds.length} 个文件？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      const { error } = await fetchRemoveFavorite(selectedIds as number[]);
      endLoading();

      if (!error) {
        favoriteList.value = favoriteList.value.filter(item => !selectedIds.includes(item.fileId));
        selectedFiles.value = [];
        window.$message?.success('已取消收藏');
      } else {
        window.$message?.error('取消收藏失败');
      }
    }
  });
}

// 取消单个文件收藏（右键菜单）
function handleRemoveFavoriteFile(file: Api.Disk.FileItem) {
  selectedFiles.value = [file.fileId];
  handleRemoveFavorite();
}

// 下载功能提示
function handleDownloadTip() {
  window.$message?.info('下载功能开发中');
}

// 处理文件双击 - 跳转到文件位置
function handleFileDblClick(file: Api.Disk.FileItem) {
  const path = file.filePath;
  if (path && path !== '/') {
    router.push({ name: 'disk', query: { path } });
  } else {
    router.push({ name: 'disk' });
  }
}

// 处理选中状态变化
function handleSelectionChange(files: CommonType.IdType[]) {
  selectedFiles.value = files;
}

// 处理文件操作
function handleFileAction(action: string, file: Api.Disk.FileItem) {
  switch (action) {
    case 'removeFavorite':
      selectedFiles.value = [file.fileId];
      handleRemoveFavorite();
      break;
    case 'download':
      handleDownloadTip();
      break;
  }
}

// 初始化
getData();
</script>

<template>
  <div class="min-h-500px h-full flex-col-stretch gap-0 overflow-hidden lt-lg:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper h-full flex-1-hidden">
      <div class="h-full flex flex-col">
        <!-- 简化工具栏 -->
        <SimpleToolbar
          page-type="favorite"
          :selected-count="selectedCount"
          @sort="handleSort"
          @toggle-view="toggleView"
          @refresh="getData"
          @clear-selection="handleClearSelection"
          @remove-favorite="handleRemoveFavorite"
          @download="handleDownloadTip"
        />

        <!-- 内容区域 -->
        <div class="flex-1 overflow-hidden lt-sm:flex-initial lt-sm:overflow-auto">
          <!-- 空状态 -->
          <FileEmpty v-if="showEmpty" />

          <!-- 网格视图 -->
          <FileGrid
            v-if="!showEmpty && diskStore.viewMode === 'grid'"
            :files="favoriteList"
            :loading="loading"
            :selected-files="selectedFiles"
            page-type="favorite"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-download="handleFileAction('download', $event)"
            @file-delete="handleFileAction('removeFavorite', $event)"
            @file-favorite="handleRemoveFavoriteFile"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />

          <!-- 列表视图 -->
          <FileList
            v-if="!showEmpty && diskStore.viewMode === 'list'"
            :files="favoriteList"
            :loading="loading"
            :selected-files="selectedFiles"
            page-type="favorite"
            disable-create
            @file-dbl-click="handleFileDblClick"
            @file-download="handleFileAction('download', $event)"
            @file-delete="handleFileAction('removeFavorite', $event)"
            @file-favorite="handleRemoveFavoriteFile"
            @selection-change="handleSelectionChange"
            @refresh="getData"
          />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>