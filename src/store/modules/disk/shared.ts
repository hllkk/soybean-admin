import { fetchIsAllowDownload, fetchIsAllowPackageDownload } from '@/service/api/disk/list';
import { useDownload } from '@/hooks/business/download';

const { download } = useDownload();
// const backendUrl = '/dl';

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

// function isFilePath(str: string) {
//   // 匹配 test/r2/file.txt
//   // eslint-disable-next-line unicorn/escape-case, no-useless-escape
//   const filePathRegex = /^[\w\-\/]+[\u4e00-\u9fa5\w\-]+\.\w+$/;
//   return filePathRegex.test(str);
// }

// 构建下载Url
// eslint-disable-next-line max-params
// function previewUrl(
//   userId: CommonType.IdType,
//   userName: string,
//   file: Api.Disk.FileItem,
//   token: string,
//   shareToken?: string,
//   serverUrl?: string,
//   joinToken?: string
// ) {
//   const baseUrl = serverUrl || backendUrl;
//   let fileUrl = `${baseUrl}/file/${userName}${encodeURIComponent(file.filePath || '')}${encodeURIComponent(file.name)}`;
//   fileUrl = fileUrl.replaceAll(/%5C|%2F/g, '/');

//   if (file.userId !== userId && token && !shareToken) {
//     return `${baseUrl}/pre-file/${file.id}/${encodeURIComponent(file.name)}`;
//   }

//   if (token) {
//     if (joinToken) {
//       return `${fileUrl}?token=${token}&name=${userName}`;
//     }
//     return `${fileUrl}`;
//   }

//   if (shareToken) {
//     if (isFilePath(file.id)) {
//       return `${fileUrl}?share-token=${shareToken}`;
//     }
//     return `${baseUrl}/share-file/${file.id}/${shareToken}/${encodeURIComponent(file.name)}`;
//   }

//   if (isFilePath(file.id)) {
//     return fileUrl;
//   }
//   return `${baseUrl}/share-file/${file.id}/${encodeURIComponent(file.name)}`;
// }

export async function singleDownload(userId: CommonType.IdType, file: Api.Disk.FileItem) {
  // 检查下载权限
  const { data: downloadInfo, error } = await fetchIsAllowDownload({ fileIds: [file.id], userId });
  if (!error) {
    const { allowDownload, isRedirect, redirectUrl, downloadUrl } = downloadInfo;
    if (!allowDownload) {
      throw new Error('文件不允许下载');
    }
    if (isRedirect && redirectUrl) {
      download('GET', redirectUrl, {}, file.name);
      return;
    }

    const url = `${downloadUrl}?o=download`;
    download('GET', url, {}, file.name);
  }
}

export async function packageDownload(userId: CommonType.IdType, fileIds: CommonType.IdType[]) {
  // 检查下载权限
  const { data: packageDownloadInfo, error } = await fetchIsAllowPackageDownload({ fileIds, userId });
  if (!error) {
    const { allowDownload, downloadUrl } = packageDownloadInfo;
    if (!allowDownload) {
      throw new Error('不支持打包下载');
    }
    const url = `${downloadUrl}?o=download`;
    download('GET', url, {}, `package.zip`);
  }
}
