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

const searchParams = ref<Api.Disk.FavoriteListParams>({
  pageNum: 1,
  pageSize: 50,
  sortField: null,
  sortOrder: null
});

const favoriteList = ref<Api.Disk.FileItem[]>([]);
const selectedFiles = ref<CommonType.IdType[]>([]);

const selectedCount = computed(() => selectedFiles.value.length);
const showEmpty = computed(() => favoriteList.value.length === 0 && !loading.value);

async function getData() {
  startLoading();
  const { data, error } = await fetchGetFavoriteList(searchParams.value);
  endLoading();

  if (!error && data) {
    const mapped = mapBackendFileList({ list: data.list, total: data.total });
    favoriteList.value = mapped.rows;
  } else {
    favoriteList.value = [];
  }
}

function handleSort(field: string, order: 'asc' | 'desc') {
  searchParams.value.sortField = field as 'name' | 'size' | 'modifyTime' | 'type';
  searchParams.value.sortOrder = order;
  getData();
}

function toggleView() {
  diskStore.setViewMode(diskStore.viewMode === 'grid' ? 'list' : 'grid');
}

function handleClearSelection() {
  selectedFiles.value = [];
}

function handleRemoveFavorite() {
  const selectedIds = selectedFiles.value;
  if (selectedIds.length === 0) return;

  const contentText = selectedIds.length === 1
    ? $t('page.disk.favorite.removeConfirmSingle')
    : $t('page.disk.favorite.removeConfirmMultiple', { count: selectedIds.length });

  window.$dialog?.warning({
    title: $t('page.disk.favorite.remove'),
    content: contentText,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      startLoading();
      const { error } = await fetchRemoveFavorite(selectedIds as number[]);
      endLoading();

      if (!error) {
        favoriteList.value = favoriteList.value.filter(item => !selectedIds.includes(item.fileId));
        selectedFiles.value = [];
        diskStore.removeFavoriteIds(selectedIds as number[]);
        window.$message?.success($t('page.disk.favorite.removeSuccess'));
      } else {
        window.$message?.error($t('page.disk.favorite.removeFailed'));
      }
    }
  });
}

function handleRemoveFavoriteFile(file: Api.Disk.FileItem) {
  selectedFiles.value = [file.fileId];
  handleRemoveFavorite();
}

function handleDownloadTip() {
  window.$message?.info($t('page.disk.favorite.downloadNotReady'));
}

function handleFileDblClick(file: Api.Disk.FileItem) {
  const path = file.filePath;
  if (path && path !== '/') {
    router.push({ name: 'disk', query: { path } });
  } else {
    router.push({ name: 'disk' });
  }
}

function handleSelectionChange(files: CommonType.IdType[]) {
  selectedFiles.value = files;
}

function handleFileAction(action: string, file: Api.Disk.FileItem) {
  if (action === 'removeFavorite') {
    selectedFiles.value = [file.fileId];
    handleRemoveFavorite();
  } else if (action === 'download') {
    handleDownloadTip();
  }
}

getData();
</script>

<template>
  <div class="min-h-500px h-full flex-col-stretch gap-0 overflow-hidden lt-lg:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper h-full flex-1-hidden" :content-style="{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }">
      <div class="h-full flex flex-col">
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

        <div class="flex-1 overflow-hidden lt-sm:flex-initial lt-sm:overflow-auto">
          <FileEmpty v-if="showEmpty" />

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
