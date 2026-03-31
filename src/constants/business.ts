import { transformRecordToOption } from "@/utils/common";

/** enable status */
export const enableStatusRecord: Record<Api.Common.EnableStatus, string> = {
  '1': '启用',
  '0': '停用'
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);

/** data scope */
export const dataScopeRecord: Record<Api.System.DataScope, string> = {
  '1': '全部数据权限',
  '2': '自定数据权限',
  '3': '本部门数据权限',
  '4': '本部门及以下数据权限',
  '5': '仅本人数据权限',
  '6': '部门及以下或本人数据权限'
};

export const dataScopeOptions = transformRecordToOption(dataScopeRecord);
