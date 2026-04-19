# 文件上传组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为网盘系统实现高性能文件上传组件，支持分片上传、秒传、暂停/续传、并发控制、拖拽上传。

**Architecture:** 自研上传引擎，通过 `use-uploader` composable 暴露 API，状态通过 disk store 驱动 transfer-panel 展示。`upload-trigger.vue` 处理全局拖拽，toolbar 通过 composable 触发文件选择。

**Tech Stack:** Vue 3 + TypeScript + Pinia + Axios + SparkMD5 + Naive UI

**Design Spec:** `docs/superpowers/specs/2026-04-18-upload-component-design.md`

---

### Task 1: 安装依赖 + 定义上传类型

**Files:**
- Create: `src/typings/upload.d.ts`
- Modify: `src/typings/api/disk.api.d.ts`

- [ ] **Step 1: 安装 SparkMD5**

```bash
cd /home/devops-admin/frontend && pnpm add spark-md5
```

- [ ] **Step 2: 创建上传类型定义**

创建 `src/typings/upload.d.ts`：

```typescript
declare namespace Api {
  namespace Disk {
    /** 上传任务状态 */
    type UploadTaskStatus = 'pending' | 'hashing' | 'checking' | 'uploading' | 'merging' | 'paused' | 'completed' | 'failed';

    /** 秒传检测请求参数 */
    type FileCheckParams = {
      fileHash: string;
      fileName: string;
      fileSize: number;
      parentId: number;
    };

    /** 秒传检测响应 */
    type FileCheckResponse = {
      exists: boolean;
      fileId?: string;
      uploadedChunks?: number[];
    };

    /** 分片上传参数 */
    type ChunkUploadParams = {
      file: Blob;
      fileHash: string;
      chunkIndex: number;
      totalChunks: number;
      fileName: string;
      parentId: number;
    };

    /** 合并分片请求参数 */
    type MergeChunksParams = {
      fileHash: string;
      fileName: string;
      fileSize: number;
      totalChunks: number;
      parentId: number;
    };

    /** 合并分片响应 */
    type MergeChunksResponse = {
      fileId: string;
      url: string;
    };

    /** 上传任务（引擎内部使用） */
    type UploadTask = {
      taskId: string;
      file: File;
      fileName: string;
      fileSize: number;
      fileType: string;
      parentId: number;
      fileHash: string;
      status: UploadTaskStatus;
      progress: number;
      transferredSize: number;
      speed: number;
      remainingTime: number;
      uploadedChunks: number[];
      totalChunks: number;
      retryCount: number;
      abortController?: AbortController;
      error?: string;
    };
  }
}
```

- [ ] **Step 3: 扩展 TransferItem 的 status 类型**

修改 `src/typings/api/disk.api.d.ts`，更新 TransferItem 的 status 联合类型，增加 `chunkProgress` 字段：

将 TransferItem 的 status 从：
```typescript
status: 'pending' | 'transferring' | 'completed' | 'failed' | 'paused';
```
改为：
```typescript
status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'transferring' | 'merging' | 'paused' | 'completed' | 'failed';
```

并在 TransferItem 中增加可选字段：
```typescript
chunkProgress?: string;
```

完整的 TransferItem 应变为：
```typescript
type TransferItem = {
  transferId: string;
  fileName: string;
  fileType: string;
  transferType: 'upload' | 'download';
  status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'transferring' | 'merging' | 'paused' | 'completed' | 'failed';
  progress: number;
  transferredSize: number;
  totalSize: number;
  speed: number;
  remainingTime: number;
  chunkProgress?: string;
  error?: string;
};
```

- [ ] **Step 4: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

预期：PASS（新增类型不影响已有代码）

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-lock.yaml src/typings/upload.d.ts src/typings/api/disk.api.d.ts
git commit -m "feat: add upload types and SparkMD5 dependency"
```

---

### Task 2: 添加上传 API 函数

**Files:**
- Modify: `src/service/api/disk/file.ts`

- [ ] **Step 1: 添加秒传检测、分片上传、合并分片 API 函数**

在 `src/service/api/disk/file.ts` 末尾追加：

```typescript
/** 秒传检测 */
export function fetchCheckFile(data: Api.Disk.FileCheckParams) {
  return request<Api.Disk.FileCheckResponse>({
    url: '/disk/file/check',
    method: 'post',
    data
  });
}

/** 分片上传 */
export function fetchUploadChunk(data: Api.Disk.ChunkUploadParams) {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('fileHash', data.fileHash);
  formData.append('chunkIndex', String(data.chunkIndex));
  formData.append('totalChunks', String(data.totalChunks));
  formData.append('fileName', data.fileName);
  formData.append('parentId', String(data.parentId));

  return request<boolean>({
    url: '/disk/file/chunk',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 合并分片 */
export function fetchMergeChunks(data: Api.Disk.MergeChunksParams) {
  return request<Api.Disk.MergeChunksResponse>({
    url: '/disk/file/merge',
    method: 'post',
    data
  });
}
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/service/api/disk/file.ts
git commit -m "feat: add file check, chunk upload and merge API functions"
```

---

### Task 3: 增强 Disk Store

**Files:**
- Modify: `src/store/modules/disk/index.ts`

- [ ] **Step 1: 添加上传相关的便捷方法**

在 disk store 的 setup 函数中，在 `clearSelection()` 后面、`$reset()` 前面，添加以下 action：

```typescript
// 获取上传中的任务数
const uploadingCount = computed(() =>
  transferList.value.filter(item => item.transferType === 'upload' && item.status !== 'completed').length
);

// 批量添加上传任务
function addUploadTasks(items: Api.Disk.TransferItem[]) {
  transferList.value.push(...items);
}

// 清空所有传输项（包括已完成）
function clearAllTransfers() {
  transferList.value = [];
}
```

并在 return 对象中追加导出：

```typescript
// computed
uploadingCount,
// actions
addUploadTasks,
clearAllTransfers,
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/store/modules/disk/index.ts
git commit -m "feat: enhance disk store with upload task helpers"
```

---

### Task 4: 创建分片管理器

**Files:**
- Create: `src/hooks/business/upload/chunk-manager.ts`

- [ ] **Step 1: 实现分片管理器**

创建 `src/hooks/business/upload/chunk-manager.ts`：

```typescript
const MB = 1024 * 1024;

/** 动态分片策略：根据文件大小确定分片大小 */
export function getChunkSize(fileSize: number): number {
  if (fileSize < 10 * MB) return 0;
  if (fileSize < 100 * MB) return 5 * MB;
  if (fileSize < 1024 * MB) return 10 * MB;
  return 20 * MB;
}

/** 是否需要分片 */
export function needsChunking(fileSize: number): boolean {
  return fileSize >= 10 * MB;
}

/** 计算总分片数 */
export function getTotalChunks(fileSize: number, chunkSize: number): number {
  if (chunkSize === 0) return 1;
  return Math.ceil(fileSize / chunkSize);
}

/** 切出指定分片 */
export function sliceChunk(file: File, chunkIndex: number, chunkSize: number): Blob {
  const start = chunkIndex * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  return file.slice(start, end);
}

/** 获取文件扩展名（小写，无点） */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/business/upload/chunk-manager.ts
git commit -m "feat: add chunk manager with dynamic chunking strategy"
```

---

### Task 5: 创建秒传检测模块

**Files:**
- Create: `src/hooks/business/upload/instant-check.ts`

- [ ] **Step 1: 实现文件 hash 计算和秒传检测**

创建 `src/hooks/business/upload/instant-check.ts`：

```typescript
import SparkMD5 from 'spark-md5';
import { fetchCheckFile } from '@/service/api/disk/file';

const HASH_CHUNK_SIZE = 2 * 1024 * 1024;

/** 分片读取文件计算 MD5 hash */
export function computeFileHash(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks = Math.ceil(file.size / HASH_CHUNK_SIZE);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
      }
      currentChunk++;
      onProgress?.(Math.round((currentChunk / chunks) * 100));

      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));

    function loadNext() {
      const start = currentChunk * HASH_CHUNK_SIZE;
      const end = Math.min(start + HASH_CHUNK_SIZE, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}

/** 秒传检测 */
export async function checkInstantUpload(
  fileHash: string,
  fileName: string,
  fileSize: number,
  parentId: number
): Promise<Api.Disk.FileCheckResponse> {
  const { data, error } = await fetchCheckFile({
    fileHash,
    fileName,
    fileSize,
    parentId
  });

  if (error || !data) {
    return { exists: false, uploadedChunks: [] };
  }

  return data;
}
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/business/upload/instant-check.ts
git commit -m "feat: add instant upload check with file hash computation"
```

---

### Task 6: 创建上传引擎

**Files:**
- Create: `src/hooks/business/upload/uploader-engine.ts`

这是最核心的文件。负责队列管理、并发控制、状态机、分片上传、断点续传。

- [ ] **Step 1: 创建上传引擎**

创建 `src/hooks/business/upload/uploader-engine.ts`：

```typescript
import axios from 'axios';
import { useDiskStore } from '@/store/modules/disk';
import { getToken } from '@/store/modules/auth/shared';
import { getServiceBaseURL } from '@/utils/service';
import { fetchUploadFile, fetchMergeChunks, fetchUploadChunk } from '@/service/api/disk/file';
import { getChunkSize, needsChunking, getTotalChunks, sliceChunk, getFileExtension } from './chunk-manager';
import { computeFileHash, checkInstantUpload } from './instant-check';

interface EngineOptions {
  maxConcurrent?: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createUploadAxios() {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      clientid: import.meta.env.VITE_APP_CLIENT_ID!
    }
  });
}

export class UploaderEngine {
  private tasks = new Map<string, Api.Disk.UploadTask>();
  private queue: string[] = [];
  private activePool = new Set<string>();
  private maxConcurrent: number;
  private diskStore: ReturnType<typeof useDiskStore> | null = null;
  private speedTrackers = new Map<string, { lastTime: number; lastBytes: number }>();
  private readonly MAX_CHUNK_RETRY = 3;
  private readonly MAX_MERGE_RETRY = 2;
  private readonly CHUNK_CONCURRENCY = 3;

  constructor(options?: EngineOptions) {
    this.maxConcurrent = options?.maxConcurrent ?? 3;
  }

  private getStore() {
    if (!this.diskStore) {
      this.diskStore = useDiskStore();
    }
    return this.diskStore;
  }

  /** 添加上传任务 */
  addTask(file: File, parentId: number): string {
    const taskId = generateId();
    const chunkSize = getChunkSize(file.size);
    const totalChunks = chunkSize > 0 ? getTotalChunks(file.size, chunkSize) : 1;

    const task: Api.Disk.UploadTask = {
      taskId,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: getFileExtension(file.name),
      parentId,
      fileHash: '',
      status: 'pending',
      progress: 0,
      transferredSize: 0,
      speed: 0,
      remainingTime: 0,
      uploadedChunks: [],
      totalChunks,
      retryCount: 0
    };

    this.tasks.set(taskId, task);
    this.queue.push(taskId);
    this.syncToStore(task);
    this.schedule();

    return taskId;
  }

  /** 暂停任务 */
  pause(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || (task.status !== 'uploading' && task.status !== 'hashing' && task.status !== 'checking')) return;

    task.abortController?.abort();
    task.abortController = undefined;
    task.status = 'paused';
    task.speed = 0;
    this.activePool.delete(taskId);
    this.syncToStore(task);
    this.schedule();
  }

  /** 继续任务 */
  resume(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'paused') return;

    task.status = 'pending';
    task.retryCount = 0;
    this.queue.push(taskId);
    this.syncToStore(task);
    this.schedule();
  }

  /** 取消任务 */
  cancel(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.abortController?.abort();
    this.tasks.delete(taskId);
    this.activePool.delete(taskId);
    this.queue = this.queue.filter(id => id !== taskId);
    this.speedTrackers.delete(taskId);
    this.getStore().removeTransferItem(taskId);
    this.schedule();
  }

  /** 重试失败任务 */
  retry(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'failed') return;

    task.status = 'pending';
    task.retryCount = 0;
    task.error = undefined;
    this.queue.push(taskId);
    this.syncToStore(task);
    this.schedule();
  }

  /** 暂停全部 */
  pauseAll(): void {
    for (const taskId of this.activePool) {
      this.pause(taskId);
    }
  }

  /** 继续全部 */
  resumeAll(): void {
    const pausedTasks = Array.from(this.tasks.values()).filter(t => t.status === 'paused');
    for (const task of pausedTasks) {
      this.resume(task.taskId);
    }
  }

  /** 调度：从队列取任务填入活跃池 */
  private schedule(): void {
    while (this.activePool.size < this.maxConcurrent && this.queue.length > 0) {
      const taskId = this.queue.shift()!;
      const task = this.tasks.get(taskId);
      if (!task || task.status !== 'pending') continue;

      this.activePool.add(taskId);
      this.processTask(taskId);
    }
  }

  /** 处理单个任务的生命周期 */
  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      // 1. 计算 hash
      if (!task.fileHash) {
        task.abortController = new AbortController();
        task.status = 'hashing';
        this.syncToStore(task);

        task.fileHash = await computeFileHash(task.file, (progress) => {
          task.progress = Math.round(progress * 0.3);
          this.syncToStore(task);
        });
      }

      // 2. 秒传检测
      task.status = 'checking';
      task.progress = 30;
      this.syncToStore(task);

      const checkResult = await checkInstantUpload(
        task.fileHash,
        task.fileName,
        task.fileSize,
        task.parentId
      );

      // 秒传成功
      if (checkResult.exists) {
        task.status = 'completed';
        task.progress = 100;
        task.transferredSize = task.fileSize;
        this.syncToStore(task);
        this.finishTask(taskId);
        return;
      }

      // 断点续传：跳过已传分片
      if (checkResult.uploadedChunks && checkResult.uploadedChunks.length > 0) {
        task.uploadedChunks = [...checkResult.uploadedChunks];
      }

      // 3. 上传
      task.status = 'uploading';
      task.abortController = new AbortController();
      this.syncToStore(task);

      if (needsChunking(task.fileSize)) {
        await this.uploadChunks(taskId);
        await this.mergeChunks(taskId);
      } else {
        await this.uploadWhole(taskId);
      }

      // 4. 完成
      task.status = 'completed';
      task.progress = 100;
      task.transferredSize = task.fileSize;
      task.speed = 0;
      task.remainingTime = 0;
      this.syncToStore(task);
      this.finishTask(taskId);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : '上传失败';
        task.speed = 0;
        this.syncToStore(task);
        this.finishTask(taskId);
      }
    }
  }

  /** 分片上传 */
  private async uploadChunks(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const chunkSize = getChunkSize(task.fileSize);
    const totalChunks = getTotalChunks(task.fileSize, chunkSize);

    const pendingChunks: number[] = [];
    for (let i = 0; i < totalChunks; i++) {
      if (!task.uploadedChunks.includes(i)) {
        pendingChunks.push(i);
      }
    }

    let nextIndex = 0;
    const uploadNext = async (): Promise<void> => {
      while (nextIndex < pendingChunks.length) {
        const chunkIndex = pendingChunks[nextIndex++];
        await this.uploadSingleChunk(taskId, chunkIndex, chunkSize, totalChunks);
      }
    };

    const workers = Array.from(
      { length: Math.min(this.CHUNK_CONCURRENCY, pendingChunks.length) },
      () => uploadNext()
    );

    await Promise.all(workers);
  }

  /** 上传单个分片（含重试） */
  private async uploadSingleChunk(
    taskId: string,
    chunkIndex: number,
    chunkSize: number,
    totalChunks: number
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const chunk = sliceChunk(task.file, chunkIndex, chunkSize);
    let attempts = 0;

    while (attempts < this.MAX_CHUNK_RETRY) {
      try {
        const axiosInstance = createUploadAxios();
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('fileHash', task.fileHash);
        formData.append('chunkIndex', String(chunkIndex));
        formData.append('totalChunks', String(totalChunks));
        formData.append('fileName', task.fileName);
        formData.append('parentId', String(task.parentId));

        await axiosInstance.post('/disk/file/chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: task.abortController?.signal
        });

        task.uploadedChunks = [...task.uploadedChunks, chunkIndex];
        this.updateChunkProgress(task, totalChunks);
        this.syncToStore(task);
        return;
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        attempts++;
        if (attempts >= this.MAX_CHUNK_RETRY) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }
  }

  /** 更新分片上传进度 */
  private updateChunkProgress(task: Api.Disk.UploadTask, totalChunks: number): void {
    const baseProgress = 30;
    const uploadRange = 60;
    const chunkProgress = task.uploadedChunks.length / totalChunks;
    task.progress = Math.round(baseProgress + chunkProgress * uploadRange);
    task.transferredSize = Math.round(task.fileSize * chunkProgress);
    task.chunkProgress = `${task.uploadedChunks.length}/${totalChunks}`;
  }

  /** 合并分片（含重试） */
  private async mergeChunks(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'merging';
    task.progress = 95;
    this.syncToStore(task);

    let attempts = 0;
    while (attempts < this.MAX_MERGE_RETRY) {
      const { error } = await fetchMergeChunks({
        fileHash: task.fileHash,
        fileName: task.fileName,
        fileSize: task.fileSize,
        totalChunks: task.totalChunks,
        parentId: task.parentId
      });

      if (!error) return;
      attempts++;
      if (attempts >= this.MAX_MERGE_RETRY) throw new Error('合并分片失败');
    }
  }

  /** 整文件上传（小文件） */
  private async uploadWhole(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const axiosInstance = createUploadAxios();
    const formData = new FormData();
    formData.append('file', task.file);
    formData.append('parentId', String(task.parentId));

    this.initSpeedTracker(taskId);

    await axiosInstance.post('/disk/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: task.abortController?.signal,
      onUploadProgress: (event) => {
        if (!event.total) return;
        task.progress = Math.round(30 + (event.loaded / event.total) * 65);
        task.transferredSize = event.loaded;
        this.updateSpeed(taskId, event.loaded, task.fileSize);
        this.syncToStore(task);
      }
    });
  }

  /** 完成任务，释放并发槽位 */
  private finishTask(taskId: string): void {
    this.activePool.delete(taskId);
    this.speedTrackers.delete(taskId);
    this.schedule();
  }

  /** 同步任务状态到 disk store */
  private syncToStore(task: Api.Disk.UploadTask): void {
    const store = this.getStore();
    const existing = store.transferList.find(item => item.transferId === task.taskId);

    const transferItem: Api.Disk.TransferItem = {
      transferId: task.taskId,
      fileName: task.fileName,
      fileType: task.fileType,
      transferType: 'upload',
      status: task.status,
      progress: task.progress,
      transferredSize: task.transferredSize,
      totalSize: task.fileSize,
      speed: task.speed,
      remainingTime: task.remainingTime,
      chunkProgress: task.totalChunks > 1 && task.uploadedChunks.length > 0
        ? `${task.uploadedChunks.length}/${task.totalChunks}`
        : undefined,
      error: task.error
    };

    if (existing) {
      store.updateTransferItem(task.taskId, transferItem);
    } else {
      store.addTransferItem(transferItem);
    }
  }

  /** 初始化速度追踪器 */
  private initSpeedTracker(taskId: string): void {
    this.speedTrackers.set(taskId, { lastTime: Date.now(), lastBytes: 0 });
  }

  /** 更新上传速度和预估剩余时间 */
  private updateSpeed(taskId: string, currentBytes: number, totalBytes: number): void {
    const tracker = this.speedTrackers.get(taskId);
    if (!tracker) return;

    const now = Date.now();
    const elapsed = (now - tracker.lastTime) / 1000;
    if (elapsed < 0.5) return;

    const task = this.tasks.get(taskId);
    if (!task) return;

    const bytesDelta = currentBytes - tracker.lastBytes;
    task.speed = Math.round(bytesDelta / elapsed);

    const remaining = totalBytes - currentBytes;
    task.remainingTime = task.speed > 0 ? Math.round(remaining / task.speed) : 0;

    tracker.lastTime = now;
    tracker.lastBytes = currentBytes;
  }
}
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/business/upload/uploader-engine.ts
git commit -m "feat: implement upload engine with queue, concurrency and chunking"
```

---

### Task 7: 创建 use-uploader 组合式函数

**Files:**
- Create: `src/hooks/business/upload/use-uploader.ts`

- [ ] **Step 1: 实现 use-uploader composable（单例模式）**

创建 `src/hooks/business/upload/use-uploader.ts`：

```typescript
import { useDiskStore } from '@/store/modules/disk';
import { UploaderEngine } from './uploader-engine';

let engineInstance: UploaderEngine | null = null;

function getEngine(): UploaderEngine {
  if (!engineInstance) {
    engineInstance = new UploaderEngine({ maxConcurrent: 3 });
  }
  return engineInstance;
}

/** 上传组合式函数（全局单例） */
export function useUploader() {
  const engine = getEngine();
  const diskStore = useDiskStore();

  /** 上传文件 */
  function upload(files: File[], parentId?: number) {
    const targetParentId = parentId ?? diskStore.currentParentId ?? 0;
    for (const file of files) {
      engine.addTask(file, targetParentId);
    }
  }

  /** 通过文件选择对话框上传 */
  function triggerFile(parentId?: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        upload(Array.from(files), parentId);
      }
    };
    input.click();
  }

  /** 通过文件夹选择对话框上传 */
  function triggerFolder(parentId?: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        upload(Array.from(files), parentId);
      }
    };
    input.click();
  }

  function pause(taskId: string) {
    engine.pause(taskId);
  }

  function resume(taskId: string) {
    engine.resume(taskId);
  }

  function cancel(taskId: string) {
    engine.cancel(taskId);
  }

  function retry(taskId: string) {
    engine.retry(taskId);
  }

  function pauseAll() {
    engine.pauseAll();
  }

  function resumeAll() {
    engine.resumeAll();
  }

  return {
    upload,
    triggerFile,
    triggerFolder,
    pause,
    resume,
    cancel,
    retry,
    pauseAll,
    resumeAll
  };
}
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/business/upload/use-uploader.ts
git commit -m "feat: add use-uploader composable with singleton engine"
```

---

### Task 8: 创建全局拖拽上传组件

**Files:**
- Create: `src/components/custom/upload-trigger.vue`

- [ ] **Step 1: 实现全局拖拽上传触发器**

创建 `src/components/custom/upload-trigger.vue`：

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useUploader } from '@/hooks/business/upload/use-uploader';

defineOptions({
  name: 'UploadTrigger'
});

const { upload } = useUploader();

const isDragging = ref(false);
let dragCounter = 0;

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  if (!e.dataTransfer?.types.includes('Files')) return;
  dragCounter++;
  isDragging.value = true;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isDragging.value = false;
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragCounter = 0;
  isDragging.value = false;

  if (!e.dataTransfer?.files.length) return;

  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

  upload(Array.from(e.dataTransfer.files));
}

onMounted(() => {
  document.addEventListener('dragenter', handleDragEnter);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('drop', handleDrop);
});

onUnmounted(() => {
  document.removeEventListener('dragenter', handleDragEnter);
  document.removeEventListener('dragover', handleDragOver);
  document.removeEventListener('dragleave', handleDragLeave);
  document.removeEventListener('drop', handleDrop);
});
</script>

<template>
  <Transition name="upload-overlay">
    <div
      v-if="isDragging"
      class="fixed inset-0 z-9999 flex items-center justify-center bg-[var(--primary-color)]/8 backdrop-blur-4px"
    >
      <div class="flex flex-col items-center gap-12px">
        <SvgIcon icon="material-symbols:cloud-upload-outline" class="text-64px text-[var(--primary-color)]" />
        <span class="text-18px font-500 text-[var(--primary-color)]">释放文件以上传到网盘</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.upload-overlay-enter-active {
  transition: all 0.2s ease-out;
}
.upload-overlay-leave-active {
  transition: all 0.15s ease-in;
}
.upload-overlay-enter-from,
.upload-overlay-leave-to {
  opacity: 0;
}
</style>
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/components/custom/upload-trigger.vue
git commit -m "feat: add global drag-drop upload trigger component"
```

---

### Task 9: 注册到全局布局

**Files:**
- Modify: `src/layouts/base-layout/index.vue`

- [ ] **Step 1: 在 base layout 中添加 UploadTrigger 组件**

在 `src/layouts/base-layout/index.vue` 的 `<script setup>` 中添加 import：

```typescript
import UploadTrigger from '@/components/custom/upload-trigger.vue';
```

在 `<template>` 中，在 `<ThemeDrawer />` 后面添加：

```vue
<UploadTrigger />
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/layouts/base-layout/index.vue
git commit -m "feat: register global upload trigger in base layout"
```

---

### Task 10: 改造工具栏上传按钮

**Files:**
- Modify: `src/views/disk/modules/toolbar.vue`

- [ ] **Step 1: 引入 use-uploader 并替换上传处理**

在 toolbar.vue 的 `<script setup>` 中：

1. 添加 import：
```typescript
import { useUploader } from '@/hooks/business/upload/use-uploader';
```

2. 在 setup 中添加：
```typescript
const { triggerFile, triggerFolder } = useUploader();
```

3. 找到上传文件和上传文件夹的事件处理，替换为调用 `use-uploader` 的方法。上传按钮的 click handler 改为：

```typescript
function handleUploadFile() {
  triggerFile();
}

function handleUploadFolder() {
  triggerFolder();
}
```

4. 将上传按钮改为 NDropdown，选项包含"上传文件"和"上传文件夹"：

如果当前上传按钮是简单的 NButton，改为下拉菜单式：
```vue
<NDropdown
  :options="uploadOptions"
  @select="handleUploadSelect"
>
  <NButton type="primary" size="small">
    <template #icon>
      <SvgIcon icon="material-symbols:upload" class="text-icon" />
    </template>
    {{ $t('page.disk.upload') }}
    <NBadge v-if="activeTransferCount > 0" :value="activeTransferCount" :max="99" class="ml-4px" />
  </NButton>
</NDropdown>
```

添加对应的选项和处理函数：
```typescript
const uploadOptions: DropdownOption[] = [
  { label: '上传文件', key: 'file' },
  { label: '上传文件夹', key: 'folder' }
];

function handleUploadSelect(key: string) {
  if (key === 'file') {
    triggerFile();
  } else if (key === 'folder') {
    triggerFolder();
  }
}
```

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 验证 lint**

```bash
cd /home/devops-admin/frontend && pnpm lint
```

- [ ] **Step 4: 提交**

```bash
git add src/views/disk/modules/toolbar.vue
git commit -m "feat: integrate upload engine into disk toolbar"
```

---

### Task 11: 改造网盘首页上传事件处理

**Files:**
- Modify: `src/views/disk/index.vue`

- [ ] **Step 1: 简化上传事件处理**

在 `src/views/disk/index.vue` 中，找到 toolbar 的 `@upload-file` 和 `@upload-folder` 事件处理。

由于 toolbar 现在直接调用 `use-uploader`，这些事件处理可以简化为空操作或完全移除（如果 toolbar 不再 emit 这些事件）。

如果 toolbar 仍然 emit 这些事件，保留空的 handler 或移除 emit 定义和 handler。

- [ ] **Step 2: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/views/disk/index.vue
git commit -m "refactor: simplify disk page upload event handling"
```

---

### Task 12: 增强传输面板

**Files:**
- Modify: `src/views/disk/modules/transfer-panel.vue`

- [ ] **Step 1: 引入 use-uploader**

在 `<script setup>` 中添加：
```typescript
import { useUploader } from '@/hooks/business/upload/use-uploader';

const { pause, resume, cancel, retry, pauseAll, resumeAll } = useUploader();
```

- [ ] **Step 2: 扩展状态颜色映射**

替换现有的 `getStatusColor` 函数：

```typescript
function getStatusColor(status: Api.Disk.TransferItem['status']) {
  const map: Record<string, string> = {
    pending: '#999',
    hashing: '#f0a020',
    checking: '#f0a020',
    uploading: 'var(--primary-color)',
    transferring: 'var(--primary-color)',
    merging: 'var(--primary-color)',
    completed: 'var(--n-success-color)',
    failed: 'var(--n-error-color)',
    paused: '#f0a020'
  };
  return map[status] || 'var(--primary-color)';
}
```

- [ ] **Step 3: 添加操作按钮**

在列表视图中，将传输行（transfer-row）的操作区域改为包含暂停/继续/重试/取消按钮。

替换现有取消按钮区域，改为根据状态渲染不同按钮：

```vue
<div class="flex items-center gap-4px">
  <button
    v-if="item.status === 'uploading' || item.status === 'hashing' || item.status === 'checking' || item.status === 'merging'"
    class="action-btn text-amber-500"
    title="暂停"
    @click="pause(item.transferId)"
  >
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  </button>
  <button
    v-if="item.status === 'paused'"
    class="action-btn text-[var(--primary-color)]"
    title="继续"
    @click="resume(item.transferId)"
  >
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  </button>
  <button
    v-if="item.status === 'failed'"
    class="action-btn text-[var(--primary-color)]"
    title="重试"
    @click="retry(item.transferId)"
  >
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  </button>
  <button
    v-if="item.status !== 'completed'"
    class="cancel-btn"
    title="取消"
    @click="cancel(item.transferId)"
  >
    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
</div>
```

- [ ] **Step 4: 增强进度信息显示**

替换速度/剩余时间的显示区域，增加已上传大小和分片进度：

```vue
<div v-if="item.status === 'uploading' || item.status === 'transferring'" class="flex justify-between text-10px dark:text-white/35 text-gray-400 mt-3px tabular-nums">
  <span>{{ formatFileSize(item.transferredSize) }} / {{ formatFileSize(item.totalSize) }}</span>
  <span v-if="item.chunkProgress">{{ item.chunkProgress }} 片</span>
  <span>{{ formatFileSize(item.speed) }}/s · {{ item.remainingTime }}s</span>
</div>
<div v-if="item.status === 'hashing'" class="text-10px dark:text-white/35 text-gray-400 mt-3px">
  计算文件特征中...
</div>
<div v-if="item.status === 'checking'" class="text-10px dark:text-white/35 text-gray-400 mt-3px">
  检测秒传...
</div>
<div v-if="item.status === 'merging'" class="text-10px dark:text-white/35 text-gray-400 mt-3px">
  合并分片中...
</div>
```

- [ ] **Step 5: 添加底部操作栏**

在 transfer-scroll 后面、panel-card 关闭前，添加底部操作栏：

```vue
<div v-if="activeTransfers.length > 1" class="flex justify-between items-center px-12px py-8px border-t-1px border-t-solid border-[var(--primary-color)]/10">
  <span class="text-11px dark:text-white/40 text-gray-400">{{ activeCount }} 个任务</span>
  <div class="flex gap-8px">
    <button class="text-11px text-[var(--primary-color)] hover:underline" @click="pauseAll">全部暂停</button>
    <button class="text-11px text-[var(--primary-color)] hover:underline" @click="resumeAll">全部继续</button>
  </div>
</div>
```

- [ ] **Step 6: 验证 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

- [ ] **Step 7: 验证 lint**

```bash
cd /home/devops-admin/frontend && pnpm lint
```

- [ ] **Step 8: 提交**

```bash
git add src/views/disk/modules/transfer-panel.vue
git commit -m "feat: enhance transfer panel with pause/resume/retry controls"
```

---

### Task 13: 最终验证

- [ ] **Step 1: 全量 typecheck**

```bash
cd /home/devops-admin/frontend && pnpm typecheck
```

预期：PASS

- [ ] **Step 2: 全量 lint**

```bash
cd /home/devops-admin/frontend && pnpm lint
```

预期：PASS（或仅有 pre-existing warnings）

- [ ] **Step 3: 启动开发服务器验证**

```bash
cd /home/devops-admin/frontend && pnpm dev
```

手动验证清单：
- [ ] 网盘页面正常加载
- [ ] 工具栏上传按钮显示下拉菜单
- [ ] 拖拽文件到页面出现全屏遮罩
- [ ] 释放文件后任务出现在传输面板
- [ ] 传输面板显示暂停/继续/取消按钮
- [ ] 球体视图显示新状态颜色
