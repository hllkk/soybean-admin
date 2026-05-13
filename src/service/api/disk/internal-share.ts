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

/** 获取我发起的共享列表 */
export function fetchGetMySharedList(params: { pageNum: number; pageSize: number }) {
  return request<{ total: number; rows: any[]; pageNum: number; pageSize: number }>({
    url: '/share/internal/my-shared',
    method: 'post',
    data: params
  });
}

/** 获取共享给我的列表 */
export function fetchGetSharedWithMeList(params: { pageNum: number; pageSize: number; shareType?: string }) {
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
  return request<{ list: Api.Disk.FileItem[]; total: number; page: number; size: number }>({
    url: '/share/internal/folder',
    method: 'post',
    data: params
  }).then(res => {
    // 将后端的 list 字段映射为 rows，以符合前端 PaginatingQueryRecord 格式
    if (res.data) {
      return {
        ...res,
        data: {
          rows: res.data.list || [],
          total: res.data.total || 0,
          pageNum: res.data.page || 1,
          pageSize: res.data.size || 50
        }
      };
    }
    return res;
  });
}
