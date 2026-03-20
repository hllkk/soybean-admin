import type { RouteMeta } from 'vue-router';
import ElegantVueRouter from '@elegant-router/vue/vite';
import type { RouteKey } from '@elegant-router/types';

/** 需要额外配置的路由 meta */
const routeMetaConfig: Record<string, Partial<RouteMeta>> = {
  admin: {
  disk: {
    icon: "mdi:harddisk",
    order: 2
  },
    icon: 'mdi:monitor-dashboard',
    order: 1,
    fixedIndexInTab: 0
  }
};

export function setupElegantRouter() {
  return ElegantVueRouter({
    layouts: {
      base: 'src/layouts/base-layout/index.vue',
      blank: 'src/layouts/blank-layout/index.vue',
      disk: 'src/layouts/disk-layout/index.vue'
    },
    routePathTransformer(routeName, routePath) {
      const key = routeName as RouteKey;

      if (key === 'login') {
        const modules: UnionKey.LoginModule[] = ['pwd-login', 'code-login', 'register', 'reset-pwd', 'bind-wechat'];

        const moduleReg = modules.join('|');

        return `/login/:module(${moduleReg})?`;
      }

      return routePath;
    },
    onRouteMetaGen(routeName) {
      const key = routeName as RouteKey;

      const constantRoutes: RouteKey[] = ['login', '403', '404', '500'];

      const meta: Partial<RouteMeta> = {
        title: key,
        i18nKey: `route.${key}` as App.I18n.I18nKey
      };

      if (constantRoutes.includes(key)) {
        meta.constant = true;
      }

      // 合并额外配置
      const extraConfig = routeMetaConfig[key];
      if (extraConfig) {
        Object.assign(meta, extraConfig);
      }

      return meta;
    }
  });
}
