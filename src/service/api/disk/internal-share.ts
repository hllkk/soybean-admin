import { request } from '@/service/request';

/** 创建内部共享 */
export function fetchCreateInternalShare(data: {
  fileId: number;
  shareType: 'user' | 'dept';
  targetIds: number[];
  permissions?: string[];
  expireDate?: string;
  remark?: string;
}) {
  return request<boolean>({
    url: '/share/internal/create',
    method: 'post',
    data
  });
}

/** 取消内部共享 */
export function fetchCancelInternalShare(fileShareId: number) {
  return request<boolean>({
    url: '/share/internal/cancel',
    method: 'post',
    data: { fileShareId }
  });
}

/** 拒绝共享 */
export function fetchRejectInternalShare(fileShareId: number) {
  return request<boolean>({
    url: '/share/internal/reject',
    method: 'put',
    data: { fileShareId }
  });
}

/** 接受共享 */
export function fetchAcceptInternalShare(fileShareId: number) {
  return request<boolean>({
    url: '/share/internal/accept',
    method: 'put',
    data: { fileShareId }
  });
}

/** 保存到我的网盘 */
export function fetchSaveToMyDrive(fileShareId: number, targetPath?: string) {
  return request<boolean>({
    url: '/share/internal/save-to-drive',
    method: 'post',
    data: { fileShareId, targetPath: targetPath || '/' }
  });
}

/** 获取我发起的共享列表 */
export function fetchGetMySharedList(params: { pageNum: number; pageSize: number }) {
  return request<{ total: number; rows: any[]; pageNum: number; pageSize: number }>({
    url: '/share/internal/my-shared',
    method: 'post',
    data: params
  });
}

/** 获取共享给我的列表 */
export function fetchGetSharedWithMeList(params: {
  pageNum: number;
  pageSize: number;
  shareType?: string;
  keyword?: string;
  contentType?: string;
  targetStatus?: string;
}) {
  return request<Api.Disk.SharedWithMeList>({
    url: '/share/internal/shared-with-me',
    method: 'post',
    data: params
  });
}

/** 获取共享文件夹内容列表 */
export function fetchGetSharedFolderContents(params: {
  fileId: number;
  path?: string;
  pageNum?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  return request<{ list: any[]; total: number; page: number; size: number }>({
    url: '/share/internal/folder',
    method: 'post',
    data: params
  }).then(res => {
    // 将后端的字段名映射为前端期望的字段名
    if (res.data) {
      const mappedList = (res.data.list || []).map(item => ({
        createBy: '',
        createTime: item.createTime || '',
        updateBy: '',
        updateTime: item.updateTime || '',
        fileId: item.id,
        fileName: item.name,
        fileType: item.isDir ? 'folder' : 'other',
        fileExtension: item.extendName,
        fileSize: item.size,
        filePath: item.filePath,
        parentId: null,
        isFolder: item.isDir,
        isDir: item.isDir,
        modifyTime: item.updateTime,
        contentType: item.contentType,
        mediaCover: item.mediaCover || false
      }));
      return {
        ...res,
        data: {
          rows: mappedList,
          total: res.data.total || 0,
          pageNum: res.data.page || 1,
          pageSize: res.data.size || 50
        }
      };
    }
    return res;
  });
}
