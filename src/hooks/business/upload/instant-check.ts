import SparkMD5 from 'spark-md5';

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

    reader.addEventListener('load', (e) => {
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
    });

    reader.addEventListener('error', () => reject(new Error('文件读取失败')));

    function loadNext() {
      const start = currentChunk * HASH_CHUNK_SIZE;
      const end = Math.min(start + HASH_CHUNK_SIZE, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}
