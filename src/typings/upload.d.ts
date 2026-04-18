declare namespace Api {
  namespace Disk {
    /** 上传任务状态 */
    type UploadTaskStatus =
      | 'pending'
      | 'hashing'
      | 'checking'
      | 'uploading'
      | 'merging'
      | 'paused'
      | 'completed'
      | 'failed';

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
