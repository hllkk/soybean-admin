export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const formatDate = (timestamp?: number | string) => {
  if (!timestamp) return '未知';
  return new Date(timestamp).toLocaleString();
};

export function isPath(path: string) {
  /** 检测路径中的斜杠字符 */
  return /[/\\]/.test(path);
}

export function encodeIfNeeded(str: string) {
  if (isEncoded(str)) {
    return str;
  }
  return encodeURIComponent(str);
}

function isEncoded(str: string) {
  return /%[0-9A-Fa-f]{2}/.test(str);
}
