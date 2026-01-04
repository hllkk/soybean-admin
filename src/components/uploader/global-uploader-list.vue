<script lang="ts" setup>
import { ref } from 'vue';
import VueSimpleUploader from 'vue-simple-uploader';
import type { UploaderListSlotProps } from 'vue-simple-uploader';
import { useDiskStore } from '@/store/modules/disk';
import { formatFileSize } from '@/utils/file';

defineOptions({
  name: 'GlobalUploaderList'
});

const { UploaderList } = VueSimpleUploader;
const collapse = ref(false);

const diskStore = useDiskStore();

const getFileIcon = (type: SimpleUploader.Uploader.FileType, fileName?: string) => {
  if (!type) return 'disk-list_file';

  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';

  const iconMap = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    excel: ['xls', 'xlsx', 'csv'],
    ppt: ['ppt', 'pptx'],
    word: ['doc', 'docx'],
    pdf: ['pdf'],
    zip: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    code: ['html', 'css', 'js', 'json', 'xml', 'ts', 'tsx', 'vue', 'jsx', 'php', 'py', 'go'],
    font: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
    exe: ['exe', 'msi', 'dmg', 'iso', 'apk', 'sh'],
    text: ['txt', 'md', 'log']
  };

  const typeIconMap: Record<string, string> = {
    'image/': 'disk-list_image',
    'video/': 'disk-list_video',
    'audio/': 'disk-list_audio',
    'application/pdf': 'disk-list_pdf',
    'application/zip': 'disk-list_zip',
    'application/x-zip': 'disk-list_zip'
  };

  for (const [typePrefix, icon] of Object.entries(typeIconMap)) {
    if (type.startsWith(typePrefix)) return icon;
  }

  if (ext) {
    for (const [category, extensions] of Object.entries(iconMap)) {
      if (extensions.includes(ext)) {
        const categoryIcon: Record<string, string> = {
          image: 'disk-list_image',
          video: 'disk-list_video',
          audio: 'disk-list_audio',
          excel: 'disk-list_excel',
          ppt: 'disk-list_ppt',
          word: 'disk-list_word',
          pdf: 'disk-list_pdf',
          zip: 'disk-list_zip',
          code: 'disk-list_code',
          font: 'disk-list_font',
          exe: 'disk-list_exe',
          text: 'disk-list_file'
        };
        return categoryIcon[category] || 'disk-list_file';
      }
    }
  }

  return 'disk-list_file';
};

function handleFileSize(file: UploaderListSlotProps['fileList'][0]) {
  if (file.isFolder) {
    let totalSize = 0;
    file.files?.forEach(item => {
      totalSize += item.size;
    });
    return formatFileSize(totalSize);
  }
  return formatFileSize(file.size);
}
</script>

<template>
  <UploaderList v-show="diskStore.panelVisible">
    <template #default="props: UploaderListSlotProps">
      <div
        class="fixed bottom-[2%] right-[2%] m-auto h-300px w-720px overflow-hidden border-[1px] border-[#e2e2e2] rounded-[7px_7px_0_0] border-solid bg-[#fff] c-black shadow-[0_0_10px_0_rgba(0,0,0,0.2)] transition-all duration-500 delay-0 ease-in-out .dark:bg-[#1e1e1e]"
        :class="{ collapse: collapse }"
      >
        <!-- 上传列表标题 -->
        <div class="h-3rem flex border-b-1px border-gray-3 p-[0_10px]">
          <h2 class="ml-3% select-none text-14px line-height-[3rem] dark:text-[#fff]">传输列表</h2>
          <div class="flex-[1] text-right">
            <NButton v-if="diskStore.fileListLength > 0" text class="ml-0 p-[16px_5px] text-25px">
              <template #icon>
                <icon-ep-position />
              </template>
            </NButton>
            <NButton text class="ml-0 p-[16px_5px] text-25px" @click="diskStore.closePanel()">
              <template #icon>
                <icon-ep:circle-close />
              </template>
            </NButton>
          </div>
        </div>
        <!-- 上传列表内容 -->
        <ul class="file-list">
          <li v-for="file in props.fileList" :key="file.id" class="file-item">
            <!-- 左侧图标区 -->
            <div class="file-icon">
              <SvgIcon v-if="file.isFolder" local-icon="disk-list_folder" class="text-36px" />
              <SvgIcon v-else :local-icon="getFileIcon(file.fileType, file.name)" class="text-36px" />
            </div>

            <!-- 中间信息展示区 -->
            <div class="file-info">
              <!-- 上段：文件名 -->
              <div class="file-name select-none">{{ file.name }}</div>

              <!-- 中段：进度条 -->
              <div class="file-progress">
                <div class="progress-bar bg-primary" :style="{ width: file._prevProgress + '%' }" />
              </div>

              <!-- 下段：文件元信息 -->
              <div class="file-meta">
                <span class="file-size select-none">{{ handleFileSize(file) }}</span>
                <span class="file-speed select-none">{{ file.currentSpeed }}</span>
              </div>
            </div>

            <!-- 右侧操作按钮区 -->
            <div class="file-actions">
              <NButton text class="action-btn" size="small">
                <template #icon>
                  <icon-ep-video-play />
                </template>
              </NButton>
              <NButton text class="action-btn" size="small" @click="file.cancel()">
                <template #icon>
                  <icon-ep-close />
                </template>
              </NButton>
            </div>
          </li>
          <div
            v-if="!props.fileList.length"
            class="flex flex-col items-center justify-center py-18 text-gray-500 lt-sm:py-8 dark:text-gray-400"
          >
            <icon-ep-upload class="mb-2 text-4xl opacity-50 lt-sm:mb-1 lt-sm:text-3xl" />
            暂无待传输文件
          </div>
        </ul>
      </div>
    </template>
  </UploaderList>
</template>

<style scoped lang="scss">
.file-list {
  position: relative;
  max-height: 252px;
  overflow-x: hidden;
  list-style-type: none;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
}

.file-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;

  .icon-wrapper {
    font-size: 32px;
    color: #64748b;
  }
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.file-progress {
  height: 3px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;

  .progress-bar {
    height: 100%;
    /*background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%); */
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748b;
  line-height: 1.3;
}

.file-size {
  font-weight: 400;
}

.file-speed {
  font-weight: 500;
  color: #3b82f6;
}

.file-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  margin-left: 12px;

  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: #64748b;
    transition: all 0.2s ease;

    &:hover {
      background-color: #e2e8f0;
      color: #3b82f6;
    }
  }
}

.dark .file-item {
  border-bottom-color: #334155;

  &:hover {
    background-color: #1e293b;
  }
}

.dark .file-name {
  color: #f1f5f9;
}

.dark .file-progress {
  background-color: #334155;
}

.dark .file-meta {
  color: #94a3b8;
}

.dark .file-speed {
  color: #60a5fa;
}

.dark .file-actions .action-btn {
  color: #94a3b8;

  &:hover {
    background-color: #334155;
    color: #60a5fa;
  }
}

@media (max-width: 640px) {
  .file-item {
    padding: 10px 12px;
  }

  .file-icon {
    width: 40px;
    height: 40px;
    margin-right: 10px;

    .icon-wrapper {
      font-size: 28px;
    }
  }

  .file-name {
    font-size: 13px;
  }

  .file-actions {
    margin-left: 8px;

    .action-btn {
      width: 28px;
      height: 28px;
    }
  }
}
</style>
