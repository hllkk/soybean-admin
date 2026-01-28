import { fetchIsAllowDownload, fetchIsAllowPackageDownload } from '@/service/api/disk/list';
import { useDownload } from '@/hooks/business/download';

const { download } = useDownload();

// 预加载下载URL缓存
const preloadDownloadUrlCache = new Map<string, { url: string; filename: string; timestamp: number }>();

// 清理过期的预加载URL
function clearExpiredPreloadUrls() {
  const now = Date.now();
  const expireTime = 5 * 60 * 1000; // 5分钟过期

  for (const [key, value] of preloadDownloadUrlCache.entries()) {
    if (now - value.timestamp > expireTime) {
      preloadDownloadUrlCache.delete(key);
    }
  }
}

// 定期清理过期URL
setInterval(clearExpiredPreloadUrls, 60 * 1000); // 每分钟清理一次

export function parseFileName(inputName: string): { name: string; extension: string } {
  if (!inputName || inputName.trim() === '') {
    return { name: '新建文件', extension: 'txt' };
  }

  const trimmedName = inputName.trim();
  const lastDotIndex = trimmedName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return { name: trimmedName, extension: '' };
  }

  if (lastDotIndex === 0) {
    return { name: trimmedName, extension: '' };
  }

  const name = trimmedName.substring(0, lastDotIndex);
  const extension = trimmedName.substring(lastDotIndex + 1);

  if (extension === '') {
    return { name: trimmedName, extension: '' };
  }

  return { name, extension };
}

export function generateUniqueName(
  fileList: Api.Disk.FileItem[],
  baseName: string,
  isDir: boolean,
  extension?: string,
  excludeId?: CommonType.IdType
): string {
  const existingNames = new Set(fileList.filter(item => item.id !== excludeId).map(item => item.name));

  if (isDir) {
    if (!existingNames.has(baseName)) {
      return baseName;
    }
    let counter = 1;
    while (existingNames.has(`${baseName}(${counter})`)) {
      counter += 1;
    }
    return `${baseName}(${counter})`;
  }
  const fullName = extension ? `${baseName}.${extension}` : baseName;
  if (!existingNames.has(fullName)) {
    return baseName;
  }
  let counter = 1;
  while (existingNames.has(`${baseName}(${counter})${extension ? `.${extension}` : ''}`)) {
    counter += 1;
  }
  return `${baseName}(${counter})`;
}

export async function singleDownload(userId: CommonType.IdType, file: Api.Disk.FileItem) {
  const cacheKey = `single_${userId}_${file.id}`;

  // 检查是否有预加载的下载URL
  const cached = preloadDownloadUrlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    // 使用缓存的URL直接下载
    download('GET', cached.url, {}, cached.filename);
    return;
  }

  // 检查下载权限
  const { data: downloadInfo, error } = await fetchIsAllowDownload({ fileIds: [file.id], userId });
  if (!error) {
    const { allowDownload, isRedirect, redirectUrl, downloadUrl } = downloadInfo;
    if (!allowDownload) {
      throw new Error('文件不允许下载');
    }

    let finalUrl: string;
    let finalFilename: string;

    if (isRedirect && redirectUrl) {
      finalUrl = redirectUrl;
      finalFilename = file.name;
    } else {
      finalUrl = `${downloadUrl}?o=download`;
      finalFilename = file.name;
    }

    // 缓存下载URL
    preloadDownloadUrlCache.set(cacheKey, {
      url: finalUrl,
      filename: finalFilename,
      timestamp: Date.now()
    });

    download('GET', finalUrl, {}, finalFilename);
  }
}

export async function packageDownload(userId: CommonType.IdType, fileIds: CommonType.IdType[]) {
  const cacheKey = `package_${userId}_${fileIds.sort().join('_')}`;

  // 检查是否有预加载的下载URL
  const cached = preloadDownloadUrlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    // 使用缓存的URL直接下载
    download('GET', cached.url, {}, cached.filename);
    return;
  }

  // 检查下载权限
  const { data: packageDownloadInfo, error } = await fetchIsAllowPackageDownload({ fileIds, userId });
  if (!error) {
    const { allowDownload, downloadUrl } = packageDownloadInfo;
    if (!allowDownload) {
      throw new Error('不支持打包下载');
    }

    const finalUrl = `${downloadUrl}?o=download`;
    const finalFilename = `package_${Date.now()}.zip`;

    // 缓存下载URL
    preloadDownloadUrlCache.set(cacheKey, {
      url: finalUrl,
      filename: finalFilename,
      timestamp: Date.now()
    });

    download('GET', finalUrl, {}, finalFilename);
  }
}

// 预加载单文件下载URL
// export async function preloadSingleDownloadUrl(userId: CommonType.IdType, file: Api.Disk.FileItem) {
//   const cacheKey = `single_${userId}_${file.id}`;

//   // 检查是否已有缓存
//   const cached = preloadDownloadUrlCache.get(cacheKey);
//   if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
//     return cached.url;
//   }

//   try {
//     const { data: downloadInfo, error } = await fetchIsAllowDownload({ fileIds: [file.id], userId });
//     if (!error && downloadInfo.allowDownload) {
//       let finalUrl: string;
//       let finalFilename: string;

//       if (downloadInfo.isRedirect && downloadInfo.redirectUrl) {
//         finalUrl = downloadInfo.redirectUrl;
//         finalFilename = file.name;
//       } else {
//         finalUrl = `${downloadInfo.downloadUrl}?o=download`;
//         finalFilename = file.name;
//       }

//       // 缓存下载URL
//       preloadDownloadUrlCache.set(cacheKey, {
//         url: finalUrl,
//         filename: finalFilename,
//         timestamp: Date.now()
//       });

//       return finalUrl;
//     }
//   } catch (error) {
//     // 预加载失败不影响主流程
//     console.warn('预加载下载URL失败:', error);
//   }

//   return null;
// }

// 预加载打包下载URL
// export async function preloadPackageDownloadUrl(userId: CommonType.IdType, fileIds: CommonType.IdType[]) {
//   const cacheKey = `package_${userId}_${fileIds.sort().join('_')}`;

//   // 检查是否已有缓存
//   const cached = preloadDownloadUrlCache.get(cacheKey);
//   if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
//     return cached.url;
//   }

//   try {
//     const { data: packageDownloadInfo, error } = await fetchIsAllowPackageDownload({ fileIds, userId });
//     if (!error && packageDownloadInfo.allowDownload) {
//       const finalUrl = `${packageDownloadInfo.downloadUrl}?o=download`;
//       const finalFilename = `package_${Date.now()}.zip`;

//       // 缓存下载URL
//       preloadDownloadUrlCache.set(cacheKey, {
//         url: finalUrl,
//         filename: finalFilename,
//         timestamp: Date.now()
//       });

//       return finalUrl;
//     }
//   } catch (error) {
//     // 预加载失败不影响主流程
//     console.warn('预加载打包下载URL失败:', error);
//   }

//   return null;
// }
