import { computed, ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { RouteKey } from '@elegant-router/types';
import { router } from '@/router';
import { useRouteStore } from '@/store/modules/route';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { useThemeStore } from '../theme';
import {
  extractTabsByAllRoutes,
  filterTabsByIds,
  findTabByRouteName,
  getAllTabs,
  getDefaultHomeTab,
  getFixedTabIds,
  getTabByRoute,
  getTabIdByRoute,
  isTabInTabs,
  reorderFixedTabs,
  updateTabByI18nKey,
  updateTabsByI18nKey
} from './shared';

export const useTabStore = defineStore(SetupStoreId.Tab, () => {
  const routeStore = useRouteStore();
  const themeStore = useThemeStore();
  const { routerPush } = useRouterPush(false);

  /** 标签页按模块分组存储 */
  const moduleTabs = ref<Map<UnionKey.MenuModule, App.Global.Tab[]>>(new Map());

  /** Tabs */
  const tabs = ref<App.Global.Tab[]>([]);

  /** Home tab */
  const homeTab = ref<App.Global.Tab>();

  /** Is tab store initialized */
  const isTabStoreInit = ref(false);

  /** Init home tab */
  function initHomeTab() {
    homeTab.value = getDefaultHomeTab(router, routeStore.routeHome);
  }

  /** 获取当前模块的标签页 */
  const currentModuleTabs = computed(() => {
    const module = routeStore.currentModule;
    return moduleTabs.value.get(module) || [];
  });

  /** Get all tabs (返回当前模块的所有标签页，包括首页) */
  const allTabs = computed(() => {
    const moduleTabsList = currentModuleTabs.value;
    if (!homeTab.value) {
      return getAllTabs(moduleTabsList);
    }

    // Get home route module
    const routes = router.getRoutes();
    const homeRoute = routes.find(route => route.name === homeTab.value?.routeKey);
    const homeModule = (homeRoute?.meta?.module as UnionKey.MenuModule) || 'admin';

    // Only add home tab if it belongs to current module
    let currentHomeTab: App.Global.Tab | undefined;
    if (homeModule === routeStore.currentModule) {
      currentHomeTab = {
        ...homeTab.value,
        // 将首页标签的模块设置为当前模块
        module: routeStore.currentModule
      };
    }

    return getAllTabs(moduleTabsList, currentHomeTab);
  });

  /** Active tab id */
  const activeTabId = ref<string>('');

  /**
   * Set active tab id
   *
   * @param id Tab id
   */
  function setActiveTabId(id: string) {
    activeTabId.value = id;
  }

  /**
   * Init tab store
   *
   * @param currentRoute Current route
   */
  function initTabStore(currentRoute: App.Global.TabRoute) {
    if (isTabStoreInit.value) {
      // 确保首页标签被激活（如果当前路由是首页）
      if (homeTab.value && currentRoute.path === homeTab.value.routePath) {
        setActiveTabId(homeTab.value.id);
      } else {
        addTab(currentRoute);
      }
      return;
    }
    // 初始化首页标签
    initHomeTab();

    const storageTabs = localStg.get('globalTabs');

    if (themeStore.tab.cache && storageTabs) {
      // 按模块重新组织存储的标签页
      const extractedTabs = extractTabsByAllRoutes(router, storageTabs);
      const updatedTabs = updateTabsByI18nKey(extractedTabs);

      // 从路由信息中获取模块信息并分组
      updatedTabs.forEach(tab => {
        // 查找对应的路由以获取模块信息
        const route = router.getRoutes().find(r => r.name === tab.routeKey);
        if (route) {
          const module = (route.meta.module as UnionKey.MenuModule) || 'admin';
          const moduleTabsList = moduleTabs.value.get(module) || [];
          moduleTabsList.push(tab);
          moduleTabs.value.set(module, moduleTabsList);
        }
      });
    }

    // 确保首页标签被激活（如果当前路由是首页）
    if (homeTab.value && currentRoute.path === homeTab.value.routePath) {
      setActiveTabId(homeTab.value.id);
    } else {
      addTab(currentRoute);
    }

    isTabStoreInit.value = true;
  }

  /**
   * Add tab
   *
   * @param route Tab route
   * @param active Whether to activate the added tab
   */
  function addTab(route: App.Global.TabRoute, active = true) {
    const tab = getTabByRoute(route);
    const module = (route.meta.module as UnionKey.MenuModule) || 'admin';

    // 检查是否是首页标签
    const isHomeTab = homeTab.value && (tab.id === homeTab.value.id || tab.routePath === homeTab.value.routePath);

    const moduleTabsList = moduleTabs.value.get(module) || [];

    // 非首页标签才需要添加到模块标签页列表
    if (!isHomeTab && !isTabInTabs(tab.id, moduleTabsList)) {
      moduleTabsList.push(tab);
      moduleTabs.value.set(module, moduleTabsList);
    }

    // 无论是否是首页标签，都可以激活它
    if (active) {
      // 如果是首页，使用首页标签的ID
      const targetTabId = isHomeTab && homeTab.value ? homeTab.value.id : tab.id;
      setActiveTabId(targetTabId);
    }
  }

  /**
   * Remove tab
   *
   * @param tabId Tab id
   */
  async function removeTab(tabId: string) {
    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];
    const removeTabIndex = moduleTabsList.findIndex(tab => tab.id === tabId);

    if (removeTabIndex === -1) return;

    const removedTabRouteKey = moduleTabsList[removeTabIndex].routeKey;
    const isRemoveActiveTab = activeTabId.value === tabId;

    // if remove the last tab, then switch to the second last tab
    const nextTab = moduleTabsList[removeTabIndex + 1] || moduleTabsList[removeTabIndex - 1] || homeTab.value;

    // remove tab
    moduleTabsList.splice(removeTabIndex, 1);
    moduleTabs.value.set(module, moduleTabsList);

    // if current tab is removed, then switch to next tab
    if (isRemoveActiveTab && nextTab) {
      await switchRouteByTab(nextTab);
    }

    // reset route cache
    routeStore.resetRouteCache(removedTabRouteKey);
  }

  /** remove active tab */
  async function removeActiveTab() {
    await removeTab(activeTabId.value);
  }

  /**
   * remove tab by route name
   *
   * @param routeName route name
   */
  async function removeTabByRouteName(routeName: RouteKey) {
    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];
    const tab = findTabByRouteName(routeName, moduleTabsList);
    if (!tab) return;

    await removeTab(tab.id);
  }

  /**
   * Clear tabs
   *
   * @param excludes Exclude tab ids
   */
  async function clearTabs(excludes: string[] = []) {
    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];
    const remainTabIds = [...getFixedTabIds(moduleTabsList), ...excludes];

    // Identify tabs to be removed and collect their routeKeys
    const tabsToRemove = moduleTabsList.filter(tab => !remainTabIds.includes(tab.id));
    const routeKeysToReset: RouteKey[] = [];

    for (const tab of tabsToRemove) {
      routeKeysToReset.push(tab.routeKey);
    }

    const removedTabsIds = tabsToRemove.map(tab => tab.id);

    // If no tabs are actually being removed based on excludes and fixed tabs, exit
    if (removedTabsIds.length === 0) {
      return;
    }

    const isRemoveActiveTab = removedTabsIds.includes(activeTabId.value);
    // filterTabsByIds returns tabs NOT in removedTabsIds, so these are the tabs that will remain
    const updatedTabs = filterTabsByIds(removedTabsIds, moduleTabsList);

    function update() {
      moduleTabs.value.set(module, updatedTabs);
    }

    if (!isRemoveActiveTab) {
      update();
    } else {
      const activeTabCandidate = updatedTabs[updatedTabs.length - 1] || homeTab.value;

      if (activeTabCandidate) {
        // Ensure there's a tab to switch to
        await switchRouteByTab(activeTabCandidate);
      }
      // Update the tabs array regardless of switch success or if a candidate was found
      update();
    }

    // After tabs are updated and route potentially switched, reset cache for removed tabs
    for (const routeKey of routeKeysToReset) {
      routeStore.resetRouteCache(routeKey);
    }
  }

  const { routerPushByKey } = useRouterPush();
  /**
   * Replace tab
   *
   * @param key Route key
   * @param options Router push options
   */
  async function replaceTab(key: RouteKey, options?: App.Global.RouterPushOptions) {
    const oldTabId = activeTabId.value;

    // push new route
    await routerPushByKey(key, options);

    // remove old tab (exclude fixed tab)
    if (!isTabRetain(oldTabId)) {
      await removeTab(oldTabId);
    }
  }

  /**
   * Switch route by tab
   *
   * @param tab
   */
  async function switchRouteByTab(tab: App.Global.Tab) {
    const fail = await routerPush(tab.fullPath);
    if (!fail) {
      setActiveTabId(tab.id);
    }
  }

  /**
   * Clear left tabs
   *
   * @param tabId
   */
  async function clearLeftTabs(tabId: string) {
    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];
    const tabIds = moduleTabsList.map(tab => tab.id);
    const index = tabIds.indexOf(tabId);
    if (index === -1) return;

    const excludes = tabIds.slice(index);
    await clearTabs(excludes);
  }

  /**
   * Clear right tabs
   *
   * @param tabId
   */
  async function clearRightTabs(tabId: string) {
    const isHomeTab = tabId === homeTab.value?.id;
    if (isHomeTab) {
      clearTabs();
      return;
    }

    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];
    const tabIds = moduleTabsList.map(tab => tab.id);
    const index = tabIds.indexOf(tabId);
    if (index === -1) return;

    const excludes = tabIds.slice(0, index + 1);
    await clearTabs(excludes);
  }

  /**
   * Fix tab
   *
   * @param tabId
   */
  function fixTab(tabId: string) {
    const tabIndex = tabs.value.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs.value[tabIndex];
    const fixedCount = getFixedTabIds(tabs.value).length;
    tab.fixedIndex = fixedCount;

    if (tabIndex !== fixedCount) {
      tabs.value.splice(tabIndex, 1);
      tabs.value.splice(fixedCount, 0, tab);
    }

    reorderFixedTabs(tabs.value);
  }

  /**
   * Unfix tab
   *
   * @param tabId
   */
  function unfixTab(tabId: string) {
    const tabIndex = tabs.value.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs.value[tabIndex];
    tab.fixedIndex = undefined;

    const fixedCount = getFixedTabIds(tabs.value).length;
    if (tabIndex !== fixedCount) {
      tabs.value.splice(tabIndex, 1);
      tabs.value.splice(fixedCount, 0, tab);
    }

    reorderFixedTabs(tabs.value);
  }

  /**
   * Set new label of tab
   *
   * @default activeTabId
   * @param label New tab label
   * @param tabId Tab id
   */
  function setTabLabel(label: string, tabId?: string) {
    const id = tabId || activeTabId.value;
    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];

    const tab = moduleTabsList.find(item => item.id === id);
    if (!tab) return;

    tab.oldLabel = tab.label;
    tab.newLabel = label;
  }

  /**
   * Reset tab label
   *
   * @default activeTabId
   * @param tabId Tab id
   */
  function resetTabLabel(tabId?: string) {
    const id = tabId || activeTabId.value;
    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];

    const tab = moduleTabsList.find(item => item.id === id);
    if (!tab) return;

    tab.newLabel = undefined;
  }

  /**
   * Is tab retain
   *
   * @param tabId
   */
  function isTabRetain(tabId: string) {
    if (tabId === homeTab.value?.id) return true;

    const module = routeStore.currentModule;
    const moduleTabsList = moduleTabs.value.get(module) || [];
    const fixedTabIds = getFixedTabIds(moduleTabsList);

    return fixedTabIds.includes(tabId);
  }

  /** Update tabs by locale */
  function updateTabsByLocale() {
    // 更新所有模块的标签页
    moduleTabs.value.forEach((tabsList, module) => {
      const updatedTabs = updateTabsByI18nKey(tabsList);
      moduleTabs.value.set(module, updatedTabs);
    });

    if (homeTab.value) {
      homeTab.value = updateTabByI18nKey(homeTab.value);
    }
  }

  /** Cache tabs */
  function cacheTabs() {
    if (!themeStore.tab.cache) return;

    // 合并所有模块的标签页进行缓存
    const allTabsList: App.Global.Tab[] = [];
    moduleTabs.value.forEach(tabsList => {
      allTabsList.push(...tabsList);
    });

    localStg.set('globalTabs', allTabsList);
  }

  // cache tabs when page is closed or refreshed
  useEventListener(window, 'beforeunload', () => {
    cacheTabs();
  });

  return {
    /** All tabs */
    tabs: allTabs,
    activeTabId,
    homeTab,
    initHomeTab,
    initTabStore,
    addTab,
    removeTab,
    removeActiveTab,
    removeTabByRouteName,
    replaceTab,
    clearTabs,
    clearLeftTabs,
    clearRightTabs,
    fixTab,
    unfixTab,
    switchRouteByTab,
    setTabLabel,
    resetTabLabel,
    isTabRetain,
    updateTabsByLocale,
    getTabIdByRoute,
    cacheTabs,
    currentModuleTabs
  };
});
