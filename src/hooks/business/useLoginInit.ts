import { onMounted, ref } from 'vue';
import { localStg } from '@/utils/storage';
import { fetchGetCaptchaStatus } from '@/service/api/system/setting';
import { fetchCheckDB } from '@/service/api/init';

/**
 * 验证码状态管理 Hook
 * 处理验证码开关、获取验证码等逻辑
 */
export function useCaptcha() {
  // 验证码是否开启（默认开启，防止API失败时无法登录）
  const captchaEnabled = ref(true);
  const showCaptcha = ref(false);
  const captchaToken = ref('');

  /**
   * 获取验证码开关状态
   */
  async function fetchCaptchaStatus() {
    const captchaResult = await fetchGetCaptchaStatus();
    if (captchaResult.data) {
      captchaEnabled.value = captchaResult.data.enabled;
    }
  }

  /**
   * 处理验证码成功回调
   */
  function handleCaptchaSuccess(token: string) {
    captchaToken.value = token;
    showCaptcha.value = false;
  }

  /**
   * 打开验证码弹窗
   */
  function openCaptcha() {
    showCaptcha.value = true;
  }

  /**
   * 关闭验证码弹窗
   */
  function closeCaptcha() {
    showCaptcha.value = false;
  }

  return {
    captchaEnabled,
    showCaptcha,
    captchaToken,
    fetchCaptchaStatus,
    handleCaptchaSuccess,
    openCaptcha,
    closeCaptcha
  };
}

/**
 * 初始化检查 Hook
 * 处理数据库初始化状态检查
 */
export function useInitCheck() {
  const showInitButton = ref(false);

  // 缓存配置
  const CHECK_DB_CACHE_KEY = 'check_db_result';
  const CHECK_DB_CACHE_EXPIRE = 5 * 60 * 1000; // 5分钟缓存

  interface CheckDBCache {
    needInit: boolean;
    timestamp: number;
  }

  /**
   * 检查是否需要初始化
   */
  async function checkInitStatus() {
    // 检查缓存
    const cache = localStg.get(CHECK_DB_CACHE_KEY) as CheckDBCache | null;
    const now = Date.now();

    if (cache && (now - cache.timestamp) < CHECK_DB_CACHE_EXPIRE) {
      showInitButton.value = cache.needInit;
      return;
    }

    // 检查是否需要初始化
    const { data, error } = await fetchCheckDB();
    if (!error && data) {
      showInitButton.value = data.needInit;
      // 缓存结果
      localStg.set(CHECK_DB_CACHE_KEY, {
        needInit: data.needInit,
        timestamp: now
      } as CheckDBCache);
    }
  }

  return {
    showInitButton,
    checkInitStatus
  };
}

/**
 * 记住用户名 Hook
 * 处理"记住我"功能
 */
export function useRememberMe() {
  const REMEMBER_ME_KEY = 'login_remember_me';
  const REMEMBERED_USER_KEY = 'remembered_user';

  const rememberMe = ref(false);
  const rememberedUser = ref('');

  /**
   * 恢复记住的用户名
   */
  function restoreRememberedUser() {
    const remembered = localStg.get(REMEMBER_ME_KEY);
    if (remembered) {
      rememberMe.value = true;
      const savedUser = localStg.get(REMEMBERED_USER_KEY);
      if (savedUser) {
        rememberedUser.value = savedUser;
      }
    }
  }

  /**
   * 保存记住的用户名
   */
  function saveRememberedUser(userName: string) {
    if (rememberMe.value) {
      localStg.set(REMEMBER_ME_KEY, true);
      localStg.set(REMEMBERED_USER_KEY, userName);
    } else {
      localStg.remove(REMEMBER_ME_KEY);
      localStg.remove(REMEMBERED_USER_KEY);
    }
  }

  return {
    rememberMe,
    rememberedUser,
    restoreRememberedUser,
    saveRememberedUser
  };
}

/**
 * 登录页面初始化 Hook
 * 整合所有初始化逻辑
 */
export function useLoginInit() {
  const captcha = useCaptcha();
  const initCheck = useInitCheck();
  const rememberMe = useRememberMe();

  /**
   * 执行所有初始化检查
   */
  async function init() {
    rememberMe.restoreRememberedUser();
    await initCheck.checkInitStatus();
    await captcha.fetchCaptchaStatus();
  }

  onMounted(init);

  return {
    ...captcha,
    ...initCheck,
    ...rememberMe
  };
}