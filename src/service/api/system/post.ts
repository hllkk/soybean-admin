import { request } from '@/service/request';

/** 获取岗位选择框列表 */
export function fetchGetPostSelect(deptId?: CommonType.IdType, postIds?: CommonType.IdType[]) {
  return request<Api.System.Post[]>({
    url: '/post/options',
    method: 'get',
    params: { postIds, deptId }
  });
}

/** 获取部门选择框列表 */
export function fetchGetPostDeptSelect() {
  return request<Api.Common.CommonTreeRecord>({
    url: '/post/deptTree',
    method: 'get'
  });
}

/** 获取岗位信息列表 */
export function fetchGetPostList(params?: Api.System.PostSearchParams) {
  return request<Api.System.PostList>({
    url: '/post/list',
    method: 'get',
    params
  });
}

/** 批量删除岗位信息 */
export function fetchBatchDeletePost(postIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/post/${postIds.join(',')}`,
    method: 'delete'
  });
}
