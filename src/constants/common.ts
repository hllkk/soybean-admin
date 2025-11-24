import { transformRecordToOption } from '@/utils/common';

export const yesOrNoRecord: Record<CommonType.YesOrNo, App.I18n.I18nKey> = {
  Y: 'common.yesOrNo.yes',
  N: 'common.yesOrNo.no'
};

export const yesOrNoOptions = transformRecordToOption(yesOrNoRecord);

/** menu type */
export const menuTypeRecord: Record<Api.System.MenuType, string> = {
  M: '目录',
  C: '菜单'
};

/** user gender */
export const userGenderRecord: Record<UnionKey.UserGender, App.I18n.I18nKey> = {
  0: 'page.system.user.unknown',
  1: 'page.system.user.male',
  2: 'page.system.user.female'
};

export const errorCodeRecord: Record<CommonType.ErrorCode, string> = {
  '401': '认证失败，无法访问系统资源',
  '403': '当前操作没有权限',
  '404': '访问资源不存在',
  default: '系统未知错误，请反馈给管理员'
};
