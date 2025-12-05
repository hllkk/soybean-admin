import { ref } from 'vue';

export const ldapDefaultData: Api.System.LdapSettings = {
  config: {
    enable: false,
    hosts: [],
    user: '',
    password: '',
    base_ou: '',
    attributes: {
      username: 'sAMAccountName',
      nickname: 'cn',
      email: 'mail',
      phone: 'telephoneNumber'
    }
  },
  sync: {
    enable: false,
    interval: 0,
    default_status: false,
    sync_rule: 1
  }
};

export const generalDefaultData: Api.System.GeneralSettings = {
  systemName: 'OPS 管理系统',
  diskName: 'OPS 网盘',
  watermark: false,
  userDefaultPassword: undefined,
  userDefaultRole: undefined,
  enableVerifyCode: true,
  verifyCodeType: 'click',
  verifyInaccuracy: 15
};

export const authenticationDefaultData: Api.System.AuthenticationSettings = {
  wecom: {
    enableWecom: true,
    validateDomainFileName: '',
    validateDomainFileContent: ''
  }
};

export const securityDefaultData: Api.System.SecuritySettings = {
  totp: false,
  ip_check: false,
  ip_check_mode: 0,
  ip_black_list: [],
  ip_white_list: []
};

export const channelsDefaultData: Api.System.ChannelsSettings = {
  email: {
    MAIL_FROM: null,
    MAIL_PORT: null,
    MAIL_SERVER: null,
    MAIL_SSL_TLS: false,
    MAIL_PASSWORD: null,
    MAIL_STARTTLS: true,
    MAIL_USERNAME: null,
    MAIL_FROM_NAME: null,
    VALIDATE_CERTS: true,
    USE_CREDENTIALS: true
  }
};

// 检查是否为对象
function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// 深度合并函数
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, any>;

  Object.keys(source).forEach(key => {
    const sourceValue = source[key as keyof T];
    if (sourceValue !== undefined) {
      if (isObject(sourceValue) && isObject(result[key])) {
        result[key] = deepMerge(result[key], sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  });

  return result as T;
}

// 定义设置模块的组合函数
export function useSettingModule<T>(defaultData: T) {
  const data = ref<T>({ ...defaultData } as T);

  // 重置方法
  const reset = () => {
    data.value = { ...defaultData } as T;
  };

  // 更新方法（支持部分更新）
  const update = (payload: Partial<T>) => {
    data.value = { ...data.value, ...payload };
  };

  // 深度更新方法（适用于嵌套对象）
  const deepUpdate = (payload: Partial<T>) => {
    data.value = deepMerge(data.value, payload);
  };

  return {
    data: data as Readonly<typeof data>,
    reset,
    update,
    deepUpdate
  };
}
