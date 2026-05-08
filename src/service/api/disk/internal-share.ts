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
export function fetchGetSharedWithMeList(params: { pageNum: number; pageSize: number }) {
  return request<{ total: number; rows: any[]; pageNum: number; pageSize: number }>({
    url: '/share/internal/shared-with-me',
    method: 'post',
    data: params
  });
}
