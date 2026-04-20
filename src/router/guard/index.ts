import type { Router } from 'vue-router';
import { createRouteGuard } from './route';
import { createProgressGuard } from './progress';
import { createDocumentTitleGuard } from './title';

/**
 * Router guard
 *
 * @param router - Router instance
 */
export function createRouterGuard(router: Router) {
  // 兼容旧 URL 格式 /disk/:path → 重定向到 /disk?path=xxx
  router.addRoute({
    name: 'disk_path',
    path: '/disk/:path(.*)',
    redirect: to => {
      const path = to.params.path as string;
      return { name: 'disk', query: { path: decodeURIComponent(path) } };
    }
  });

  createProgressGuard(router);
  createRouteGuard(router);
  createDocumentTitleGuard(router);
}
