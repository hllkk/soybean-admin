import type { ElegantConstRoute } from '@elegant-router/types';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

export const ROOT_ROUTE: ElegantConstRoute = {
  name: 'root',
  path: '/',
  redirect: '/disk',
  meta: {
    title: 'root',
    constant: true
  }
};

/** 分享访问页面路由（公开访问，无需登录） */
const SHARE_ROUTE: ElegantConstRoute = {
  name: 'share-access',
  path: '/s/:shortId',
  component: 'layout.blank$view.share',
  meta: {
    title: 'share-access',
    i18nKey: 'route.share-access',
    constant: true,
    hideInMenu: true
  }
};

const NOT_FOUND_ROUTE: ElegantConstRoute = {
  name: 'not-found',
  path: '/:pathMatch(.*)*',
  component: 'layout.blank$view.404',
  meta: {
    title: 'not-found',
    constant: true
  }
};

/** builtin routes, it must be constant and setup in vue-router */
const builtinRoutes: ElegantConstRoute[] = [ROOT_ROUTE, SHARE_ROUTE, NOT_FOUND_ROUTE];

/** create builtin vue routes */
export function createBuiltinVueRoutes() {
  return transformElegantRoutesToVueRoutes(builtinRoutes, layouts, views);
}
