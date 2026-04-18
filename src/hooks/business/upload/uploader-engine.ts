import axios, { isCancel } from 'axios';
import { getToken } from '@/store/modules/auth/shared';
import { getServiceBaseURL } from '@/utils/service';
import { fetchMergeChunks, fetchUploadFile } from '@/service/api/disk/file';
import { useDiskStore } from '@/store/modules/disk';
import { computeFileHash, checkInstantUpload } from './instant-check';
import {
  getChunkSize,
  needsChunking,
  getTotalChunks,
  sliceChunk,
  getFileExtension
} from './chunk-manager';

/** Chunk retry limit */
const CHUNK_MAX_RETRIES = 3;

/** Merge retry limit */
const MERGE_MAX_RETRIES = 2;

/** Per-file chunk concurrency */
const CHUNK_CONCURRENCY = 3;

/** Retry base delay in ms (exponential backoff: 1s, 2s, 4s) */
const RETRY_BASE_DELAY = 1000;

/** Speed tracking window in ms */
const SPEED_WINDOW = 1000;

/** Unique ID counter */
let idCounter = 0;

/** Generate a unique task ID */
function generateId(): string {
  idCounter += 1;
  return `upload_${Date.now()}_${idCounter}`;
}

/** Lazily resolve the disk store (avoids circular init) */
function getStore() {
  return useDiskStore();
}

/** Determine the base URL for raw axios chunk uploads */
function resolveBaseURL(): string {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return baseURL;
}

/** Create a raw axios instance for chunk uploads (full control over signal / headers) */
function createUploadAxios() {
  return axios.create({
    baseURL: resolveBaseURL(),
    timeout: 30000
  });
}

/** Sleep helper for retry backoff */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * UploaderEngine
 *
 * Manages the upload queue, file-level concurrency, chunked uploads with retry,
 * state machine transitions, and syncs state to the Pinia disk store.
 */
export class UploaderEngine {
  /** Maximum number of files uploading concurrently */
  private maxConcurrent: number;

  /** Pending task queue */
  private queue: Api.Disk.UploadTask[] = [];

  /** Currently active upload tasks */
  private activePool: Set<string> = new Set();

  /** Task map for fast lookup */
  private taskMap: Map<string, Api.Disk.UploadTask> = new Map();

  /** Speed tracking state per task */
  private speedTrackers: Map<
    string,
    {
      lastTime: number;
      lastTransferred: number;
      samples: { time: number; bytes: number }[];
    }
  > = new Map();

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Add files to the upload queue */
  addFiles(files: File[], parentId: number): string[] {
    const ids: string[] = [];

    for (const file of files) {
      const task = this.createTask(file, parentId);
      this.taskMap.set(task.taskId, task);
      this.queue.push(task);
      ids.push(task.taskId);
      this.syncToStore(task);
    }

    this.schedule();
    return ids;
  }

  /** Pause a specific task */
  pause(taskId: string): void {
    const task = this.taskMap.get(taskId);
    if (!task) return;
    if (task.status === 'completed' || task.status === 'paused') return;

    // Abort any in-flight request
    task.abortController?.abort();
    task.abortController = undefined;

    task.status = 'paused';
    task.speed = 0;
    this.syncToStore(task);
  }

  /** Pause all active tasks */
  pauseAll(): void {
    for (const task of this.taskMap.values()) {
      if (task.status === 'uploading' || task.status === 'hashing' || task.status === 'checking' || task.status === 'merging') {
        this.pause(task.taskId);
      }
    }
  }

  /** Resume a paused task */
  resume(taskId: string): void {
    const task = this.taskMap.get(taskId);
    if (!task || task.status !== 'paused') return;

    task.status = 'pending';
    task.error = undefined;
    this.syncToStore(task);

    // Re-enter the queue if not already there and not in active pool
    if (!this.queue.some(t => t.taskId === taskId) && !this.activePool.has(taskId)) {
      this.queue.push(task);
    }

    this.schedule();
  }

  /** Cancel and remove a task entirely */
  cancel(taskId: string): void {
    const task = this.taskMap.get(taskId);
    if (!task) return;

    task.abortController?.abort();
    this.taskMap.delete(task.taskId);
    this.queue = this.queue.filter(t => t.taskId !== taskId);
    this.activePool.delete(task.taskId);
    this.speedTrackers.delete(task.taskId);

    getStore().removeTransferItem(task.taskId);
  }

  /** Retry a failed task */
  retry(taskId: string): void {
    const task = this.taskMap.get(taskId);
    if (!task || task.status !== 'failed') return;

    task.status = 'pending';
    task.error = undefined;
    task.retryCount = 0;
    this.syncToStore(task);

    if (!this.queue.some(t => t.taskId === taskId)) {
      this.queue.push(task);
    }

    this.schedule();
  }

  /** Get a task by ID */
  getTask(taskId: string): Api.Disk.UploadTask | undefined {
    return this.taskMap.get(taskId);
  }

  /** Get all tasks */
  getAllTasks(): Api.Disk.UploadTask[] {
    return Array.from(this.taskMap.values());
  }

  /** Clear completed tasks */
  clearCompleted(): void {
    for (const task of this.taskMap.values()) {
      if (task.status === 'completed') {
        this.taskMap.delete(task.taskId);
        getStore().removeTransferItem(task.taskId);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Scheduling
  // ---------------------------------------------------------------------------

  /** Schedule tasks from the queue up to maxConcurrent */
  private schedule(): void {
    while (this.activePool.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!;
      if (task.status !== 'pending') continue;

      this.activePool.add(task.taskId);
      this.processTask(task).catch(() => {
        // processTask handles its own errors
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Task lifecycle
  // ---------------------------------------------------------------------------

  /** Create a new upload task from a file */
  private createTask(file: File, parentId: number): Api.Disk.UploadTask {
    return {
      taskId: generateId(),
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
      totalChunks: 1,
      retryCount: 0,
      abortController: undefined,
      error: undefined
    };
  }

  /** Main task processing state machine */
  private async processTask(task: Api.Disk.UploadTask): Promise<void> {
    try {
      // Phase 1: Hash
      await this.hashPhase(task);

      // Phase 2: Instant check
      const checkResult = await this.checkPhase(task);

      if (checkResult.exists) {
        // File already exists on server (instant upload)
        task.status = 'completed';
        task.progress = 100;
        task.transferredSize = task.fileSize;
        this.syncToStore(task);
        this.finishTask(task.taskId);
        return;
      }

      // Phase 3: Upload (whole or chunked)
      if (needsChunking(task.fileSize)) {
        // Merge previously uploaded chunks from instant-check response
        if (checkResult.uploadedChunks && checkResult.uploadedChunks.length > 0) {
          task.uploadedChunks = [...checkResult.uploadedChunks];
          this.recalcChunkProgress(task);
        }

        await this.uploadChunkedPhase(task);

        // Phase 4: Merge
        await this.mergePhase(task);
      } else {
        await this.uploadWholePhase(task);
      }

      task.status = 'completed';
      task.progress = 100;
      task.transferredSize = task.fileSize;
      task.speed = 0;
      task.remainingTime = 0;
      this.syncToStore(task);
      this.finishTask(task.taskId);
    } catch (error: unknown) {
      // Ignore abort errors from pause/cancel
      if (isCancel(error)) {
        return;
      }

      const message = error instanceof Error ? error.message : '上传失败';
      task.status = 'failed';
      task.error = message;
      task.speed = 0;
      this.syncToStore(task);
      this.finishTask(task.taskId);
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: Hash
  // ---------------------------------------------------------------------------

  private async hashPhase(task: Api.Disk.UploadTask): Promise<void> {
    task.status = 'hashing';
    task.progress = 0;
    this.syncToStore(task);

    const abortController = new AbortController();
    task.abortController = abortController;

    const fileHash = await computeFileHash(task.file, (progress: number) => {
      if (abortController.signal.aborted) return;
      task.progress = Math.round(progress * 0.3); // hashing = 0-30%
      this.syncToStore(task);
    });

    if (abortController.signal.aborted) {
      throw new Error('Aborted');
    }

    task.fileHash = fileHash;
  }

  // ---------------------------------------------------------------------------
  // Phase: Instant check
  // ---------------------------------------------------------------------------

  private async checkPhase(task: Api.Disk.UploadTask): Promise<Api.Disk.FileCheckResponse> {
    task.status = 'checking';
    task.progress = 30;
    this.syncToStore(task);

    return checkInstantUpload(task.fileHash, task.fileName, task.fileSize, task.parentId);
  }

  // ---------------------------------------------------------------------------
  // Phase: Whole file upload (small files)
  // ---------------------------------------------------------------------------

  private async uploadWholePhase(task: Api.Disk.UploadTask): Promise<void> {
    task.status = 'uploading';
    this.syncToStore(task);

    const abortController = new AbortController();
    task.abortController = abortController;

    this.initSpeedTracker(task.taskId);

    const { error } = await fetchUploadFile({
      file: task.file,
      parentId: task.parentId
    });

    if (abortController.signal.aborted) {
      throw new Error('Aborted');
    }

    if (error) {
      throw new Error(error.message || '上传失败');
    }

    task.transferredSize = task.fileSize;
    task.progress = 100;
    this.updateSpeed(task, task.transferredSize);
    this.syncToStore(task);
  }

  // ---------------------------------------------------------------------------
  // Phase: Chunked upload
  // ---------------------------------------------------------------------------

  private async uploadChunkedPhase(task: Api.Disk.UploadTask): Promise<void> {
    task.status = 'uploading';
    this.syncToStore(task);

    const abortController = new AbortController();
    task.abortController = abortController;

    const chunkSize = getChunkSize(task.fileSize);
    task.totalChunks = getTotalChunks(task.fileSize, chunkSize);

    this.initSpeedTracker(task.taskId);

    // Determine which chunks still need uploading
    const pendingChunks: number[] = [];
    for (let i = 0; i < task.totalChunks; i += 1) {
      if (!task.uploadedChunks.includes(i)) {
        pendingChunks.push(i);
      }
    }

    // Upload chunks with concurrency limit of CHUNK_CONCURRENCY
    await this.uploadChunksWithConcurrency(task, pendingChunks, chunkSize, abortController.signal);
  }

  /** Upload pending chunks with bounded concurrency */
  private async uploadChunksWithConcurrency(
    task: Api.Disk.UploadTask,
    chunkIndices: number[],
    chunkSize: number,
    signal: AbortSignal
  ): Promise<void> {
    const executing: Promise<void>[] = [];
    let idx = 0;

    const uploadNext = async (): Promise<void> => {
      while (idx < chunkIndices.length) {
        if (signal.aborted) return;

        const currentIndex = idx;
        idx += 1;
        const chunkIndex = chunkIndices[currentIndex];

        await this.uploadSingleChunk(task, chunkIndex, chunkSize, signal);
      }
    };

    const concurrency = Math.min(CHUNK_CONCURRENCY, chunkIndices.length);
    for (let i = 0; i < concurrency; i += 1) {
      executing.push(uploadNext());
    }

    await Promise.all(executing);
  }

  /** Upload a single chunk with retry logic */
  private async uploadSingleChunk(
    task: Api.Disk.UploadTask,
    chunkIndex: number,
    chunkSize: number,
    signal: AbortSignal
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= CHUNK_MAX_RETRIES; attempt += 1) {
      if (signal.aborted) return;

      try {
        const chunk = sliceChunk(task.file, chunkIndex, chunkSize);
        const token = getToken();

        const axiosInstance = createUploadAxios();
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('fileHash', task.fileHash);
        formData.append('chunkIndex', String(chunkIndex));
        formData.append('totalChunks', String(task.totalChunks));
        formData.append('fileName', task.fileName);
        formData.append('parentId', String(task.parentId));

        await axiosInstance.post('/disk/file/chunk', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: token } : {})
          },
          signal
        });

        // Success: record the uploaded chunk
        task.uploadedChunks = [...task.uploadedChunks, chunkIndex];
        this.recalcChunkProgress(task);
        this.updateSpeed(task, task.transferredSize);
        this.syncToStore(task);
        return;
      } catch (error: unknown) {
        if (isCancel(error) || signal.aborted) return;

        lastError = error instanceof Error ? error : new Error('分片上传失败');

        if (attempt < CHUNK_MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * 2 ** attempt; // 1s, 2s, 4s
          await sleep(delay);
        }
      }
    }

    throw lastError ?? new Error(`分片 ${chunkIndex} 上传失败`);
  }

  // ---------------------------------------------------------------------------
  // Phase: Merge
  // ---------------------------------------------------------------------------

  private async mergePhase(task: Api.Disk.UploadTask): Promise<void> {
    task.status = 'merging';
    this.syncToStore(task);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MERGE_MAX_RETRIES; attempt += 1) {
      try {
        const { error } = await fetchMergeChunks({
          fileHash: task.fileHash,
          fileName: task.fileName,
          fileSize: task.fileSize,
          totalChunks: task.totalChunks,
          parentId: task.parentId
        });

        if (error) {
          throw new Error(error.message || '合并分片失败');
        }

        return;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error('合并分片失败');

        if (attempt < MERGE_MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * 2 ** attempt;
          await sleep(delay);
        }
      }
    }

    throw lastError ?? new Error('合并分片失败');
  }

  // ---------------------------------------------------------------------------
  // Speed tracking
  // ---------------------------------------------------------------------------

  private initSpeedTracker(taskId: string): void {
    this.speedTrackers.set(taskId, {
      lastTime: Date.now(),
      lastTransferred: 0,
      samples: []
    });
  }

  /** Update speed and remaining time for a task */
  private updateSpeed(task: Api.Disk.UploadTask, currentTransferred: number): void {
    const tracker = this.speedTrackers.get(task.taskId);
    if (!tracker) return;

    const now = Date.now();
    const elapsed = now - tracker.lastTime;

    if (elapsed > 0) {
      const bytesDelta = currentTransferred - tracker.lastTransferred;
      tracker.samples.push({ time: elapsed, bytes: bytesDelta });

      // Keep only the last few samples within the speed window
      let windowTotal = 0;
      const recentSamples: { time: number; bytes: number }[] = [];
      for (let i = tracker.samples.length - 1; i >= 0; i -= 1) {
        windowTotal += tracker.samples[i].time;
        recentSamples.unshift(tracker.samples[i]);
        if (windowTotal >= SPEED_WINDOW) break;
      }
      tracker.samples = recentSamples;

      // Calculate average speed from samples
      const totalBytes = tracker.samples.reduce((sum, s) => sum + s.bytes, 0);
      const totalTime = tracker.samples.reduce((sum, s) => sum + s.time, 0);

      if (totalTime > 0) {
        task.speed = Math.round((totalBytes / totalTime) * 1000); // bytes/sec
        const remaining = task.fileSize - currentTransferred;
        task.remainingTime = task.speed > 0 ? Math.round(remaining / task.speed) : 0;
      }
    }

    tracker.lastTime = now;
    tracker.lastTransferred = currentTransferred;
  }

  // ---------------------------------------------------------------------------
  // Progress helpers
  // ---------------------------------------------------------------------------

  /** Recalculate progress based on uploaded chunks (hash=30%, chunks=70%) */
  private recalcChunkProgress(task: Api.Disk.UploadTask): void {
    if (task.totalChunks === 0) return;
    const uploadedCount = task.uploadedChunks.length;
    task.transferredSize = Math.round((uploadedCount / task.totalChunks) * task.fileSize);
    const chunkPercent = Math.round((uploadedCount / task.totalChunks) * 70);
    task.progress = 30 + chunkPercent; // 30% from hashing/checking, 70% from chunks
  }

  // ---------------------------------------------------------------------------
  // Store sync
  // ---------------------------------------------------------------------------

  /** Map UploadTask to TransferItem and sync to disk store */
  private syncToStore(task: Api.Disk.UploadTask): void {
    const store = getStore();

    const existing = store.transferList.find(item => item.transferId === task.taskId);

    const transferItem: Api.Disk.TransferItem = {
      transferId: task.taskId,
      fileName: task.fileName,
      fileType: task.fileType,
      transferType: 'upload',
      status: task.status === 'uploading' ? 'transferring' : task.status,
      progress: task.progress,
      transferredSize: task.transferredSize,
      totalSize: task.fileSize,
      speed: task.speed,
      remainingTime: task.remainingTime,
      chunkProgress:
        task.totalChunks > 1
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

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /** Release an active slot and trigger scheduling */
  private finishTask(taskId: string): void {
    this.activePool.delete(taskId);
    this.speedTrackers.delete(taskId);
    const task = this.taskMap.get(taskId);
    if (task) {
      task.abortController = undefined;
    }
    this.schedule();
  }
}
