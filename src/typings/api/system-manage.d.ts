declare namespace Api {
  /**
   * namespace SystemManage
   *
   * 系统管理模块
   */
  namespace SystemManage {
    // 用户
    interface User {
      id: number;
      userName: string;
      nickName: string;
      avatar?: string;
      phone: string;
      email: string;
      sex?: '0' | '1' | '2';
      status: '0' | '1';
      roleId: number;
      roleName?: string;
      deptId?: number;
      deptName?: string;
      postId?: number;
      postName?: string;
      remark?: string;
      createdAt?: string;
      updatedAt?: string;
    }

    // 用户搜索参数
    interface UserSearchParams {
      page: number;
      pageSize: number;
      userName?: string;
      nickName?: string;
      phone?: string;
      status?: '' | '0' | '1';
      deptId?: number | null;
    }

    // 角色
    interface Role {
      id: number;
      roleName: string;
      roleCode: string;
      description?: string;
      status: '0' | '1';
      order?: number;
      createdAt?: string;
      updatedAt?: string;
    }

    // 菜单
    interface Menu {
      id: number;
      menuName: string;
      menuType: 'directory' | 'menu' | 'button';
      path?: string;
      component?: string;
      icon?: string;
      order: number;
      status: '0' | '1';
      parentId: number;
      children?: Menu[];
      createdAt?: string;
      updatedAt?: string;
    }

    // 部门
    interface Dept {
      id: number;
      deptName: string;
      parentId: number;
      leader?: string;
      phone?: string;
      email?: string;
      order: number;
      status: '0' | '1';
      children?: Dept[];
      createdAt?: string;
      updatedAt?: string;
    }

    // 岗位
    interface Post {
      id: number;
      postName: string;
      postCode: string;
      order: number;
      status: '0' | '1';
      remark?: string;
      createdAt?: string;
      updatedAt?: string;
    }

    // 字典
    interface Dict {
      id: number;
      dictName: string;
      dictCode: string;
      description?: string;
      status: '0' | '1';
      createdAt?: string;
      updatedAt?: string;
    }

    // 字典数据
    interface DictData {
      id: number;
      dictId: number;
      label: string;
      value: string;
      order: number;
      status: '0' | '1';
      remark?: string;
    }

    // 操作日志
    interface Log {
      id: number;
      operator: string;
      module: string;
      action: string;
      ip: string;
      method: string;
      path: string;
      status: number;
      requestBody?: string;
      responseBody?: string;
      errorMsg?: string;
      duration?: number;
      createdAt: string;
    }

    // 登录日志
    interface LoginLog {
      id: number;
      userName: string;
      ip: string;
      location: string;
      browser: string;
      os: string;
      status: '0' | '1';
      msg: string;
      createdAt: string;
    }

    // 系统设置 - GeneralSettings
    interface GeneralSettings {
      systemName: string;
      systemDescription: string;
      logoUrl: string;
      faviconUrl: string;
      userDefaultPassword?: string;
      userDefaultRole?: number | null;
      enableVerifyCode?: boolean;
      verifyCodeType?: 'click' | 'slide' | 'drag' | 'rotate';
      verifyInaccuracy?: number;
    }

    // 系统设置 - 完整聚合
    interface Settings {
      general?: GeneralSettings;
      authentication?: AuthenticationSettings;
      ldap?: LdapSettings;
      security?: SecuritySettings;
      channels?: ChannelsSettings;
      disk?: DiskSettings;
    }

    interface AuthenticationSettings {
      wecom?: WecomSettings;
      wechat?: WechatSettings;
      gitee?: GiteeSettings;
    }

    interface WecomSettings {
      enableWecom?: boolean;
      validateDomainFileName?: string;
      validateDomainFileContent?: string;
    }

    interface WechatSettings {
      enableWechat?: boolean;
    }

    interface GiteeSettings {
      enableGitee?: boolean;
    }

    interface SecuritySettings {
      totp?: boolean;
      ip_check?: boolean;
      ip_check_mode?: number;
      ip_black_list?: string[];
      ip_white_list?: string[];
    }

    interface LdapSettings {
      config?: LdapConfigInfo;
      sync?: LdapSyncInfo;
    }

    interface LdapConfigInfo {
      enable?: boolean;
      hosts?: string[];
      user?: string;
      password?: string;
      base_ou?: string;
      paged_size?: number;
      attributes?: LdapAttributes;
    }

    interface LdapAttributes {
      username?: string;
      nickname?: string;
      email?: string;
      phone?: string;
    }

    interface LdapSyncInfo {
      enable?: boolean;
      interval?: number;
      default_status?: boolean;
      sync_rule?: number;
    }

    interface ChannelsSettings {
      email?: MailSettings;
    }

    interface MailSettings {
      MAIL_FROM?: string;
      MAIL_PORT?: number;
      MAIL_SERVER?: string;
      MAIL_SSL_TLS?: boolean;
      MAIL_PASSWORD?: string;
      MAIL_STARTTLS?: boolean;
      MAIL_USERNAME?: string;
      MAIL_FROM_NAME?: string;
      VALIDATE_CERTS?: boolean;
      USE_CREDENTIALS?: boolean;
    }

    interface DiskSettings {
      diskName?: string;
      maxUploadSize?: number;
      allowedExtensions?: string[];
      trashRetentionDays?: number;
      onlyOffice?: OnlyOfficeSettings;
      videoTranscode?: VideoTranscodeSettings;
    }

    interface OnlyOfficeSettings {
      enable?: boolean;
      serverUrl?: string;
      tokenSecret?: string;
      callbackUrl?: string;
    }

    interface VideoTranscodeSettings {
      enable?: boolean;
      ffmpegPath?: string;
      threads?: number;
      preset?: string;
    }

    // 通用分页请求
    interface PageRequest {
      page: number;
      pageSize: number;
    }

    // 通用分页响应
    interface PageResponse<T> {
      list: T[];
      total: number;
      page: number;
      pageSize: number;
    }
  }
}