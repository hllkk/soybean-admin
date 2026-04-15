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