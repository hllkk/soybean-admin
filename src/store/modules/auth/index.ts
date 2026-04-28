import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { defineStore } from "pinia";
import { useLoading } from "@sa/hooks";
import { fetchGetUserInfo, fetchLoginWithInfo } from "@/service/api";
import { useRouterPush } from "@/hooks/common/router";
import { localStg } from "@/utils/storage";
import { SetupStoreId } from "@/enum";
import { $t } from "@/locales";
import { useRouteStore } from "../route";
import { useTabStore } from "../tab";
import { clearAuthStorage, getToken } from "./shared";

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref("");

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: 0,
    userName: "",
    nickName: "",
    userAvatar: "",
    userEmail: "",
    userPhone: "",
    userGender: 0,
    roleId: 0,
    lastLogin: "",
    status: "",
    role: "",
    roles: [],
    buttons: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === "static" && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    recordUserId();

    clearAuthStorage();

    // Reset state manually (Pinia setup style)
    token.value = "";
    Object.assign(userInfo, {
      userId: 0,
      userName: "",
      nickName: "",
      userAvatar: "",
      userEmail: "",
      userPhone: "",
      userGender: 0,
      roleId: 0,
      lastLogin: "",
      status: "",
      role: "",
      roles: [],
      buttons: []
    });

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.userId) {
      return;
    }

    // Store current user ID locally for next login comparison
    localStg.set("lastLoginUserId", userInfo.userId);
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.userId) {
      return false;
    }

    const lastLoginUserId = localStg.get("lastLoginUserId");

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== userInfo.userId) {
      localStg.remove("globalTabs");
      tabStore.clearTabs();

      localStg.remove("lastLoginUserId");
      return true;
    }

    localStg.remove("lastLoginUserId");
    return false;
  }

  /**
   * Login and get user info in one request (cookie-based auth)
   *
   * @param userName User name
   * @param password Password
   * @param captchaToken Captcha token (optional, required when captcha is enabled)
   * @param redirect Whether to redirect after login. Default is true
   */
  async function loginWithInfo(userName: string, password: string, captchaToken?: string, redirect = true) {
    startLoading();

    const { data, error } = await fetchLoginWithInfo(userName, password, captchaToken);

    if (!error && data) {
      localStg.set("isAuthenticated", true);
      token.value = "authenticated";
      Object.assign(userInfo, data.userInfo);

      await routeStore.initAuthRoute();
      const isClear = checkTabClear();
      let needRedirect = redirect;

      if (isClear) {
        needRedirect = false;
      }
      await redirectFromLogin(needRedirect);

      window.$notification?.success({
        title: $t("page.login.common.loginSuccess"),
        content: $t("page.login.common.welcomeBack", { userName: userInfo.userName }),
        duration: 4500
      });
    } else {
      resetStore();
    }

    endLoading();
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      // update store
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const maybeToken = getToken();

    if (maybeToken) {
      token.value = maybeToken;
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  async function wecomLogin(loginToken: Api.Auth.LoginToken, redirect = true) {
    startLoading();

    // Cookie-based auth: tokens set as HttpOnly cookies by backend
    localStg.set('isAuthenticated', true);

    const pass = await getUserInfo();

    if (pass) {
      token.value = "authenticated";

      await routeStore.initAuthRoute();

      const isClear = checkTabClear();
      let needRedirect = redirect;

      if (isClear) {
        needRedirect = false;
      }

      await redirectFromLogin(needRedirect);

      window.$notification?.success({
        title: $t('page.login.common.loginSuccess'),
        content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
        duration: 4500
      });
    } else {
      resetStore();
    }

    endLoading();
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    loginWithInfo,
    wecomLogin,
    initUserInfo
  };
});
