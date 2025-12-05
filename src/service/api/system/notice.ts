import { request } from '@/service/request';

/** 获取通知公告列表 */
export function fetchGetNoticeList(params?: Api.System.NoticeSearchParams) {
  return request<Api.System.NoticeList>({
    url: '/notice/list',
    method: 'get',
    params
  });
}

/** 批量删除通知公告 */
export function fetchBatchDeleteNotice(noticeIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/notice/${noticeIds.join(',')}`,
    method: 'delete'
  });
}
