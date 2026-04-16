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
 * Format date string to "MM-DD HH:mm"
 *
 * @param dateStr - ISO date string or date string
 * @returns Formatted string like "04-16 09:30"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}