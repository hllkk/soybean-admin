# 最近访问文件双击预览功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现最近访问页面文件双击预览功能，复用网盘页面的预览架构。

**Architecture:** 在 `recent/index.vue` 中引入预览组件，定义预览状态，实现 `handleFileDblClick` 函数根据文件类型调用对应预览，构建音频播放列表和视频流式播放支持。

**Tech Stack:** Vue3 + TypeScript + Naive UI，复用现有预览组件（ImagePreview、VideoPreview、AudioPreview、FilePreviewOverlay、TextPreview）

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/views/recent/index.vue` | 修改 | 唯一需要修改的文件，添加预览功能 |

---

### Task 1: 添加导入语句

**Files:**
- Modify: `src/views/recent/index.vue:1-11` (script setup 导入区域)

- [ ] **Step 1: 添加组件导入**

在现有导入语句后添加：

```typescript
import { nextTick } from 'vue';
import FilePreviewOverlay from '@/components/preview/file-preview-overlay.vue';
import ImagePreview from '@/components/preview/image-preview.vue';
import VideoPreview from '@/components/preview/video-preview.vue';
import AudioPreview from '@/components/preview/audio-preview.vue';
import TextPreview from '@/components/preview/text-preview.vue';
```

- [ ] **Step 2: 添加 API 导入**

```typescript
import { fetchGenerateStreamToken } from '@/service/api/disk';
```

注意：`fetchAddRecent` 已在现有导入中。

- [ ] **Step 3: 添加工具函数导入**

```typescript
import { getPreviewCategory } from '@/utils/file-type';
import { getServiceBaseURL } from '@/utils/service';
import { getToken } from '@/store/modules/auth/shared';
```

---

### Task 2: 定义预览状态变量

**Files:**
- Modify: `src/views/recent/index.vue:17-32` (状态定义区域)

- [ ] **Step 1: 添加 Office/PDF 预览状态**

在 `const selectedFiles = ref<CommonType.IdType[]>([]);` 后添加：

```typescript
// Office/PDF 预览
const previewVisible = ref(false);
const previewFile = ref<Api.Disk.PreviewFileInfo | null>(null);
```

- [ ] **Step 2: 添加图片预览引用**

```typescript
// 图片预览
const imagePreviewRef = ref<InstanceType<typeof ImagePreview>>();
```

- [ ] **Step 3: 添加视频预览状态**

```typescript
// 视频预览
const videoPreviewVisible = ref(false);
const videoPreviewFile = ref<Api.Disk.FileItem | null>(null);
const videoStreamToken = ref('');
```

- [ ] **Step 4: 添加音频预览状态**

```typescript
// 音频预览
const audioPreviewVisible = ref(false);
const audioPreviewFile = ref<Api.Disk.FileItem | null>(null);
const isAudioCompact = ref(false);
```

---

### Task 3: 定义计算属性

**Files:**
- Modify: `src/views/recent/index.vue:56-63` (computed 区域)

- [ ] **Step 1: 添加音频播放列表计算属性**

在 `const fileList = computed(...)` 后添加：

```typescript
// 音频播放列表（从最近访问列表筛选）
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

// 当前播放曲目索引
const currentAudioIndex = computed(() => {
  if (!audioPreviewFile.value) return 0;
  return audioPlaylist.value.findIndex(item => String(item.id) === String(audioPreviewFile.value?.fileId));
});
```

- [ ] **Step 2: 添加视频预览 URL 计算属性**

```typescript
// 视频预览 URL
const videoStreamBaseUrl = computed(() => {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return `${baseURL}/stream/video/${videoPreviewFile.value?.fileId}`;
});
```

---

### Task 4: 替换 handleFileDblClick 函数

**Files:**
- Modify: `src/views/recent/index.vue:149-153` (handleFileDblClick 函数)

- [ ] **Step 1: 替换现有的 handleFileDblClick 函数**

将现有的占位函数替换为完整实现：

```typescript
// 处理文件双击 - 打开预览
async function handleFileDblClick(file: Api.Disk.FileItem) {
  if (file.isFolder) {
    window.$message?.info('暂不支持预览文件夹');
    return;
  }

  // 更新最近访问记录
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

---

### Task 5: 实现各类型预览函数

**Files:**
- Modify: `src/views/recent/index.vue:154-172` (在 handleFileDblClick 后添加)

- [ ] **Step 1: 添加图片预览函数**

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
```

- [ ] **Step 2: 添加视频预览函数**

```typescript
// 视频预览
async function openVideoPreview(file: Api.Disk.FileItem) {
  const res = await fetchGenerateStreamToken(String(file.fileId));
  if (res.data) {
    videoStreamToken.value = res.data.token;
    videoPreviewFile.value = file;
    videoPreviewVisible.value = true;
  }
}
```

- [ ] **Step 3: 添加音频预览函数**

```typescript
// 音频预览
function openAudioPreview(file: Api.Disk.FileItem) {
  audioPreviewFile.value = file;
  audioPreviewVisible.value = true;
}
```

- [ ] **Step 4: 添加 Office/PDF 预览函数**

```typescript
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
```

- [ ] **Step 5: 添加文本预览函数**

```typescript
// 文本预览（使用 diskStore 状态）
function openTextPreview(file: Api.Disk.FileItem) {
  diskStore.textPreviewRow = file;
  diskStore.textPreviewVisible = true;
}
```

---

### Task 6: 实现预览关闭处理函数

**Files:**
- Modify: `src/views/recent/index.vue` (在预览函数后添加)

- [ ] **Step 1: 添加视频关闭处理**

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
```

- [ ] **Step 2: 添加音频关闭处理**

```typescript
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

---

### Task 7: 添加模板中的预览组件

**Files:**
- Modify: `src/views/recent/index.vue:178-233` (template 区域)

- [ ] **Step 1: 在 template 末尾（NCard 关闭标签后）添加预览组件**

在 `<NCard>` 关闭标签 `</NCard>` 后，`</div>` 前，添加以下预览组件：

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

    <!-- 文本预览 -->
    <TextPreview />
```

---

### Task 8: 添加 CSS 过渡动画

**Files:**
- Modify: `src/views/recent/index.vue:235-242` (style 区域)

- [ ] **Step 1: 在现有 style scoped 中添加过渡动画**

在现有的 `:deep(.n-card__content)` 样式后添加：

```scss
// 音频预览遮罩层过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

---

### Task 9: 类型检查验证

**Files:**
- N/A (验证步骤)

- [ ] **Step 1: 运行 TypeScript 类型检查**

Run: `pnpm typecheck`
Expected: 无类型错误

如果出现类型错误，检查：
1. 导入路径是否正确
2. 类型定义是否匹配（如 `Api.Disk.PreviewFileInfo`）
3. ref 类型是否正确

- [ ] **Step 2: 运行 ESLint 检查**

Run: `pnpm lint`
Expected: 无 lint 错误

---

### Task 10: 提交代码

**Files:**
- N/A (提交步骤)

- [ ] **Step 1: 查看修改内容**

Run: `git diff src/views/recent/index.vue`

确认修改内容符合预期。

- [ ] **Step 2: 提交修改**

```bash
git add src/views/recent/index.vue
git commit -m "feat(recent): 实现文件双击预览功能

- 支持图片、视频、音频、Office/PDF、文本文件预览
- 图片预览支持列表切换
- 视频预览使用流式播放
- 音频预览支持播放列表"
```

---

## 测试清单

手动测试以下场景：

1. **图片预览**：双击 `.jpg/.png/.gif` 文件，打开全屏预览，可切换列表中的其他图片
2. **视频预览**：双击 `.mp4/.webm` 文件，打开播放器，视频正常播放
3. **音频预览**：双击 `.mp3/.wav` 文件，打开播放器，可切换上一首/下一首
4. **Office 预览**：双击 `.docx/.xlsx/.pptx` 文件，打开 OnlyOffice 编辑器
5. **PDF 预览**：双击 `.pdf` 文件，打开 PDF 预览器
6. **文本预览**：双击 `.txt/.json/.md` 文件，打开文本编辑器
7. **不支持类型**：双击 `.zip/.rar` 等文件，显示 "暂不支持预览" 提示

---

## Self-Review 检查

- **Spec coverage**: 所有文件类型（image/video/audio/office/pdf/code/markdown）均有对应预览函数
- **Placeholder scan**: 无 TBD/TODO 占位符，所有代码完整
- **Type consistency**: 函数名一致（openImagePreview、openVideoPreview 等），变量名一致（videoPreviewFile、audioPreviewFile 等）