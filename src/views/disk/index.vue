<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'DiskView'
});

// 搜索关键词
const searchKeyword = ref('');

// 存储空间信息
const storageInfo = {
  used: '45.8 GB',
  total: '2 TB',
  percent: 2.3
};

// 文件列表数据
const fileList = [
  { id: 1, name: '工作文档', type: 'folder', size: '-', modified: '2026-03-20 10:30', isFolder: true },
  { id: 2, name: '项目资料', type: 'folder', size: '-', modified: '2026-03-19 15:20', isFolder: true },
  { id: 3, name: '会议录像.mp4', type: 'video', size: '156 MB', modified: '2026-03-19 09:15', isFolder: false },
  { id: 4, name: '产品截图', type: 'folder', size: '-', modified: '2026-03-18 14:30', isFolder: true },
  { id: 5, name: '设计方案.docx', type: 'document', size: '2.5 MB', modified: '2026-03-18 11:00', isFolder: false },
  { id: 6, name: '数据报表.xlsx', type: 'document', size: '890 KB', modified: '2026-03-17 16:45', isFolder: false },
  { id: 7, name: '背景音乐.mp3', type: 'music', size: '5.2 MB', modified: '2026-03-17 10:20', isFolder: false },
  { id: 8, name: '旅游照片.jpg', type: 'image', size: '3.8 MB', modified: '2026-03-16 18:30', isFolder: false }
];

// 选中的文件
const selectedFiles = ref<number[]>([]);

// 获取文件图标
function getFileIcon(file: typeof fileList[0]) {
  const iconMap: Record<string, string> = {
    folder: 'mdi:folder',
    video: 'mdi:video',
    image: 'mdi:image',
    document: 'mdi:file-document',
    music: 'mdi:music'
  };
  return iconMap[file.type] || 'mdi:file';
}

// 获取图标颜色
function getIconColor(file: typeof fileList[0]) {
  const colorMap: Record<string, string> = {
    folder: '#FFC107',
    video: '#E91E63',
    image: '#4CAF50',
    document: '#2196F3',
    music: '#9C27B0'
  };
  return colorMap[file.type] || '#607D8B';
}

// 处理文件选择
function handleFileSelect(fileId: number) {
  const index = selectedFiles.value.indexOf(fileId);
  if (index > -1) {
    selectedFiles.value.splice(index, 1);
  } else {
    selectedFiles.value.push(fileId);
  }
}

// 处理文件双击
function handleFileDoubleClick(file: typeof fileList[0]) {
  if (file.isFolder) {
    console.log('打开文件夹:', file.name);
  } else {
    console.log('打开文件:', file.name);
  }
}

// 新建文件夹
function handleCreateFolder() {
  console.log('新建文件夹');
}

// 上传文件
function handleUpload() {
  console.log('上传文件');
}
</script>

<template>
  <div class="disk-container h-full flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="toolbar bg-white px-24px py-12px flex items-center gap-16px border-b border-gray-200">
      <!-- 上传按钮 -->
      <NButton type="primary" @click="handleUpload">
        <template #icon>
          <SvgIcon icon="mdi:upload" class="text-18px" />
        </template>
        上传
      </NButton>

      <!-- 新建文件夹 -->
      <NButton @click="handleCreateFolder">
        <template #icon>
          <SvgIcon icon="mdi:folder-plus" class="text-18px" />
        </template>
        新建文件夹
      </NButton>

      <!-- 操作按钮组 -->
      <NButton quaternary :disabled="selectedFiles.length === 0">
        <template #icon>
          <SvgIcon icon="mdi:download" class="text-18px" />
        </template>
        下载
      </NButton>
      <NButton quaternary :disabled="selectedFiles.length === 0">
        <template #icon>
          <SvgIcon icon="mdi:share-variant" class="text-18px" />
        </template>
        分享
      </NButton>
      <NButton quaternary :disabled="selectedFiles.length === 0">
        <template #icon>
          <SvgIcon icon="mdi:delete" class="text-18px" />
        </template>
        删除
      </NButton>

      <!-- 搜索框 -->
      <div class="flex-1 max-w-400px ml-auto">
        <NInput
          v-model:value="searchKeyword"
          placeholder="搜索文件"
          clearable
          round
        >
          <template #prefix>
            <SvgIcon icon="mdi:magnify" class="text-18px text-gray-400" />
          </template>
        </NInput>
      </div>

      <!-- 视图切换 -->
      <div class="flex gap-8px">
        <NButton quaternary circle>
          <template #icon>
            <SvgIcon icon="mdi:view-list" class="text-20px" />
          </template>
        </NButton>
        <NButton quaternary circle>
          <template #icon>
            <SvgIcon icon="mdi:view-grid" class="text-20px" />
          </template>
        </NButton>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="flex-1 overflow-auto p-24px">
      <NCard :bordered="false" class="h-full">
        <!-- 表头 -->
        <div class="file-header flex items-center px-12px py-8px text-12px text-gray-500 border-b border-gray-200">
          <NCheckbox class="mr-12px" />
          <div class="w-40px"></div>
          <div class="flex-1">文件名</div>
          <div class="w-100px text-center">大小</div>
          <div class="w-180px text-center">修改时间</div>
          <div class="w-80px text-center">操作</div>
        </div>

        <!-- 文件列表 -->
        <div class="file-body">
          <div
            v-for="file in fileList"
            :key="file.id"
            class="file-row flex items-center px-12px py-8px hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50': selectedFiles.includes(file.id) }"
            @click="handleFileSelect(file.id)"
            @dblclick="handleFileDoubleClick(file)"
          >
            <NCheckbox class="mr-12px" :checked="selectedFiles.includes(file.id)" />
            <div class="w-40px flex items-center justify-center">
              <SvgIcon
                :icon="getFileIcon(file)"
                class="text-24px"
                :style="{ color: getIconColor(file) }"
              />
            </div>
            <div class="flex-1 text-14px text-gray-800 truncate">{{ file.name }}</div>
            <div class="w-100px text-center text-12px text-gray-500">{{ file.size }}</div>
            <div class="w-180px text-center text-12px text-gray-500">{{ file.modified }}</div>
            <div class="w-80px flex justify-center">
              <NButton quaternary circle size="small">
                <template #icon>
                  <SvgIcon icon="mdi:dots-horizontal" class="text-16px text-gray-400" />
                </template>
              </NButton>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- 底部状态栏 -->
    <div class="status-bar bg-white px-24px py-8px flex items-center justify-between text-12px text-gray-500 border-t border-gray-200">
      <div class="flex items-center gap-8px">
        <span>共 {{ fileList.length }} 项</span>
        <span v-if="selectedFiles.length > 0">，已选 {{ selectedFiles.length }} 项</span>
      </div>
      <div class="flex items-center gap-8px">
        <SvgIcon icon="mdi:cloud" class="text-16px" />
        <span>已用 {{ storageInfo.used }} / {{ storageInfo.total }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.disk-container {
  height: calc(100vh - 56px);
}

.file-header {
  user-select: none;
}

.file-row {
  user-select: none;
}
</style>
