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
import TransferPanel from './modules/transfer-panel.vue';

defineOptions({
  name: 'DiskPage'
});

const diskStore = useDiskStore();
const { loading, startLoading, endLoading } = useLoading();

const fileList = ref<Api.Disk.FileItem[]>([]);
const transferPanelRef = ref<InstanceType<typeof TransferPanel>>();
const totalCount = ref(0);
const showCreateFolderModal = ref(false);
const newFolderName = ref('');

// 显示容量开关
const showCapacity = ref(true);

// 容量数据（后续可从 API 获取）
const capacityInfo = ref({
  used: 2.5, // GB
  total: 10 // GB
});

// 测试数据 - 用于无后端时测试前端效果
const mockFileList: Api.Disk.FileItem[] = [
  {
    fileId: '1',
    fileName: '项目文档',
    isFolder: true,
    fileType: 'folder',
    fileSize: 0,
    filePath: '/项目文档',
    parentId: null,
    createTime: '2024-01-15 10:30:00',
    createBy: 'admin',
    updateTime: '2024-01-15 10:30:00',
    updateBy: 'admin',
    modifyTime: '2024-01-15 10:30:00'
  },
  {
    fileId: '2',
    fileName: '设计素材',
    isFolder: true,
    fileType: 'folder',
    fileSize: 0,
    filePath: '/设计素材',
    parentId: null,
    createTime: '2024-01-14 09:20:00',
    createBy: 'admin',
    updateTime: '2024-01-14 09:20:00',
    updateBy: 'admin',
    modifyTime: '2024-01-14 09:20:00'
  },
  {
    fileId: '3',
    fileName: '产品需求文档.pdf',
    isFolder: false,
    fileType: 'document',
    fileExtension: 'pdf',
    fileSize: 2048576,
    filePath: '/产品需求文档.pdf',
    parentId: null,
    createTime: '2024-01-13 14:50:00',
    createBy: 'admin',
    updateTime: '2024-01-13 14:50:00',
    updateBy: 'admin',
    modifyTime: '2024-01-13 14:50:00'
  },
  {
    fileId: '4',
    fileName: '会议记录.docx',
    isFolder: false,
    fileType: 'document',
    fileExtension: 'docx',
    fileSize: 51200,
    filePath: '/会议记录.docx',
    parentId: null,
    createTime: '2024-01-12 11:30:00',
    createBy: 'admin',
    updateTime: '2024-01-12 11:30:00',
    updateBy: 'admin',
    modifyTime: '2024-01-12 11:30:00'
  },
  {
    fileId: '5',
    fileName: '系统架构图.png',
    isFolder: false,
    fileType: 'image',
    fileExtension: 'png',
    fileSize: 1536000,
    filePath: '/系统架构图.png',
    parentId: null,
    createTime: '2024-01-11 16:20:00',
    createBy: 'admin',
    updateTime: '2024-01-11 16:20:00',
    updateBy: 'admin',
    modifyTime: '2024-01-11 16:20:00'
  },
  {
    fileId: '6',
    fileName: '产品截图.jpg',
    isFolder: false,
    fileType: 'image',
    fileExtension: 'jpg',
    fileSize: 204800,
    filePath: '/产品截图.jpg',
    parentId: null,
    createTime: '2024-01-10 09:15:00',
    createBy: 'admin',
    updateTime: '2024-01-10 09:15:00',
    updateBy: 'admin',
    modifyTime: '2024-01-10 09:15:00'
  },
  {
    fileId: '7',
    fileName: '演示视频.mp4',
    isFolder: false,
    fileType: 'video',
    fileExtension: 'mp4',
    fileSize: 52428800,
    filePath: '/演示视频.mp4',
    parentId: null,
    createTime: '2024-01-09 13:40:00',
    createBy: 'admin',
    updateTime: '2024-01-09 13:40:00',
    updateBy: 'admin',
    modifyTime: '2024-01-09 13:40:00'
  },
  {
    fileId: '8',
    fileName: '宣传配乐.mp3',
    isFolder: false,
    fileType: 'audio',
    fileExtension: 'mp3',
    fileSize: 3145728,
    filePath: '/宣传配乐.mp3',
    parentId: null,
    createTime: '2024-01-08 08:00:00',
    createBy: 'admin',
    updateTime: '2024-01-08 08:00:00',
    updateBy: 'admin',
    modifyTime: '2024-01-08 08:00:00'
  },
  {
    fileId: '9',
    fileName: '数据分析.xlsx',
    isFolder: false,
    fileType: 'document',
    fileExtension: 'xlsx',
    fileSize: 102400,
    filePath: '/数据分析.xlsx',
    parentId: null,
    createTime: '2024-01-07 15:30:00',
    createBy: 'admin',
    updateTime: '2024-01-07 15:30:00',
    updateBy: 'admin',
    modifyTime: '2024-01-07 15:30:00'
  },
  {
    fileId: '10',
    fileName: '配置文件.json',
    isFolder: false,
    fileType: 'other',
    fileExtension: 'json',
    fileSize: 2048,
    filePath: '/配置文件.json',
    parentId: null,
    createTime: '2024-01-06 12:00:00',
    createBy: 'admin',
    updateTime: '2024-01-06 12:00:00',
    updateBy: 'admin',
    modifyTime: '2024-01-06 12:00:00'
  },
  {
    fileId: '11',
    fileName: '日志文件.log',
    isFolder: false,
    fileType: 'other',
    fileExtension: 'log',
    fileSize: 8192,
    filePath: '/日志文件.log',
    parentId: null,
    createTime: '2024-01-05 17:45:00',
    createBy: 'admin',
    updateTime: '2024-01-05 17:45:00',
    updateBy: 'admin',
    modifyTime: '2024-01-05 17:45:00'
  },
  {
    fileId: '12',
    fileName: '压缩包.zip',
    isFolder: false,
    fileType: 'other',
    fileExtension: 'zip',
    fileSize: 10485760,
    filePath: '/压缩包.zip',
    parentId: null,
    createTime: '2024-01-04 10:20:00',
    createBy: 'admin',
    updateTime: '2024-01-04 10:20:00',
    updateBy: 'admin',
    modifyTime: '2024-01-04 10:20:00'
  }
];

// 根据文件类型过滤测试数据
function getMockFilesByType(type: string): Api.Disk.FileItem[] {
  if (type === 'all') return mockFileList;
  return mockFileList.filter(file => file.fileType === type);
}

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

  if (!error && data && data.rows.length > 0) {
    // 后端有数据，使用后端数据
    fileList.value = data.rows;
    totalCount.value = data.total;
  } else {
    // 后端无数据或请求失败，使用测试数据
    const mockFiles = getMockFilesByType(diskStore.currentFileType);
    fileList.value = mockFiles;
    totalCount.value = mockFiles.length;
  }

  endLoading();
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

function handleFileAction(action: string, file: Api.Disk.FileItem) {
  // TODO: 实现各操作的具体逻辑
  window.$message?.info(`${action}: ${file.fileName}`);
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
            @create-folder="handleCreateFolder"
            @search="handleSearch"
            @refresh="handleRefresh"
            @show-transfer="transferPanelRef?.showDefault()"
          />
          <!-- Breadcrumb -->
          <Breadcrumb :total-count="totalCount" />
          <!-- File Content -->
          <div class="flex-1 overflow-hidden lt-sm:flex-initial lt-sm:overflow-auto">
            <FileGrid
              v-if="diskStore.viewMode === 'grid'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
              @file-share="handleFileAction('share', $event)"
              @file-download="handleFileAction('download', $event)"
              @file-delete="handleFileAction('delete', $event)"
              @file-rename="handleFileAction('rename', $event)"
              @file-copy="handleFileAction('copy', $event)"
              @file-move="handleFileAction('move', $event)"
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

    <!-- Transfer Panel -->
    <TransferPanel ref="transferPanelRef" />
  </TableSiderLayout>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 0 !important;
}
:deep(.n-divider) {
  margin: 0 !important;
}
</style>
