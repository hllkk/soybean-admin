/**
 * 文件选择ID获取工具
 * 用于获取文件在选择操作中使用的ID
 */

/**
 * 获取文件用于选中/右键菜单操作的ID
 * - 最近访问场景：使用 recordId（访问记录ID）
 * - 其他场景：使用 fileId（文件ID）
 */
export function getSelectId(file: Api.Disk.FileItem): CommonType.IdType {
  return file.recordId ?? file.fileId;
}