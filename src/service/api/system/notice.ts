import { request } from '@/service/request';

/** 获取通知公告列表 */
export function fetchGetNoticeList(params?: Api.System.NoticeSearchParams) {
  return request<Api.System.NoticeList>({
    url: '/system/notice/list',
    method: 'get',
    params
  });
}

/** 获取通知公告详情（编辑回显） */
export function fetchGetNoticeDetail(id: CommonType.IdType) {
  return request<Api.System.NoticeDetailResponse>({
    url: `/system/notice/${id}`,
    method: 'get'
  });
}

/** 新增通知公告 */
export function fetchCreateNotice(data: Api.System.NoticeOperateParams) {
  return request<boolean>({
    url: '/system/notice',
    method: 'post',
    data
  });
}

/** 修改通知公告 */
export function fetchUpdateNotice(data: Api.System.NoticeOperateParams) {
  return request<boolean>({
    url: '/system/notice',
    method: 'put',
    data
  });
}

/** 批量删除通知公告 */
export function fetchBatchDeleteNotice(noticeIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/system/notice/${noticeIds.join(',')}`,
    method: 'delete'
  });
}

/** 获取公告阅读统计 */
export function fetchGetNoticeReadStats(id: CommonType.IdType) {
  return request<Api.System.NoticeReadStatsResponse>({
    url: `/system/notice/read-stats/${id}`,
    method: 'get'
  });
}

/** 获取用户可见公告列表 */
export function fetchGetMyNoticeList(params?: Api.System.MyNoticeSearchParams) {
  return request<Api.System.MyNoticeList>({
    url: '/system/notice/my/list',
    method: 'get',
    params
  });
}

/** 获取用户公告详情（自动记录阅读） */
export function fetchGetMyNoticeDetail(id: CommonType.IdType) {
  return request<Api.System.MyNoticeDetail>({
    url: `/system/notice/my/${id}`,
    method: 'get'
  });
}

/** 获取未读公告数量 */
export function fetchGetUnreadCount() {
  return request<number>({
    url: '/system/notice/my/unread-count',
    method: 'get'
  });
}