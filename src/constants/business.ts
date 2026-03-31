import { transformRecordToOption } from "@/utils/common";

/** enable status */
export const enableStatusRecord: Record<Api.Common.EnableStatus, string> = {
  '1': '启用',
  '0': '停用'
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);
