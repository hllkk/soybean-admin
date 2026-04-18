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
