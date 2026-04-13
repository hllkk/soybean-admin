# User-Center Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user-center module with dual layout routing - hide from menu, navigate via avatar dropdown, use base-layout for admin pages and disk-layout for disk pages.

**Architecture:** Create two additional routes (`/admin/user-center`, `/disk/user-center`) via customRoutes, hide original `/user-center` from menu, and update avatar dropdown to navigate based on current page context.

**Tech Stack:** Vue3 + TypeScript + elegant-router + Naive UI

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/router/routes/index.ts` | Modify | Add custom routes and hide original route |
| `src/layouts/modules/global-header/components/user-avatar.vue` | Modify | Update navigation logic |

---

### Task 1: Add Custom Routes for User-Center

**Files:**
- Modify: `frontend/src/router/routes/index.ts`

**Context:** The elegant-router auto-generates routes.ts, so we use customRoutes in routes/index.ts to add additional routes dynamically.

- [ ] **Step 1: Add customRoutes for admin and disk user-center routes**

Locate the `customRoutes` array (currently empty) and add the two routes:

```typescript
/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
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
```

- [ ] **Step 2: Update routeLayoutMap for disk_user-center**

Add disk_user-center to the routeLayoutMap (the admin_user-center uses base layout which is default, so no need to add):

```typescript
const routeLayoutMap: Record<string, string> = {
  login: "blank",
  disk: 'disk',
  'disk_user-center': 'disk'
};
```

- [ ] **Step 3: Update routeModuleMap for new routes**

Add the new routes to routeModuleMap:

```typescript
const routeModuleMap: Record<string, RouteModule> = {
  manage: 'admin',
  manage_user: 'admin',
  manage_role: 'admin',
  manage_menu: 'admin',
  manage_dept: 'admin',
  manage_post: 'admin',
  manage_dict: 'admin',
  manage_log: 'admin',
  manage_log_operation: 'admin',
  manage_log_login: 'admin',
  manage_settings: 'admin',
  admin_user-center: 'admin',
  disk_user-center: 'disk'
};
```

- [ ] **Step 4: Modify createStaticRoutes to hide original user-center route**

Update the `createStaticRoutes` function to add `hideInMenu` and `constant` to the original user-center route:

```typescript
/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  // 转换路由 layout 和 module
  const transformedRoutes = transformRouteLayout(generatedRoutes).map(route => {
    // 隐藏原始 user-center 路由（不在菜单中显示）
    if (route.name === 'user-center') {
      route.meta = {
        ...route.meta,
        hideInMenu: true,
        constant: true
      } as RouteMeta;
    }
    return route;
  });

  [...customRoutes, ...transformedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item as ElegantRoute);
    } else {
      authRoutes.push(item as ElegantRoute);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}
```

Note: You need to import `RouteMeta` type if not already imported. Check if it's available or use `ElegantConstRoute['meta']`.

- [ ] **Step 5: Run typecheck to verify changes**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`

Expected: No TypeScript errors

- [ ] **Step 6: Commit router changes**

```bash
git add src/router/routes/index.ts
git commit -m "feat: add dual layout routes for user-center module

- Add admin_user-center and disk_user-center custom routes
- Hide original user-center from menu with hideInMenu: true
- Configure disk_user-center to use disk layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Update Avatar Dropdown Navigation

**Files:**
- Modify: `frontend/src/layouts/modules/global-header/components/user-avatar.vue`

**Context:** The user-avatar.vue already has computed properties `isDiskPage` and `isAdminPage`, and a `handleUserCenter` function that currently shows a placeholder message.

- [ ] **Step 1: Update handleUserCenter function**

Replace the existing `handleUserCenter` function (lines 135-138) with navigation logic:

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

- [ ] **Step 2: Run typecheck to verify changes**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`

Expected: No TypeScript errors

- [ ] **Step 3: Run lint to verify code style**

Run: `cd /home/devops-admin/frontend && pnpm lint`

Expected: No lint errors

- [ ] **Step 4: Commit avatar dropdown changes**

```bash
git add src/layouts/modules/global-header/components/user-avatar.vue
git commit -m "feat: implement user-center navigation from avatar dropdown

- Navigate to /disk/user-center when on disk pages
- Navigate to /admin/user-center when on admin/manage pages

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Manual Testing and Verification

**Files:**
- No file changes - manual testing only

- [ ] **Step 1: Start frontend development server**

Run: `cd /home/devops-admin/frontend && pnpm dev`

- [ ] **Step 2: Verify menu does not show user-center**

1. Navigate to `/admin` or `/manage` pages
2. Check sidebar menu - user-center should NOT be visible
3. Navigate to `/disk` page
4. Check sidebar menu - user-center should NOT be visible

Expected: user-center is hidden in all menus

- [ ] **Step 3: Verify avatar dropdown navigation**

1. On `/admin` page, click avatar dropdown → click "个人中心"
2. Should navigate to `/admin/user-center` with base-layout
3. Verify layout: should have header, sider, tabs (base-layout features)

4. On `/disk` page, click avatar dropdown → click "个人中心"
5. Should navigate to `/disk/user-center` with disk-layout
6. Verify layout: should have disk-specific header (disk-layout features)

Expected: Correct navigation and layout for each context

- [ ] **Step 4: Verify user-center functionality**

On both `/admin/user-center` and `/disk/user-center`:

1. Check user info display (avatar, nickname, phone, email, dept, roles)
2. Test profile modification (nickname, email, phone, gender)
3. Test password modification (old password, new password, confirm)
4. Check third-party app binding (social card)
5. Check online devices table

Expected: All user-center features work correctly

- [ ] **Step 5: Final commit (if any fixes needed)**

If any issues were found and fixed:

```bash
git add -A
git commit -m "fix: resolve user-center navigation issues

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Hide user-center from menu → Task 1 Step 4
- [x] Avatar dropdown navigation → Task 2 Step 1
- [x] Dual layout routing → Task 1 Steps 1-3
- [x] All user-center features preserved → Task 3 Step 4

**Placeholder Scan:**
- [x] No "TBD" or "TODO" in tasks
- [x] All code steps have actual code
- [x] All commands are exact

**Type Consistency:**
- [x] Route names consistent: `admin_user-center`, `disk_user-center`
- [x] Path names consistent: `/admin/user-center`, `/disk/user-center`
- [x] Layout names consistent: `base`, `disk`

---

## Summary

This plan implements the user-center module with:
- 2 tasks modifying existing files
- 1 task for manual testing
- Total estimated implementation time: ~15 minutes