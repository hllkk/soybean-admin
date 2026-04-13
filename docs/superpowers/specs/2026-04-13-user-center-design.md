# 个人中心模块设计文档

**日期**: 2026-04-13
**状态**: 已确认
**作者**: Claude

## 概述

个人中心模块需要实现以下功能：
1. 不在菜单中展示，通过头像下拉菜单访问
2. 根据当前页面类型（admin/disk）使用对应的布局
3. 保留现有的所有功能（用户信息、资料修改、密码修改、第三方应用、在线设备）

## 需求分析

### 当前状态
- 个人中心页面已存在：`frontend/src/views/_builtin/user-center/index.vue`
- 路由配置：`layout.base$view.user-center`，使用 base-layout
- 头像下拉已有处理函数，但只显示"功能开发中"

### 目标状态
- 菜单中隐藏个人中心入口
- 头像下拉点击跳转到对应布局的个人中心
- admin 页面 → `/admin/user-center` → base-layout
- disk 页面 → `/disk/user-center` → disk-layout

## 技术方案

### 方案选择：双路由方案

采用双路由方案，创建两个独立的路由：
- `/admin/user-center` - 使用 base-layout
- `/disk/user-center` - 使用 disk-layout

**Why**: elegant-router 的路由组件是静态配置的，无法根据"来源页面"动态选择布局。双路由方案符合现有架构，URL 明确表达用户所在模块。

### 实现步骤

#### 1. 路由配置修改

**文件**: `frontend/src/router/routes/index.ts`

由于 `routes.ts` 是 elegant-router 自动生成的文件，不应直接修改。采用以下策略：

1. **隐藏原路由**: 在路由处理函数中为 `user-center` 添加 `hideInMenu: true`
2. **动态添加子路由**: 通过 `customRoutes` 添加两个新路由

```typescript
// customRoutes 添加个人中心子路由
const customRoutes: CustomRoute[] = [
  {
    name: 'admin_user-center',
    path: '/admin/user-center',
    component: 'layout.base$view.user-center',
    meta: {
      title: 'user-center',
      i18nKey: 'route.user-center',
      hideInMenu: true,
      constant: true,
      module: 'admin'
    }
  },
  {
    name: 'disk_user-center',
    path: '/disk/user-center',
    component: 'layout.disk$view.user-center',
    meta: {
      title: 'user-center',
      i18nKey: 'route.user-center',
      hideInMenu: true,
      constant: true,
      module: 'disk'
    }
  }
];

// 在 createStaticRoutes 函数中处理原有 user-center 路由
const transformedRoutes = transformRouteLayout(generatedRoutes).map(route => {
  if (route.name === 'user-center') {
    route.meta = {
      ...route.meta,
      hideInMenu: true,
      constant: true
    };
  }
  return route;
});
```

**更新 routeLayoutMap**:
```typescript
const routeLayoutMap: Record<string, string> = {
  login: "blank",
  disk: 'disk',
  'disk_user-center': 'disk'  // disk_user-center 使用 disk 布局
};
```

#### 2. 头像下拉跳转逻辑

**文件**: `frontend/src/layouts/modules/global-header/components/user-avatar.vue`

修改 `handleUserCenter` 函数：

```typescript
function handleUserCenter() {
  // 根据当前页面跳转到对应布局的个人中心
  if (isDiskPage.value) {
    router.push('/disk/user-center');
  } else {
    router.push('/admin/user-center');
  }
}
```

移除原有的"功能开发中"提示。

#### 3. 复用现有页面组件

个人中心页面组件位于 `frontend/src/views/_builtin/user-center/index.vue`，两个路由都复用该组件，只是使用不同的 layout 包装。

## 影响范围

### 需要修改的文件
1. `frontend/src/router/routes/index.ts` - 路由配置和动态添加路由
2. `frontend/src/layouts/modules/global-header/components/user-avatar.vue` - 跳转逻辑

### 不需要修改的文件
- 个人中心页面组件本身 (`views/_builtin/user-center/`)
- 布局组件 (`base-layout/`, `disk-layout/`)
- 国际化文件（已有配置）

## 验收标准

1. 菜单中不显示个人中心入口
2. 头像下拉点击"个人中心"能正确跳转
3. 从 admin 页面跳转后使用 base-layout
4. 从 disk 页面跳转后使用 disk-layout
5. 个人中心所有功能正常工作

## 测试要点

- 直接访问 `/admin/user-center` 和 `/disk/user-center`
- 从 admin 页面点击头像下拉的"个人中心"
- 从 disk 页面点击头像下拉的"个人中心"
- 个人中心页面的资料修改、密码修改等功能