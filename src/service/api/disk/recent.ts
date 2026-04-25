import { request } from '@/service/request';

// 获取最近访问列表
export function fetchGetRecentList(params: Api.Disk.RecentListParams) {
  return request<Api.Disk.RecentList>({
    url: '/disk/recent/list',
    method: 'get',
    params
  });
}

// 添加最近访问记录（前端预览/打开文件时调用）
export function fetchAddRecent(fileId: CommonType.IdType) {
  return request<boolean>({
    url: '/disk/recent/add',
    method: 'post',
    data: { fileId }
  });
}

// 删除最近访问记录
export function fetchDeleteRecent(recordIds: CommonType.IdType[]) {
  return request<boolean>({
    url: '/disk/recent/delete',
    method: 'post',
    data: { recordIds }
  });
}

// 清空最近访问记录
export function fetchClearRecent() {
  return request<boolean>({
    url: '/disk/recent/clear',
    method: 'delete'
  });
}