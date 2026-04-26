/**
 * Disk file list API
 *
 * 导出文件列表和内容更新相关接口
 */
import { request } from '@/service/request';
import { useAuthStore } from '@/store/modules/auth';
import { useDiskStore } from '@/store/modules/disk';

/** 获取文件列表 */
export function fetchGetFileList(params?: {
  userId?: number;
  currentDirectory?: string;
  queryType?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const diskStore = useDiskStore();
  const userId = Number(useAuthStore().userInfo.userId);

  const currentDirectory = params?.currentDirectory
    ?? (diskStore.currentPath.length > 0
      ? `/${diskStore.currentPath.map(item => item.fileName).join('/')}`
      : '/');

  const queryType = params?.queryType ?? '';

  return request<{
    list: Array<{
      id: number;
      name: string;
      size: number;
      isDir: boolean;
      extendName?: string;
      contentType?: string;
      filePath: string;
      createTime: string;
      updateTime: string;
      mediaCover?: boolean;
      showCover?: boolean;
      music?: Api.Disk.MusicInfo;
      video?: Api.Disk.VideoInfo;
    }>;
    total: number;
  }>({
    url: '/file-meta/list',
    method: 'get',
    params: {
      userId: params?.userId ?? userId,
      currentDirectory,
      queryType,
      keyword: params?.keyword ?? '',
      page: params?.page ?? 1,
      pageSize: params?.size ?? 50,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder
    }
  });
}

/** 更新文件内容 */
export function fetchUpdateFileContent(data: { fileId: string | number; content: string }) {
  // 确保 fileId 为数字类型（后端期望 int64）
  const fileIdNum = typeof data.fileId === 'string' ? parseInt(data.fileId, 10) : data.fileId;
  return request<boolean>({
    url: '/file-meta/updateContent',
    method: 'post',
    data: { fileId: fileIdNum, content: data.content }
  });
}