import type { Router } from 'vue-router';
import { useRouteStore } from '@/store/modules/route';

export function createModuleGuard(router: Router) {
  router.beforeEach((to, _from, next) => {
    const routeStore = useRouteStore();
    const modules = to.meta.modules as UnionKey.MenuModule[];

    // 如果当前模块在路由允许的模块列表中，则保持当前模块
    if (modules && routeStore.currentModule && modules.includes(routeStore.currentModule)) {
      next();
      return;
    }

    const targetModule = modules && modules.length > 0 ? modules[0] : 'admin';
    // 只有当模块发生变化时才更新
    if (routeStore.currentModule !== targetModule) {
      routeStore.setCurrentModule(targetModule);
    }
    next();
  });
}
