# 最近访问文件双击预览功能设计

## 背景

最近访问页面 (`src/views/recent/index.vue`) 已有文件列表展示功能，但双击文件时仅显示 "功能开发中" 提示。需要实现完整的文件预览功能。

## 目标

实现双击最近访问列表中的文件时，根据文件类型调用对应的预览组件进行全屏覆盖预览。

## 设计原则

复用网盘页面 (`disk/index.vue`) 的预览架构，保持一致的用户体验。

## 文件类型与预览组件映射

| 文件类型 | 预览方式 | 状态管理 |
|---------|---------|---------|
| Office (doc/docx/xls/xlsx/ppt/pptx) | `FilePreviewOverlay` | 本地 ref 状态 |
| PDF | `FilePreviewOverlay` | 本地 ref 状态 |
| 图片 (jpg/png/gif/svg等) | `ImagePreview` | ref + `show()` 方法调用 |
| 视频 (mp4/webm/mov等) | `VideoPreview` | ref + stream token |
| 音频 (mp3/wav/flac等) | `AudioPreview` | ref + 播放列表 |
| 代码/Markdown (txt/json/md/log等) | `TextPreview` | diskStore 状态 |

## 实现方案

### 1. 引入组件和 API

```typescript
// 组件
import FilePreviewOverlay from '@/components/preview/file-preview-overlay.vue';
import ImagePreview from '@/components/preview/image-preview.vue';
import VideoPreview from '@/components/preview/video-preview.vue';
import AudioPreview from '@/components/preview/audio-preview.vue';
import TextPreview from '@/components/preview/text-preview.vue';

// API
import { fetchGenerateStreamToken } from '@/service/api/disk';
import { fetchAddRecent } from '@/service/api/disk/recent';

// 工具
import { getPreviewCategory } from '@/utils/file-type';
import { getServiceBaseURL } from '@/utils/service';
import { getToken } from '@/store/modules/auth/shared';
```

### 2. 预览状态定义

```typescript
// Office/PDF 预览
const previewVisible = ref(false);
const previewFile = ref<Api.Disk.PreviewFileInfo | null>(null);

// 图片预览
const imagePreviewRef = ref<InstanceType<typeof ImagePreview>>();

// 视频预览
const videoPreviewVisible = ref(false);
const videoPreviewFile = ref<Api.Disk.FileItem | null>(null);
const videoStreamToken = ref('');

// 音频预览
const audioPreviewVisible = ref(false);
const audioPreviewFile = ref<Api.Disk.FileItem | null>(null);
const isAudioCompact = ref(false);
```

### 3. 音频播放列表计算

从最近访问列表中筛选所有音频文件作为播放列表，支持双击切换曲目：

```typescript
const audioPlaylist = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const token = getToken();

  return fileList.value
    .filter(file => !file.isFolder && getPreviewCategory(file.fileName) === 'audio')
    .map(file => ({
      id: file.fileId,
      title: file.fileName.replace(/\.[^.]+$/, ''),
      artist: '未知歌手',
      album: '',
      cover: file.mediaCover ? `${baseURL}/view/cover?id=${file.fileId}&token=${token}` : '',
      src: `${baseURL}/preview/file/${file.fileId}?token=${token}`,
      duration: undefined,
      lyrics: undefined
    }));
});

const currentAudioIndex = computed(() => {
  if (!audioPreviewFile.value) return 0;
  return audioPlaylist.value.findIndex(item => String(item.id) === String(audioPreviewFile.value?.fileId));
});
```

### 4. 视频预览 URL 计算

```typescript
const videoStreamBaseUrl = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return `${baseURL}/stream/video/${videoPreviewFile.value?.fileId}`;
});
```

### 5. handleFileDblClick 实现

```typescript
async function handleFileDblClick(file: Api.Disk.FileItem) {
  if (file.isFolder) {
    window.$message?.info('暂不支持预览文件夹');
    return;
  }

  // 记录最近访问（可选，更新访问时间）
  fetchAddRecent(file.fileId);

  const category = getPreviewCategory(file.fileName);

  switch (category) {
    case 'image':
      openImagePreview(file);
      break;
    case 'video':
      await openVideoPreview(file);
      break;
    case 'audio':
      openAudioPreview(file);
      break;
    case 'office':
    case 'pdf':
      openOfficePdfPreview(file);
      break;
    case 'code':
    case 'markdown':
      openTextPreview(file);
      break;
    default:
      window.$notification?.warning({
        content: '暂不支持预览此类型文件',
        duration: 3000
      });
  }
}
```

### 6. 各类型预览函数

```typescript
// 图片预览
function openImagePreview(file: Api.Disk.FileItem) {
  const images = fileList.value
    .filter(f => !f.isFolder && getPreviewCategory(f.fileName) === 'image')
    .map(f => ({ fileId: f.fileId, fileName: f.fileName }));

  const initialIndex = images.findIndex(img => String(img.fileId) === String(file.fileId));

  nextTick(() => {
    imagePreviewRef.value?.show(images, initialIndex >= 0 ? initialIndex : 0);
  });
}

// 视频预览
async function openVideoPreview(file: Api.Disk.FileItem) {
  const res = await fetchGenerateStreamToken(String(file.fileId));
  if (res.data) {
    videoStreamToken.value = res.data.token;
    videoPreviewFile.value = file;
    videoPreviewVisible.value = true;
  }
}

// 音频预览
function openAudioPreview(file: Api.Disk.FileItem) {
  audioPreviewFile.value = file;
  audioPreviewVisible.value = true;
}

// Office/PDF 预览
function openOfficePdfPreview(file: Api.Disk.FileItem) {
  previewFile.value = {
    fileId: file.fileId,
    fileName: file.fileName,
    fileSize: file.fileSize,
    fileExtension: file.fileExtension,
    filePath: file.filePath
  };
  previewVisible.value = true;
}

// 文本预览（使用 diskStore 状态）
function openTextPreview(file: Api.Disk.FileItem) {
  diskStore.textPreviewRow = file;
  diskStore.textPreviewVisible = true;
}
```

### 7. 预览关闭处理

```typescript
// 视频关闭
function handleVideoClose() {
  videoPreviewVisible.value = false;
  videoPreviewFile.value = null;
  videoStreamToken.value = '';
}

function handleVideoTokenUpdate(token: string) {
  videoStreamToken.value = token;
}

// 音频关闭
function handleAudioClose() {
  audioPreviewVisible.value = false;
  audioPreviewFile.value = null;
  isAudioCompact.value = false;
}

function handleAudioOverlayClick() {
  if (!isAudioCompact.value) {
    audioPreviewVisible.value = false;
    audioPreviewFile.value = null;
  }
}
```

### 8. 模板中添加预览组件

```vue
<!-- Office/PDF 预览 -->
<FilePreviewOverlay
  v-model:visible="previewVisible"
  :file="previewFile"
/>

<!-- 图片预览 -->
<ImagePreview ref="imagePreviewRef" />

<!-- 视频预览 -->
<Teleport to="body">
  <VideoPreview
    v-if="videoPreviewVisible && videoPreviewFile && videoStreamToken"
    :src="videoStreamBaseUrl"
    :file-name="videoPreviewFile.fileName"
    :stream-token="videoStreamToken"
    @close="handleVideoClose"
    @token-update="handleVideoTokenUpdate"
  />
</Teleport>

<!-- 音频预览 -->
<Teleport to="body">
  <Transition name="fade">
    <div
      v-if="audioPreviewVisible"
      class="fixed inset-0 z-9999 flex items-center justify-center"
      :class="isAudioCompact ? 'pointer-events-none' : 'bg-black/40 backdrop-blur-sm'"
      @click.self="handleAudioOverlayClick"
    >
      <AudioPreview
        v-if="audioPreviewFile && audioPlaylist.length > 0"
        :playlist="audioPlaylist"
        :initial-index="currentAudioIndex"
        @close="handleAudioClose"
        @compact-change="isAudioCompact = $event"
      />
    </div>
  </Transition>
</Teleport>

<!-- 文本预览（复用 diskStore 状态） -->
<TextPreview />
```

### 9. CSS 过渡动画

```scss
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

## 修改文件清单

| 文件 | 修改类型 | 内容 |
|------|---------|------|
| `src/views/recent/index.vue` | 修改 | 引入组件、定义状态、实现预览逻辑、添加模板 |

## 不修改的文件

- 所有预览组件（已存在且可复用）
- diskStore（TextPreview 已使用其状态）
- API 文件（所需 API 已存在）
- `src/utils/file-type.ts`（已存在类型判断函数）

## 测试要点

1. **图片预览**：双击图片文件，打开全屏预览，支持切换列表中的其他图片
2. **视频预览**：双击视频文件，打开播放器，支持流式播放
3. **音频预览**：双击音频文件，打开播放器，支持播放列表切换
4. **Office/PDF预览**：双击文档文件，打开全屏预览层
5. **文本预览**：双击代码/Markdown文件，打开编辑器预览
6. **不支持的类型**：显示提示信息

## 依赖检查

- `v-viewer`：图片预览库（已安装）
- `artplayer`：视频播放器（已安装）
- `monaco-editor`：代码编辑器（已安装）
- `vditor`：Markdown 编辑器（已安装）