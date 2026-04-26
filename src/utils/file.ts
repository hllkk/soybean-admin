/**
 * File utilities
 *
 * 文件相关的工具函数
 */

/**
 * Format file size to human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  // Format with appropriate decimal places
  if (i === 0) {
    return `${bytes} B`;
  }

  // Show 1 decimal place for KB and MB, 2 for larger
  const decimals = i <= 2 ? 1 : 2;
  return `${size.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format time to readable string
 *
 * @param date - Date object, ISO string, or null
 * @returns Formatted string like "2024-04-25 14:30"
 */
export function formatTime(date: Date | string | null): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format date to short format
 *
 * @param dateStr - ISO date string
 * @returns Formatted string like "04-25 14:30"
 */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);

  if (isNaN(d.getTime())) return '';

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
}

/**
 * Get file extension from filename
 *
 * @param filename - File name with extension
 * @returns Extension without dot, or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Check if file is a text file based on extension
 *
 * @param filename - File name
 * @returns True if text file
 */
export function isTextFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  const textExtensions = [
    'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'toml',
    'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
    'py', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
    'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'lua',
    'sh', 'bash', 'zsh', 'ps1', 'bat',
    'sql', 'html', 'htm', 'css', 'scss', 'less', 'sass',
    'conf', 'cfg', 'ini', 'env', 'properties',
    'log', 'dockerfile', 'gitignore', 'editorconfig',
    'svg'
  ];
  return textExtensions.includes(ext);
}