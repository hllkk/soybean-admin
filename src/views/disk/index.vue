<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import { fetchGetFileList, fetchCreateFolder } from '@/service/api/disk';
import FileTypeMenu from './modules/file-type-menu.vue';
import Toolbar from './modules/toolbar.vue';
import Breadcrumb from './modules/breadcrumb.vue';
import FileGrid from './modules/file-grid.vue';
import FileList from './modules/file-list.vue';

defineOptions({
  name: 'DiskPage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

const fileList = ref<Api.Disk.FileItem[]>([]);
const totalCount = ref(0);
const showCreateFolderModal = ref(false);
const newFolderName = ref('');
const uploadFileRef = ref<HTMLInputElement>();
const uploadFolderRef = ref<HTMLInputElement>();

// 显示容量开关
const showCapacity = ref(true);

// 容量数据（后续可从 API 获取）
const capacityInfo = ref({
  used: 2.5, // GB
  total: 10 // GB
});

const searchParams = ref<Api.Disk.FileSearchParams>({
  pageNum: 1,
  pageSize: 100,
  fileType: null,
  keyword: null,
  parentId: null,
  sortField: null,
  sortOrder: null
});

async function getFileList() {
  startLoading();

  searchParams.value.fileType = diskStore.currentFileType === 'all' ? null : diskStore.currentFileType;
  searchParams.value.parentId = diskStore.currentParentId;
  searchParams.value.sortField = diskStore.sortSettings.field;
  searchParams.value.sortOrder = diskStore.sortSettings.order;

  const { data, error } = await fetchGetFileList(searchParams.value);

  if (!error && data) {
    fileList.value = data.rows;
    totalCount.value = data.total;
  }

  endLoading();
}

function handleUploadFile() {
  uploadFileRef.value?.click();
}

function handleUploadFolder() {
  uploadFolderRef.value?.click();
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  // TODO: Upload logic

  target.value = '';
}

async function handleFolderUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  // TODO: Folder upload logic

  target.value = '';
}

function handleCreateFolder() {
  showCreateFolderModal.value = true;
}

async function submitCreateFolder() {
  if (!newFolderName.value.trim()) {
    window.$message?.warning($t('page.disk.form.folderName.required'));
    return;
  }

  const { error } = await fetchCreateFolder({
    folderName: newFolderName.value.trim(),
    parentId: diskStore.currentParentId
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
    showCreateFolderModal.value = false;
    newFolderName.value = '';
    getFileList();
  }
}

function handleSearch() {
  getFileList();
}

function handleRefresh() {
  getFileList();
}

function handleFileDblClick(file: Api.Disk.FileItem) {
  if (!file.isFolder) {
    // TODO: File preview/download
    window.$message?.info(`Open file: ${file.fileName}`);
  }
}

// Watch file type changes
watch(() => diskStore.currentFileType, () => {
  getFileList();
});

// Watch path changes
watch(() => diskStore.currentParentId, () => {
  getFileList();
});

// Watch sort changes
watch(() => diskStore.sortSettings, () => {
  getFileList();
}, { deep: true });

onMounted(() => {
  getFileList();
});
</script>

<template>
  <TableSiderLayout sider-title="文件管理">
    <template #header-extra>
      <NTooltip trigger="hover">
        <template #trigger>
          <NSwitch v-model:value="showCapacity" :round="false" />
        </template>
        显示容量
      </NTooltip>
    </template>
    <template #sider>
      <NDivider dashed />
      <FileTypeMenu
        :show-capacity="showCapacity"
        :used-capacity="capacityInfo.used"
        :total-capacity="capacityInfo.total"
      />
    </template>

    <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
      <!-- File Display Area -->
      <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
        <div class="h-full flex flex-col">
          <!-- Toolbar -->
          <Toolbar
            @upload-file="handleUploadFile"
            @upload-folder="handleUploadFolder"
            @create-folder="handleCreateFolder"
            @search="handleSearch"
            @refresh="handleRefresh"
          />
          <!-- Breadcrumb -->
          <Breadcrumb :total-count="totalCount" />
          <!-- File Content -->
          <div class="flex-1 overflow-hidden">
            <FileGrid
              v-if="diskStore.viewMode === 'grid'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
            />
            <FileList
              v-if="diskStore.viewMode === 'list'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
            />
          </div>
        </div>
      </NCard>
    </div>

    <!-- Hidden file upload input -->
    <input
      ref="uploadFileRef"
      type="file"
      multiple
      style="display: none"
      @change="handleFileUpload"
    />

    <!-- Hidden folder upload input -->
    <input
      ref="uploadFolderRef"
      type="file"
      webkitdirectory
      directory
      style="display: none"
      @change="handleFolderUpload"
    />

    <!-- Create Folder Modal -->
    <NModal
      v-model:show="showCreateFolderModal"
      preset="card"
      :title="$t('page.disk.createFolder')"
      style="width: 300px"
      :bordered="false"
    >
      <NForm>
        <NFormItem :label="$t('page.disk.file.name')">
          <NInput v-model:value="newFolderName" :placeholder="$t('page.disk.form.folderName.required')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateFolderModal = false">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton type="primary" @click="submitCreateFolder">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </TableSiderLayout>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
}
:deep(.n-divider) {
  margin: 0 !important;
}
/* 强制 NLayoutContent 高度传递 */
:deep(.n-layout-content) {
  height: 100%;
}
:deep(.n-layout) {
  height: 100%;
}
</style>
