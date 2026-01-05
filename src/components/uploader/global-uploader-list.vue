<script lang="ts" setup>
import { ref } from 'vue';
import VueSimpleUploader from 'vue-simple-uploader';
import type { UploaderListSlotProps } from 'vue-simple-uploader';
import { useDiskStore } from '@/store/modules/disk';
import { useAppStore } from '@/store/modules/app';
import { formatFileSize } from '@/utils/file';

defineOptions({
  name: 'GlobalUploaderList'
});

type processAreaClassType = {
  right?: string;
  bottom?: string;
  width?: string;
  height?: string;
  opacity?: string;
};

const { UploaderList } = VueSimpleUploader;
const collapse = ref(false);
const isShrink = ref(false);
const isUploading = ref(false);
const process = ref(-10);
const netSpeed = ref(0);
const processAreaClass = ref<processAreaClassType>({
  right: '66px',
  bottom: '66px',
  width: '92px',
  height: '92px',
  opacity: '1'
});

const diskStore = useDiskStore();
const appStore = useAppStore();

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

function expand() {
  if (appStore.isMobile) {
    return;
  }
  isShrink.value = false;
  processAreaClass.value.opacity = '0';
  setTimeout(() => {
    processAreaClass.value.width = '0';
    processAreaClass.value.height = '0';
  }, 300);
}

function shrink() {
  isShrink.value = true;
  processAreaClass.value.opacity = '1';
  processAreaClass.value.width = '92px';
  processAreaClass.value.height = '92px';
}
</script>

<template>
  <UploaderList v-show="diskStore.panelVisible">
    <template #default="props: UploaderListSlotProps">
      <Transition name="panel-fade">
        <div
          v-show="!isShrink && !appStore.isMobile"
          class="fixed bottom-[2%] right-[2%] h-300px w-720px overflow-hidden border-[1px] border-[#e2e2e2] rounded-[7px_7px_0_0] border-solid bg-[#fff] c-black shadow-[0_0_10px_0_rgba(0,0,0,0.2)] .dark:bg-[#1e1e1e]"
          :class="{ collapse }"
        >
          <!-- 上传列表标题 -->
          <div class="h-3rem flex border-b-1px border-gray-3 p-[0_10px]">
            <h2 class="ml-3% select-none text-14px line-height-[3rem] dark:text-[#fff]">传输列表</h2>
            <div class="flex-[1] text-right">
              <NButton v-if="diskStore.fileListLength > 0" text class="ml-0 p-[16px_5px] text-25px" @click="shrink">
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
      </Transition>
      <Transition name="ball-fade">
        <div
          v-show="isShrink || appStore.isMobile"
          id="drag-ball"
          class="process-area"
          :style="processAreaClass"
          @click="expand"
        >
          <div class="process-anime">
            <div class="cube-a" :style="{ top: -process - 65 + '%' }"></div>
            <div class="cube-b" :style="{ top: -process - 65 + '%' }"></div>

            <div v-if="props.fileList.length && process < 100" class="process-info">
              <div class="process">{{ process }}%</div>
              <div v-if="isUploading" class="net-speed">{{ netSpeed }}</div>
            </div>

            <div v-if="props.fileList.length && process >= 100" class="done">
              <svg xmlns="http://www.w3.org/2000/svg" class="done-icon checkmark">
                <path d="M 13.1 21.2 l 5.1 5.2 l 12.7 -12.8" class="checkmark__check fill-transparent"></path>
              </svg>
            </div>

            <div v-if="!props.fileList.length" class="empty-state select-none">暂无文件</div>
          </div>
        </div>
      </Transition>
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

.process-area {
  right: 66px;
  bottom: 66px;
  width: 92px;
  height: 92px;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  background: #fafafa;
  color: #434343;
  margin: auto;
  overflow: hidden;
  background-size: 100% 100%;
  border-radius: 50%;
  position: fixed;
  transition: all 0.3s ease-in-out;
  will-change: transform, opacity;
  z-index: 1000;
}

.process-area .process-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  pointer-events: none;
}

.process-area .process-info .process {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
}

.process-area .process-info .net-speed {
  font-size: 0.7rem;
  white-space: nowrap;
  margin-top: 2px;
}

.process-anime {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 4px solid #fff;
  transform: translate(-50%, -50%) translateZ(0);
  width: 92px;
  height: 92px;
  background: linear-gradient(45deg, #419eff, #9ccdff);
  border-radius: 50%;
  overflow: hidden;
  will-change: transform;
}

.process-anime .cube-a {
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(255, 255, 255, 0.3);
  width: 130px;
  height: 130px;
  border-radius: 50%;
  animation: fx-rotate 8s infinite linear;
  transform-origin: 50% 50%;
  transform: translate(-50%, -50%) translateZ(0);
  will-change: transform;
}

.dark .process-anime .cube-a {
  background: rgba(0, 0, 0, 0.3);
}

.process-anime .cube-b {
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(255, 255, 255, 0.6);
  width: 130px;
  height: 130px;
  border-radius: 50%;
  animation: fx-rotate 6s infinite reverse linear;
  transform-origin: 50% 50%;
  transform: translate(-50%, -50%) translateZ(0);
  will-change: transform;
}

.dark .process-anime .cube-b {
  background: rgba(74, 85, 104, 0.6);
}

@keyframes fx-rotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) translateZ(0);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg) translateZ(0);
  }
}

@keyframes fill-data {
  0% {
    box-shadow: inset 0 0 0 #fdda65;
  }
  100% {
    box-shadow: inset 0 0 0 45px #fdda65;
  }
}

@keyframes scale-data {
  0% {
    transform: translate(-50%, -50%) scale(2.25);
  }
  50% {
    transform: translate(-50%, -50%) scale(2);
  }
  100% {
    transform: translate(-50%, -50%) scale(2.25);
  }
}

@keyframes stroke-data {
  0% {
    stroke-dashoffset: 48;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.process-anime .done {
  position: absolute;
  width: 45px;
  height: 45px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(2.25);
  z-index: 10;
}

.process-anime .done .checkmark {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #fff;
  stroke-miterlimit: 10;
  box-shadow: inset 0 0 0 #fdda65;
  animation:
    fill-data 0.4s ease-in-out 0.4s forwards,
    scale-data 0.3s ease-in-out 0.9s both;
}

.process-anime .done .checkmark__check {
  transform: translate(2px, 2px);
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke-data 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

.process-anime .empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #434343;
  white-space: nowrap;
  text-align: center;
  line-height: 1.2;
  z-index: 10;
}

.dark .process-anime .empty-state {
  color: #f1f5f9;
}

.dark .process-area {
  background: #2d3748;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.4);
}

.dark .process-area .process-info .process {
  color: #f1f5f9;
}

.dark .process-area .process-info .net-speed {
  color: #cbd5e0;
}

@media (max-width: 640px) {
  .process-area {
    width: 80px;
    height: 80px;
    right: 20px;
    bottom: 20px;
  }

  .process-anime {
    width: 80px;
    height: 80px;
  }

  .process-area .process-info .process {
    font-size: 1.2rem;
  }

  .process-area .process-info .net-speed {
    font-size: 0.6rem;
  }

  .process-anime .empty-state {
    font-size: 0.7rem;
  }
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.panel-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.ball-fade-enter-active,
.ball-fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.ball-fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.ball-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
