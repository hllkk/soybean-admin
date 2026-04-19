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
  // 动态添加disk_path路由（用于URL导航，路径参数编码为%20）
  // 使用disk layout包裹disk view
  router.addRoute({
    name: 'disk_path',
    path: '/disk/:path(.*)',
    component: () => import('@/layouts/disk-layout/index.vue'),
    children: [
      {
        name: 'disk_path_view',
        path: '',
        component: () => import('@/views/disk/index.vue'),
        props: true,
        meta: {
          title: 'disk',
          hideInMenu: true
        }
      }
    ],
    meta: {
      title: 'disk',
      hideInMenu: true
    }
  });

  createProgressGuard(router);
  createRouteGuard(router);
  createDocumentTitleGuard(router);
}
