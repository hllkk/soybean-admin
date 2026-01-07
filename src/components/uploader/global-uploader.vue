<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { UploaderInst } from 'vue-simple-uploader';
import VueSimpleUploader from 'vue-simple-uploader';
import { fetchCheckExist, fetchMergeFile, fetchUploadFolder, simpleUploadURL } from '@/service/api/disk/list';
import { getAuthorization } from '@/service/request/shared';
import { useDiskStore } from '@/store/modules/disk';
import { encodeIfNeeded, formatNetSpeed, isPath } from '@/utils/file';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
const { Uploader, UploaderBtn, UploaderDrop, UploaderUnsupport } = VueSimpleUploader;

defineOptions({
  name: 'GlobalUploader'
});

const diskStore = useDiskStore();
const route = useRoute();

const uploaderRef = ref<UploaderInst | null>(null);
const dragover = ref(false); // 是否是拖拽进入
const showUploader = ref(true); // 是否显示上传组件
const isDragStart = ref(false); // 是否是拖拽开始
const isUploading = ref(false); // 是否正在上传
const enableDragUpload = ref(true);
const fileListScrollTop = ref(0);
const netSpeed = ref('');
const process = ref(-10);
const dragoverLoop = ref<number | null>(null);
const uploadParams = ref<SimpleUploader.Uploader.FileAddParams>({});
const createFolderParams = ref<Api.Disk.CreateFolderParams>({
  isFolder: true
});

const uploaderOptions = {
  target: simpleUploadURL,
  chunkSize: localStg.get('chunkSize') || 1024 * 1024,
  maxChunkRetries: 3, // 最大重试次数
  simultaneousUploads: 3, // 并发上传数
  testChunks: true, // 是否开启服务器分片校验
  // 服务器分片校验函数，秒传及断点续传基础
  checkChunkUploadedByResponse: (chunk: SimpleUploader.Uploader.Chunk, message: string) => {
    const objMessage = JSON.parse(message);
    const res = objMessage.data;
    if (!res) {
      return [];
    }
    if (res.pass) {
      // 秒传
      return true;
    }
    // 断点续传
    return (res.resume || []).includes(chunk.offset + 1);
  },
  parseTimeRemaining: (_: number, parsedTimeRemaining: string) => {
    return parsedTimeRemaining
      .replace(/\syears?/, '年')
      .replace(/\days?/, '天')
      .replace(/\shours?/, '小时')
      .replace(/\sminutes?/, '分钟')
      .replace(/\sseconds?/, '秒');
  },
  headers: {
    Authorization: getAuthorization()
  },
  query() {}
};

const statusText = {
  success: '上传成功',
  error: '上传失败',
  uploading: '上传中',
  paused: '暂停上传',
  waiting: '等待上传'
};

const fileStatusMap = ref<Map<number, string>>(new Map());

function setFileStatus(fileId: number, status: string) {
  fileStatusMap.value.set(fileId, status);
}

function removeFileStatus(fileId: number) {
  fileStatusMap.value.delete(fileId);
}

// 限制上传文件的类型
const attrs = {
  accept: '*'
};

function updateChunkSize(chunkSize: number) {
  uploaderOptions.chunkSize = chunkSize;
  // 重新渲染uploader组件
  showUploader.value = false;
  nextTick(() => {
    showUploader.value = true;
    initUploader();
  });
}

function uploaderCancel() {
  uploaderRef.value?.uploader.cancel();
  diskStore.closePanel();
  const chunkSize = localStg.get('chunkSize');
  if (chunkSize && chunkSize !== uploaderRef.value?.uploader.opts.chunkSize) {
    updateChunkSize(chunkSize);
  }
}

// 上传文件前的操作
async function doUploadBefore(files: SimpleUploader.Uploader.UploaderFile[]) {
  // 获取文件列表长度
  diskStore.fileListLength = uploaderRef.value?.uploader.fileList.length || 0;
  const filePaths = uploaderRef.value?.uploader.filePaths || {};
  const paths = Object.keys(filePaths);
  const pathsLength = paths.length;
  diskStore.openPanel();

  if (pathsLength > 0) {
    paths.forEach(path => {
      const folder = filePaths[path];
      createFolderParams.value = {
        isFolder: true,
        folderPath: encodeIfNeeded(folder.parent?.path || ''),
        fileName: encodeIfNeeded(folder.name),
        folder: route.query.folder,
        currentDirectory: encodeIfNeeded(uploadParams.value.currentDirectory || ''),
        userId: uploadParams.value.userId
      };
      // 后端上传文件夹接口
      fetchUploadFolder(createFolderParams.value);
    });
  }
  // 上传文件夹之后开始上传文件
  files.forEach(file => {
    if (window.uploader?.opts) {
      Object.assign(window.uploader.opts, {
        query: {
          isFolder: false,
          lastModified: file.file.lastModified || 0,
          ...uploadParams.value
        }
      });
    }
  });
  nextTick(() => {
    if (window.uploader) {
      window.uploader.resume();
    }
  });
}

// 添加文件时触发
async function onFilesAdded(files: SimpleUploader.Uploader.UploaderFile[]) {
  if (!files.length) {
    window.$message?.warning('没有选择要上传的文件或者上传的文件夹为空文件夹');
    return;
  }
  try {
    uploadParams.value = await diskStore.getUploadParams();
    const filenames = files.map(file => file.name);
    const paths = Object.keys(uploaderRef.value?.uploader.filePaths || {});
    paths.forEach(path => {
      if (isPath(path)) {
        // 取第一级
        filenames.push(path.split('/')[0]);
      }
    });
    const query = {
      filenames,
      ...uploadParams.value
    };
    const { data, error } = await fetchCheckExist(query);
    if (error) {
      window.$message?.error(`文件存在检查失败: ${error}`);
      uploaderCancel();
      return;
    }
    if (data.exist) {
      window.$dialog?.destroyAll();
      window.$dialog?.warning({
        title: '文件已存在',
        content: '是否覆盖已存在的文件？',
        positiveText: '覆盖',
        negativeText: '取消',
        onPositiveClick() {
          createFolderParams.value.override = true;
          // 上传文件
          doUploadBefore(files);
        },
        onNegativeClick() {
          uploaderCancel();
        }
      });
    } else {
      // 上传文件
      await doUploadBefore(files);
    }
  } catch (error) {
    window.$message?.error(`文件添加失败: ${error}`);
    uploaderCancel();
  }
}

function setPageTitle(speed: string) {
  if (process.value === -10 || process.value === 100 || diskStore.fileListLength === 0) {
    document.title = route.meta.i18nKey ? $t(route.meta.i18nKey) : document.title;
  } else {
    document.title = `${process.value}% | ${speed}`;
  }
}

function onFileProgress(
  rootFile: SimpleUploader.Uploader.UploaderFile,
  file: SimpleUploader.Uploader.UploaderFile,
  _: SimpleUploader.Uploader.Chunk
) {
  netSpeed.value = formatNetSpeed(file.currentSpeed, false);
  process.value = Math.trunc((window.uploader?.progress() as number) * 100);
  setPageTitle(netSpeed.value);

  if (process.value < 100) {
    const fileId = rootFile.isFolder ? rootFile.id : file.id;
    const currentStatus = fileStatusMap.value.get(fileId);

    if (currentStatus !== 'paused') {
      setFileStatus(fileId, 'uploading');
    }
  }

  if (process.value > 0 && process.value < 100 && window.uploader?.fileList && window.uploader.fileList.length > 0) {
    window.onbeforeunload = () => {
      return '还有文件正在上传, 确定退出吗?';
    };
  } else {
    window.onbeforeunload = null;
  }
  isUploading.value = window.uploader?.isUploading() as boolean;
}

function handleClose() {
  if (process.value === -10 || process.value === 100 || diskStore.fileListLength === 0) {
    uploaderCancel();
  } else {
    window.$dialog?.warning({
      title: '关闭',
      content: '还有文件正在上传,确定要关闭吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick() {
        uploaderCancel();
      },
      onNegativeClick() {
        window.$dialog?.destroyAll();
      }
    });
  }
}

function onFileSuccess(
  rootFile: SimpleUploader.Uploader.UploaderFile,
  file: SimpleUploader.Uploader.UploaderFile,
  response: string
) {
  const res = JSON.parse(response);
  if (!res.data) {
    window.$message?.error(res.message || '上传失败');
    setFileStatus(file.id, 'error');
    handleClose();
    return;
  }
  const data = res.data;
  // 服务器自定义的错误（即虽返回200，但是是错误的情况），这种错误是Uploader无法拦截的
  if (!data.upload) {
    window.$message?.error(data.message || '上传失败');
    setFileStatus(file.id, 'error');
  } else {
    setFileStatus(file.id, 'success');

    // 如果是文件夹的子文件上传成功，检查文件夹的所有子文件是否都上传成功
    if (rootFile.isFolder && rootFile.files) {
      const allFilesSuccess = rootFile.files.every(subFile => subFile.isComplete() || subFile.isUploading() === false);

      if (allFilesSuccess) {
        setFileStatus(rootFile.id, 'success');
      }
    }
    diskStore.getFileList();
  }
  // 如果服务端返回需要合并文件
  if (data.merge) {
    setFileStatus(file.id, 'merging');
    const mergeParams: Api.Disk.FileMergeRequest = {
      fileName: encodeIfNeeded(file.name),
      relativePath: encodeIfNeeded(file.relativePath),
      identifier: file.uniqueIdentifier,
      folder: route.query.folder,
      currentDirectory: encodeIfNeeded(uploadParams.value.currentDirectory || ''),
      userId: uploadParams.value.userId,
      totalSize: file.size,
      isFolder: file.isFolder,
      lastModified: file.file.lastModified,
      fileId: uploadParams.value.fileId || ''
    };
    fetchMergeFile(mergeParams);
    removeFileStatus(file.id);
    setFileStatus(file.id, 'success');

    // 对于文件夹上传，只在所有子文件都上传完成时才显示成功提示
    if (rootFile.isFolder && rootFile.files) {
      const allFilesSuccess = rootFile.files.every(subFile => subFile.isComplete() || subFile.isUploading() === false);
      if (allFilesSuccess) {
        window.$message?.success('文件夹上传成功');
      }
    } else {
      window.$message?.success('上传成功');
    }

    if (process.value === -10 || process.value === 100 || diskStore.fileListLength === 0) {
      uploaderCancel();
    }
  } else if (rootFile.isFolder && rootFile.files) {
    // 对于文件夹上传，只在所有子文件都上传完成时才显示成功提示
    const allFilesSuccess = rootFile.files.every(subFile => subFile.isComplete() || subFile.isUploading() === false);
    if (allFilesSuccess) {
      window.$message?.success('文件夹上传成功');
    }
  } else {
    window.$message?.success('上传成功');
  }

  if (file.parent === null) {
    handleClose();
  }

  diskStore.getFileList();
}
function onFileError(
  _: SimpleUploader.Uploader.UploaderFile,
  _rootFile: SimpleUploader.Uploader.UploaderFile,
  response: string
) {
  window.$message?.error(`上传失败: ${response}`);
}

function onFileRemoved() {
  diskStore.fileListLength = window.uploader?.fileList.length as number;
}

// 拖拽开始时
function handleDragstart(e: DragEvent) {
  const target = e.target as HTMLElement;
  // 检查是否有可排序的元素
  if (target.closest('.sortable-chosen')) {
    diskStore.setUploadDragEnabled(false);
    return;
  }

  // 检查是否是可拖拽的文件元素
  const isDraggableFile = target.dataset.draggableFile === 'true';

  if (enableDragUpload.value && diskStore.isDragUploadEnabled) {
    if (isDraggableFile) {
      isDragStart.value = true;
    }
    // 如果不是可拖拽文件或滚动位置不在顶部，阻止默认拖拽行为
    if (!isDraggableFile || fileListScrollTop.value !== 0) {
      e.preventDefault();
    }
  }
}

// 拖拽进入页面时
function handleDragenter(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  dragover.value = true;
}

// 拖拽悬停在页面上时
function handleDragover(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();

  if (dragoverLoop.value) {
    clearInterval(dragoverLoop.value);
  }
  if (!isDragStart.value) {
    dragover.value = true;
  }

  dragoverLoop.value = window.setInterval(() => {
    dragover.value = false;
  }, 100);
}

// 拖拽释放到页面上时
function handleDrop(e: DragEvent) {
  if (!diskStore.isDragUploadEnabled) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  dragover.value = false;
}

function handleStatusChange(fileId: number, status: string) {
  fileStatusMap.value.set(fileId, status);
}

// 初始化上传组件
function initUploader() {
  nextTick(() => {
    if (uploaderRef.value) {
      // 使用更安全的方式设置全局uploader引用
      if (typeof window !== 'undefined') {
        window.uploader = uploaderRef.value.uploader;
      }
    }
  });
}

onMounted(() => {
  // 检查当前路径是否支持拖拽
  diskStore.setUploadDragEnabled(true);

  const dropbox = document.body; // 3. 添加拖拽事件监听器
  dropbox.addEventListener('dragstart', handleDragstart); // 拖拽开始
  dropbox.addEventListener('dragenter', handleDragenter, false); // 拖拽进入页面
  dropbox.addEventListener('dragover', handleDragover, false); // 拖拽悬停在页面上
  dropbox.addEventListener('drop', handleDrop, false); // 拖拽释放到页面上

  // 初始化上传组件
  initUploader();
});

onUnmounted(() => {
  // 清理事件监听器，防止内存泄漏
  const dropbox = document.body;
  dropbox.removeEventListener('dragstart', handleDragstart); // 拖拽开始
  dropbox.removeEventListener('dragenter', handleDragenter);
  dropbox.removeEventListener('dragover', handleDragover);
  dropbox.removeEventListener('drop', handleDrop);
});
</script>

<template>
  <div class="fixed bottom-15px right-15px z-1002">
    <Uploader
      v-if="showUploader"
      ref="uploaderRef"
      :auto-start="false"
      :options="uploaderOptions"
      :file-status-text="statusText"
      @files-added="onFilesAdded"
      @file-progress="onFileProgress"
      @file-success="onFileSuccess"
      @file-error="onFileError"
      @file-removed="onFileRemoved"
    >
      <UploaderUnsupport>您的浏览器不支持上传组件</UploaderUnsupport>
      <!-- 上传区域-->
      <UploaderDrop v-if="dragover && enableDragUpload" class="left-0 top-0 size-full text-center">
        <span class="relative top-48% text-[34px] text-[#00000099] font-bold">上传文件到当前目录下</span>
      </UploaderDrop>
      <UploaderBtn id="global-uploader-btn-file" :attrs="attrs">选择文件</UploaderBtn>
      <UploaderBtn id="global-uploader-btn-folder" :directory="true">选择文件夹</UploaderBtn>
      <!--自定义文件列表-->
      <GlobalUploaderList
        :net-speed="netSpeed"
        :process="process"
        :is-uploading="isUploading"
        :file-status-map="fileStatusMap"
        @close="handleClose"
        @status-change="handleStatusChange"
      ></GlobalUploaderList>
    </Uploader>
  </div>
</template>

<style scoped>
#global-uploader-btn-file {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}

#global-uploader-btn-folder {
  position: absolute;
  clip: rect(0, 0, 0, 0);
}
.uploader-drop {
  position: fixed;
  background-color: #ffffff99;
  border: 3px dashed #00000099;
}
</style>
