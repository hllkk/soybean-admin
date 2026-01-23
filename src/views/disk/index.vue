<script lang="tsx" setup>
import { computed, onMounted, ref, watch } from 'vue';
import type { MenuOption } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useDiskStore } from '@/store/modules/disk';
import { useSvgIcon } from '@/hooks/common/icon';
import DiskSider from './modules/disk-sider.vue';
import FileDiskplayGrid from './modules/disk-show-grid.vue';
import FileDisplayList from './modules/disk-show-list.vue';
import FileContextMenu from './modules/file-context-menu.vue';
import DiskShareModal from './modules/disk-share-modal.vue';
import FileEmpty from './modules/file-empty.vue';

const appStore = useAppStore();
const diskStore = useDiskStore();
const { SvgIconVNode } = useSvgIcon();

const showCapacity = ref(false);
const isBatchMode = ref(false);
const searchKeyword = ref<string>('');
const gap = computed(() => (appStore.isMobile ? 0 : 16));
// const isPc = computed(() => !appStore.isMobile);

const fileList = computed(() => diskStore.fileList);
const creatingItem = computed(() => diskStore.creatingItem);
const renamingItem = computed(() => diskStore.renamingItem);
const selectedCount = computed(() => diskStore.selectedFileIds.length);

const shareDialogVisible = ref<boolean>(false);

// const isPrivateLink = ref(false);
// const extractCodeType = ref<'random' | 'custom'>('random');
// const customExtractCode = ref('');
// const customUrlSuffix = ref('');

/** 切换显示容量 */
function handleChange(value: boolean) {
  showCapacity.value = value;
}

/** 切换上传组件显示 */
function handleTogglePanel() {
  if (diskStore.panelVisible) {
    diskStore.closePanel();
  } else {
    diskStore.openPanel();
  }
}

/** 选择的文件 */
const selectedFiles = computed(() => {
  return fileList.value.filter(file => diskStore.selectedFileIds.includes(file.id));
});

// 搜索文件
function handleSearch() {
  if (!searchKeyword.value) {
    window.$message?.destroyAll();
    window.$message?.error('请输入搜索关键词');
    return;
  }
  window.$message?.destroyAll();
  window.$message?.success(`搜索关键词：${searchKeyword.value}`);
}

/** 新建文件 */
function handleCreateFile() {
  diskStore.setCreatingItem({
    id: `creating-${Date.now()}`,
    name: '新建文件',
    isDir: false,
    size: 0,
    extendName: 'txt',
    updateTime: new Date().toISOString()
  });
}

/** 新建文件夹 */
function handleCreateFolder() {
  diskStore.setCreatingItem({
    id: `creating-${Date.now()}`,
    name: '新建文件夹',
    isDir: true,
    size: 0,
    extendName: '',
    updateTime: new Date().toISOString()
  });
}

/** 确认创建 */
function handleConfirmCreate(inputName: string) {
  if (!inputName.trim()) {
    window.$message?.destroyAll();
    window.$message?.error('名称不能为空');
    return;
  }

  const newItem = diskStore.confirmCreateItem(inputName.trim());
  if (newItem) {
    window.$message?.destroyAll();
    window.$message?.success(`已创建${newItem.isDir ? '文件夹' : '文件'}：${newItem.name}`);
  }
}

/** 取消创建 */
function handleCancelCreate() {
  diskStore.cancelCreateItem();
}

/** 重命名文件 */
function handleRename() {
  if (selectedFiles.value.length !== 1) {
    window.$message?.destroyAll();
    window.$message?.error('请选择一个文件进行重命名');
    return;
  }
  const file = selectedFiles.value[0];
  diskStore.setRenamingItem(file);
}

/** 确认重命名 */
function handleConfirmRename(newName: string) {
  if (!newName.trim()) {
    window.$message?.destroyAll();
    window.$message?.error('名称不能为空');
    return;
  }
  const renamedItem = diskStore.confirmRenameItem(newName.trim());
  if (renamedItem) {
    window.$message?.destroyAll();
    window.$message?.success(`已重命名为：${renamedItem.name}`);
  }
}

/** 取消重命名 */
function handleCancelRename() {
  diskStore.cancelRenameItem();
}

/** 切换批量操作模式 */
function handleToggleBatchMode() {
  isBatchMode.value = !isBatchMode.value;
  // 取消批量操作需要清空选中文件
  if (!isBatchMode.value) {
    diskStore.clearSelectedFiles();
  }
}

/** 处理文件上传 */
function handleFileUpload() {
  const fileBtn = document.getElementById('global-uploader-btn-file');
  if (fileBtn) {
    fileBtn.click();
  }
}

/** 处理文件夹上传 */
function handleFolderUpload() {
  const folderBtn = document.getElementById('global-uploader-btn-folder');
  if (folderBtn) {
    folderBtn.click();
  }
}

/** 处理文件夹打开 */
function handleOpenFolder(folder?: Api.Disk.FileItem) {
  if (folder) {
    diskStore.handleSelectFile(folder);
  } else {
    window.$message?.error('请选择要打开的文件夹');
  }
}

/** 处理文件下载 */
function handleDownload(file?: Api.Disk.FileItem) {
  if (file) {
    diskStore.handleDownloadFile(file);
  } else {
    window.$message?.error('请选择要下载的文件');
  }
}

// 自定义开关样式
// function railStyle({ focused, checked }: { focused: boolean; checked: boolean }) {
//   const style: CSSProperties = {};
//   if (checked) {
//     style.background = '#d03050';
//     if (focused) {
//       style.boxShadow = '0 0 0 2px #d0305040';
//     }
//   } else {
//     style.background = '#2080f0';
//     if (focused) {
//       style.boxShadow = '0 0 0 2px #2080f040';
//     }
//   }
//   return style;
// }
/** 处理文件共享 */
function handleShare() {
  if (diskStore.selectedFileIds.length === 0) {
    window.$message?.error('请选择要分享的文件');
    return;
  }
  shareDialogVisible.value = true;
}

/** 处理文件删除 */
function handleDelete(fileId?: string) {
  if (fileId) {
    window.$dialog?.warning({
      title: '删除',
      content: `确定删除所选的${selectedFiles.value.length}个文件吗？`,
      contentClass: 'bg-yellow-100 text-yellow-800 rounded-4 px-4 py-2',
      action: () => (
        <div class="w-full flex justify-between">
          <NButton type="error" round size="small">
            彻底删除
          </NButton>
          <div class="flex gap-8px">
            <NButton type="warning" round size="small">
              移至回收站
            </NButton>
            <NButton round size="small">
              取消
            </NButton>
          </div>
        </div>
      )
    });
  } else {
    window.$message?.error('请选择要删除的文件');
  }
}

type ContextMenuStateType = {
  show: boolean;
  x: number;
  y: number;
  contextType: 'file' | 'folder' | 'empty' | 'multiple';
  targetFile?: Api.Disk.FileItem;
};

/** 右键菜单状态 */
const contextMenuState = ref<ContextMenuStateType>({
  show: false,
  x: 0,
  y: 0,
  contextType: 'empty' as 'file' | 'folder' | 'empty' | 'multiple'
});

/** 处理右键菜单打开 */
function handleContextMenu(event: MouseEvent, file?: Api.Disk.FileItem) {
  event.preventDefault();
  event.stopPropagation();

  const { selectedFileIds } = diskStore;

  if (file) {
    if (selectedFileIds.length > 1) {
      contextMenuState.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        contextType: 'multiple'
      };
    } else {
      if (!isBatchMode.value) {
        diskStore.setSelectedFileIds([file.id]);
      }
      contextMenuState.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        contextType: file.isDir ? 'folder' : 'file',
        targetFile: file
      };
    }
  } else {
    contextMenuState.value = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      contextType: 'empty'
    };
  }
}

/** 处理右键菜单关闭 */
function handleContextMenuClose() {
  contextMenuState.value.show = false;
}

/** 处理右键菜单操作 */
function handleContextMenuAction(action: string) {
  switch (action) {
    case 'open':
      handleOpenFolder(contextMenuState.value.targetFile);
      break;
    case 'download':
      if (contextMenuState.value.contextType === 'multiple') {
        handleDownload();
      } else {
        handleDownload(contextMenuState.value.targetFile);
      }
      break;
    case 'share':
      handleShare();
      break;
    case 'delete':
      handleDelete(contextMenuState.value.targetFile?.id);
      break;
    case 'rename':
      handleRename();
      break;
    case 'copy':
      window.$message?.success('复制文件');
      break;
    case 'move':
      window.$message?.success('移动文件');
      break;
    case 'properties':
      window.$message?.success('查看属性');
      break;
    case 'upload-file':
      handleFileUpload();
      break;
    case 'upload-folder':
      handleFolderUpload();
      break;
    case 'create-file':
      handleCreateFile();
      break;
    case 'create-folder':
      handleCreateFolder();
      break;
    case 'paste':
      window.$message?.success('粘贴文件');
      break;
    case 'refresh':
      window.$message?.success('刷新文件列表');
      break;
    case 'cut':
      window.$message?.success('剪切文件');
      break;
    default:
      window.$message?.info(`操作: ${action}`);
  }
}

function handleUpdateMenuValue(key: SimpleUploader.Uploader.FileListQueryType) {
  diskStore.setQueryType(key);
  diskStore.getFileList();
}

const menuOptions: MenuOption[] = [
  {
    label: '文件类型',
    key: 'file-type',
    icon: SvgIconVNode({ localIcon: 'disk-cloud_file', fontSize: 24 }),
    children: [
      {
        label: '全部',
        key: 'all',
        icon: SvgIconVNode({ localIcon: 'disk-menu_file', fontSize: 24 })
      },
      {
        label: '图片',
        key: 'image',
        icon: SvgIconVNode({ localIcon: 'disk-file_image', fontSize: 24 })
      },
      {
        label: '文档',
        key: 'document',
        icon: SvgIconVNode({ localIcon: 'disk-file_txt', fontSize: 24 })
      },
      {
        label: '视频',
        key: 'video',
        icon: SvgIconVNode({ localIcon: 'disk-file_video', fontSize: 24 })
      },
      {
        label: '音频',
        key: 'audio',
        icon: SvgIconVNode({ localIcon: 'disk-file_music', fontSize: 24 })
      },
      {
        label: '其他',
        key: 'other',
        icon: SvgIconVNode({ localIcon: 'disk-file_other', fontSize: 24 })
      }
    ]
  }
];

const uploadOptions = [
  {
    key: 'file',
    label: '上传文件',
    icon: SvgIconVNode({ localIcon: 'disk-upload_file', fontSize: 25 }),
    props: {
      onClick: () => {
        handleFileUpload();
      }
    }
  },
  {
    key: 'folder',
    label: '上传文件夹',
    icon: SvgIconVNode({ localIcon: 'disk-upload_folder', fontSize: 20 }),
    props: {
      onClick: () => {
        handleFolderUpload();
      }
    }
  }
];

const createOptions = [
  {
    key: 'file',
    label: '新建文件',
    icon: SvgIconVNode({ localIcon: 'disk-create_file', fontSize: 20 }),
    props: {
      onClick: () => {
        handleCreateFile();
      }
    }
  },
  {
    key: 'folder',
    label: '新建文件夹',
    icon: SvgIconVNode({ localIcon: 'disk-create_folder', fontSize: 20 }),
    props: {
      onClick: () => {
        handleCreateFolder();
      }
    }
  }
];

watch(selectedCount, count => {
  let prevSelectedCount = 0;
  if (count > 1) {
    isBatchMode.value = true;
  } else if (prevSelectedCount > 1 && count <= 1) {
    isBatchMode.value = false;
  }
  prevSelectedCount = count;
});

onMounted(() => {
  diskStore.getFileList();
});
</script>

<template>
  <DiskSider sider-title="文件管理">
    <template #header-extra>
      <NTooltip trigger="hover">
        <template #trigger>
          <NSwitch v-model:value="showCapacity" :round="false" @update:value="handleChange"></NSwitch>
        </template>
        显示容量
      </NTooltip>
    </template>
    <template #sider>
      <div class="h-full flex flex-col select-none">
        <NMenu
          :options="menuOptions"
          :default-expanded-keys="['file-type']"
          accordion
          class="select-none"
          @update:value="handleUpdateMenuValue"
        />
        <div v-if="showCapacity" class="mt-auto flex flex-col items-center py-4">
          <NProgress class="custom-progress" indicator-placement="inside" :percentage="20" :height="14" />
          <div class="mt-1 text-sm font-size-10px">9845G/16T</div>
        </div>
      </div>
    </template>
    <div class="h-full flex-col-stretch gap-12px">
      <NCard
        :bordered="false"
        size="small"
        class="h-full card-wrapper"
        content-style="display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden;"
      >
        <!-- 固定的顶部操作栏 -->
        <div class="z-50 shrink-0 rounded-t-10px bg-white px-12px pt-12px dark:bg-[#18181c]">
          <NGrid :x-gap="gap" responsive="screen" item-responsive>
            <NGridItem span="24 s:24 m:24 l:24 xl:24">
              <NFlex justify="space-between" class="mt-10px min-h-40px">
                <div v-show="selectedCount === 0" class="flex flex-center gap-8px">
                  <NDropdown trigger="hover" :options="uploadOptions">
                    <NButton type="primary" round>
                      <template #icon>
                        <icon-ic-outline-file-upload />
                      </template>
                      上传
                    </NButton>
                  </NDropdown>
                  <NDropdown trigger="hover" :options="createOptions">
                    <NButton type="primary" round>
                      <template #icon>
                        <icon-material-symbols-add-circle-outline />
                      </template>
                      新建
                    </NButton>
                  </NDropdown>
                  <NInputGroup>
                    <NInput v-model:value="searchKeyword" placeholder="搜索我的文件"></NInput>
                    <NButton type="primary" @click="handleSearch">
                      <template #icon>
                        <icon-uil-search />
                      </template>
                      搜索
                    </NButton>
                  </NInputGroup>
                </div>
                <div v-show="selectedCount > 0" class="flex gap-8px">
                  <NButtonGroup class="operation-button-group">
                    <NButton round class="operation-button" @click="handleShare()">
                      <template #icon>
                        <icon-ic-outline-share />
                      </template>
                      分享
                    </NButton>
                    <NButton class="operation-button" @click="handleDownload()">
                      <template #icon>
                        <icon-ic-outline-file-download />
                      </template>
                      下载
                    </NButton>
                    <NButton class="operation-button" @click="handleDelete()">
                      <template #icon>
                        <icon-material-symbols-delete-outline />
                      </template>
                      删除
                    </NButton>
                    <NButton v-if="selectedCount === 1" class="operation-button" @click="handleRename">
                      <template #icon>
                        <icon-fluent-rename-16-regular />
                      </template>
                      重命名
                    </NButton>
                    <NButton round class="operation-button">更多</NButton>
                  </NButtonGroup>
                </div>
                <div class="flex gap-8px">
                  <NButton v-show="isBatchMode" type="error" :disabled="selectedCount === 0">
                    <template #icon>
                      <icon-material-symbols-delete-outline />
                    </template>
                  </NButton>
                  <NButton type="primary" @click="handleToggleBatchMode">
                    <template #icon>
                      <icon-fluent-multiselect-20-filled />
                    </template>
                    <template #default>{{ isBatchMode ? '取消批量' : '批量操作' }}</template>
                  </NButton>
                  <NButtonGroup>
                    <NTooltip placement="bottom" trigger="hover">
                      <template #trigger>
                        <NButton @click="handleTogglePanel">
                          <template #icon>
                            <icon-cuida-swap-vertical-arrows-outline />
                          </template>
                        </NButton>
                      </template>
                      <span>传输列表</span>
                    </NTooltip>
                    <NTooltip placement="bottom" trigger="hover">
                      <template #trigger>
                        <NButton>
                          <template #icon>
                            <icon-tabler-filter />
                          </template>
                        </NButton>
                      </template>
                      <span>排序</span>
                    </NTooltip>
                    <NTooltip placement="bottom" trigger="hover">
                      <template #trigger>
                        <NButton @click="diskStore.toggleFileShowMode">
                          <template #icon>
                            <icon-material-symbols-apps v-if="diskStore.fileShowMode === 'grid'" />
                            <icon-mdi-format-list-bulleted v-else />
                          </template>
                        </NButton>
                      </template>
                      <span>视图</span>
                    </NTooltip>
                  </NButtonGroup>
                </div>
              </NFlex>
            </NGridItem>
          </NGrid>
          <div class="mt-12px flex justify-between font-size-10px font-bold">
            <span>全部文件</span>
            <span v-if="selectedCount > 0" class="text-primary">
              已选中 {{ selectedCount }} 个{{ selectedCount === 1 ? '文件/文件夹' : '文件/文件夹' }}
            </span>
          </div>
        </div>
        <!-- 可滚动的内容区域 -->
        <div class="custom-scrollbar h-full flex-1 overflow-y-auto p-12px" @contextmenu.prevent="handleContextMenu">
          <FileDiskplayGrid
            v-if="diskStore.fileShowMode === 'grid' && fileList.length > 0"
            :is-batch-mode="isBatchMode"
            :data="fileList"
            :creating-item="creatingItem"
            :renaming-item="renamingItem"
            @confirm-create="handleConfirmCreate"
            @cancel-create="handleCancelCreate"
            @confirm-rename="handleConfirmRename"
            @cancel-rename="handleCancelRename"
            @context-menu="handleContextMenu"
          />
          <FileDisplayList
            v-else-if="diskStore.fileShowMode === 'list' && fileList.length > 0"
            :is-batch-mode="isBatchMode"
            :data="fileList"
            :creating-item="creatingItem"
            :renaming-item="renamingItem"
            @confirm-create="handleConfirmCreate"
            @cancel-create="handleCancelCreate"
            @confirm-rename="handleConfirmRename"
            @cancel-rename="handleCancelRename"
            @context-menu="handleContextMenu"
          />
          <FileEmpty v-else />
        </div>
        <!-- 右键菜单组件 -->
        <FileContextMenu
          :show="contextMenuState.show"
          :x="contextMenuState.x"
          :y="contextMenuState.y"
          :context-type="contextMenuState.contextType"
          :target-file="contextMenuState.targetFile"
          :selected-files="selectedFiles"
          @close="handleContextMenuClose"
          @action="handleContextMenuAction"
        />
        <!--分享模态框-->
        <DiskShareModal
          v-model:visible="shareDialogVisible"
          :file-name="selectedFiles[0]?.name || ''"
          :file-ids="diskStore.selectedFileIds"
        />
      </NCard>
    </div>
  </DiskSider>
</template>

<style scoped lang="scss">
.custom-progress {
  width: 80%; /* 设置进度条宽度 */
  max-width: 200px; /* 限制最大宽度 */
  margin: 0 auto; /* 水平居中 */
  display: block; /* 确保是块级元素 */
}
.custom-scrollbar {
  scrollbar-width: thin;
}

.operation-button-group {
  background-color: #e5e7eb;
  border-radius: 9999px;
  padding: 3px;
  transition: background-color 0.3s ease;
}

.dark .operation-button-group {
  background-color: rgba(255, 255, 255, 0.12);
}

.operation-button {
  background-color: transparent;
  border: none;
  color: #374151;
  transition: all 0.3s ease;
}

.dark .operation-button {
  color: rgba(255, 255, 255, 0.85);
}

.operation-button:hover {
  background-color: #dbeafe;
  color: #2563eb;
}

.dark .operation-button:hover {
  background-color: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
}
</style>
