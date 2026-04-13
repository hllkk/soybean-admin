import type { Router } from 'vue-router';
import { useTitle } from '@vueuse/core';
import { $t } from '@/locales';
import { useSystemConfigStore } from '@/store/modules/system-config';

export function createDocumentTitleGuard(router: Router) {
  router.afterEach(to => {
    const { i18nKey, title } = to.meta;

    const pageTitle = i18nKey ? $t(i18nKey) : title;

    // 获取系统名称作为标题后缀
    const systemConfigStore = useSystemConfigStore();
    const systemName = systemConfigStore.getSystemName();

    // 组合标题: 页面名 - 系统名称
    const documentTitle = pageTitle ? `${pageTitle} - ${systemName}` : systemName;

    useTitle(documentTitle);
  });
}
