import { useAuthStore } from '@/store/modules/auth';

function isFilePath(str: string) {
  // 匹配 test/r2/file.txt
  // eslint-disable-next-line unicorn/escape-case, no-useless-escape
  const filePathRegex = /^[\w\-\/]+[\u4e00-\u9fa5\w\-]+\.\w+$/;
  return filePathRegex.test(str);
}

// // LogoUrl
// function logoUrl(fileName: string) {
//   return `${window.location.origin}${import.meta.env.VITE_BASE_URL}/file/${fileName}`;
// }

// // webDAV URL
// function webDavUrl(username: string) {
//   return `${window.location.origin}/webDAV/${username}`;
// }

// // office api url
// function officeApiUrl(documentServer: string) {
//   let serverUrl = documentServer || `${window.location.origin}/office`;
//   if (!serverUrl.endsWith('/')) {
//     serverUrl += `${serverUrl}/`;
//   }
//   return `${serverUrl}web-apps/apps/api/documents/api.js`;
// }

// // office 回调基础url(末尾不带斜杠，不包含参数)
// function officeCallbackBaseUrl(callbackServer: string) {
//   return (callbackServer || '').replace(/\/$/, '') || 'https://jump.chinargb.com.cn:3000/dev-api';
// }

// // office 回调url
// function officeCallBackUrl(callbackServer: string, token: string, userName: string, fileId: string) {
//   return `${officeCallbackBaseUrl(callbackServer)}/office/callback?token=${token}&userName=${userName}&fileId=${fileId}`;
// }

// 预览文件的url
export function previewUrl(
  file: Api.Disk.FileItem,
  token?: string,
  shareToken?: string,
  serverUrl?: string,
  joinToken?: boolean
) {
  const authStore = useAuthStore();
  const baseUrl = serverUrl || import.meta.env.VITE_APP_BASE_API;
  let fileUrl = `${baseUrl}/file/${file.userId}${encodeURIComponent(file.filePath || '')}${encodeURIComponent(file.name)}`;
  fileUrl = fileUrl.replaceAll(/%5C|%2F/g, '/');

  if (file.userId !== authStore.userInfo.userId && token && !shareToken) {
    return `${baseUrl}/pre-file/${file.id}/${encodeURIComponent(file.name)}`;
  }
  if (isFilePath(file.id)) {
    return fileUrl;
  }
  if (token) {
    if (joinToken) {
      return `${fileUrl}?token=${token}&userName=${authStore.userInfo.userName}`;
    }
    return fileUrl;
  }

  if (shareToken) {
    if (isFilePath(file.id)) {
      return `${fileUrl}?shareToken=${shareToken}`;
    }
    return `${baseUrl}/share-file/${file.id}/${shareToken}/${encodeURIComponent(file.name)}`;
  }

  if (isFilePath(file.id)) {
    return fileUrl;
  }

  return `${baseUrl}/share-file/${file.id}/${encodeURIComponent(file.name)}`;
}
