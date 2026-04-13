import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import { fetchGetMyNoticeList, fetchGetMyNoticeDetail, fetchGetUnreadCount } from '@/service/api/system/notice';

interface NoticeItem {
  noticeId: number;
  noticeTitle: string;
  noticeType: string;
  createTime: string;
  read: boolean;
  readCount: number;
  topFlag: string;
}

export const useNoticeStore = defineStore(SetupStoreId.Notice, () => {
  const state = reactive({
    notices: [] as NoticeItem[],
    unreadCount: 0
  });

  // 获取用户公告列表
  const fetchMyNotices = async () => {
    const { error, data } = await fetchGetMyNoticeList();
    if (!error) {
      state.notices = (data.rows as NoticeItem[]) || [];
    }
  };

  // 获取未读数量
  const fetchUnreadCount = async () => {
    const { error, data } = await fetchGetUnreadCount();
    if (!error) {
      state.unreadCount = data || 0;
    }
  };

  // 查看公告详情（自动标记已读）
  const readNotice = async (noticeId: number) => {
    const { error } = await fetchGetMyNoticeDetail(noticeId);
    if (!error) {
      // 更新本地状态
      const notice = state.notices.find(n => n.noticeId === noticeId);
      if (notice) {
        notice.read = true;
        notice.readCount++;
      }
      if (state.unreadCount > 0) {
        state.unreadCount--;
      }
    }
  };

  // 全部已读
  const readAll = async () => {
    // 批量标记所有未读公告为已读
    const unreadNotices = state.notices.filter(n => !n.read);
    for (const notice of unreadNotices) {
      await fetchGetMyNoticeDetail(notice.noticeId);
    }
    state.notices.forEach(n => {
      n.read = true;
    });
    state.unreadCount = 0;
  };

  // 清空通知
  const clearNotice = () => {
    state.notices = [];
    state.unreadCount = 0;
  };

  return {
    state,
    fetchMyNotices,
    fetchUnreadCount,
    readNotice,
    readAll,
    clearNotice
  };
});