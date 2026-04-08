import { request } from '@/service/request';

/** 获取操作日志列表 */
export function fetchGetOperationLogList(params?: Api.System.OperationLogSearchParams) {
  return request<Api.System.OperationLogList>({
    url: '/system/operlog/list',
    method: 'get',
    params
  });
}

/** 删除操作日志 */
export function fetchDeleteOperationLog(operId: CommonType.IdType) {
  return request<boolean>({
    url: `/system/operlog/${operId}`,
    method: 'delete'
  });
}

/** 批量删除操作日志 */
export function fetchBatchDeleteOperationLog(operIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/system/operlog/${operIds.join(',')}`,
    method: 'delete'
  });
}

/** 清空操作日志 */
export function fetchCleanOperationLog() {
  return request<boolean>({
    url: '/system/operlog/clean',
    method: 'delete'
  });
}

/** 获取登录日志列表 */
export function fetchGetLoginLogList(params?: Api.System.LoginLogSearchParams) {
  return request<Api.System.LoginLogList>({
    url: '/system/logininfor/list',
    method: 'get',
    params
  });
}

/** 删除登录日志 */
export function fetchDeleteLoginLog(infoId: CommonType.IdType) {
  return request<boolean>({
    url: `/system/logininfor/${infoId}`,
    method: 'delete'
  });
}

/** 批量删除登录日志 */
export function fetchBatchDeleteLoginLog(infoIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/system/logininfor/${infoIds.join(',')}`,
    method: 'delete'
  });
}

/** 清空登录日志 */
export function fetchCleanLoginLog() {
  return request<boolean>({
    url: '/system/logininfor/clean',
    method: 'delete'
  });
}

/** 锁定用户 */
export function fetchLockUser(userName: string) {
  return request<boolean>({
    url: `/system/logininfor/lock/${userName}`,
    method: 'put'
  });
}