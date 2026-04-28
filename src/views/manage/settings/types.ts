/** 设置页面菜单项 */
export interface SettingMenuItem {
  key: string;
  label: string;
  icon: string;
  description: string;
}

/** 常规配置 */
export interface GeneralSettingConfig {
  systemName: string;
  systemDescription: string;
  logoUrl: string;
  faviconUrl: string;
  userDefaultPassword: string;
  userDefaultRole: number | null;
  // 验证码配置 - 完整版
  enableVerifyCode: boolean;
  verifyCodeType: 'click' | 'slide' | 'dragdrop' | 'rotate'; // 修正 drag -> dragdrop
  verifyCodeLen: number;       // 验证码长度
  verifyCodeExp: number;       // 过期时间(分钟)
  verifyCodeTokenExp: number;  // Token过期时间(分钟)
  verifyInaccuracy: number;    // 误差范围(像素)
}

/** 安全配置 */
export interface SecuritySettingConfig {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireDigit: boolean;
  passwordRequireSpecial: boolean;
  loginFailLockCount: number;
  loginFailLockTime: number;
  ipValidationEnabled: boolean;
  ipValidationMode: 'blacklist' | 'whitelist';
  ipBlacklist: string;
  ipWhitelist: string;
}

/** LDAP配置 */
export interface LdapSettingConfig {
  enabled: boolean;
  server: string;
  bindUser: string;
  bindPassword: string;
  baseOU: string;
  searchPageSize: number;
  fieldMapping: string;
  syncEnabled: boolean;
  syncDefaultEnabled: boolean;
  syncStrategy: 'incremental' | 'full';
  conflictStrategy: 'skip' | 'overwrite' | 'merge';
}

/** 网盘配置 */
export interface DiskSettingConfig {
  // 基础配置
  maxUploadSize: number;
  allowedFileTypes: string;
  storageQuota: number;
  // 个性化配置
  diskName: string;
  diskLogo: string;
  shareLinkPasswordRequired: boolean;
  shareLinkPasswordMinLength: number;
  uploadLinkPasswordRequired: boolean;
  uploadLinkPasswordMinLength: number;
  syncEnabled: boolean;
  // OnlyOffice配置
  onlyOfficeEnabled: boolean;
  onlyOfficeUrl: string;
  onlyOfficeSecret: string;
  onlyOfficeCallbackUrl: string;
  // 视频转码配置
  videoTranscodeEnabled: boolean;
  ffmpegPath: string;
  transcodeThreads: number;
  transcodePreset: string;
}

/** 通知渠道配置 */
export interface NotifySettingConfig {
  // 邮件
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  // 短信
  smsEnabled: boolean;
  smsGateway: string;
  // 飞书
  feishuEnabled: boolean;
  feishuAppId: string;
  feishuAppSecret: string;
  // Webhook
  webhookUrl: string;
}

/** 认证配置 */
export interface AuthSettingConfig {
  // 企业微信
  weworkEnabled: boolean;
  weworkDomainFileName: string;
  weworkDomainFileContent: string;
  // 微信
  wechatEnabled: boolean;
  // Gitee
  giteeEnabled: boolean;
  // GitHub
  githubEnabled: boolean;
}

/** 完整设置配置 */
export interface SettingConfig {
  general: GeneralSettingConfig;
  security: SecuritySettingConfig;
  ldap: LdapSettingConfig;
  disk: DiskSettingConfig;
  notify: NotifySettingConfig;
  auth: AuthSettingConfig;
}