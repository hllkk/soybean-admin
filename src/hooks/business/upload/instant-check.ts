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
