# Plan — 网盘模块组件复用优化

## 任务列表

### Phase 1: 合并 shared-with-me + group-share

- [ ] T-001: 补充 group-share 缺失的 i18n 翻译 key（zh-cn.ts + en-us.ts），覆盖权限标签(下载/上传/编辑/删除)、表格列头(文件名/分享者/权限/大小/分享时间/过期时间/修改时间)、操作文案(退出共享/返回/已选中N项)、消息提示(预览不支持/下载失败/关闭视频/退出成功)、永久有效/来自等
      文件: src/locales/langs/zh-cn.ts, src/locales/langs/en-us.ts, src/typings/app.d.ts (PageGroupShare 类型)
      验收: 所有 group-share 中的硬编码中文都有对应的 i18n key，且类型定义完整
      依赖: 无

- [ ] T-002: 新建 share-list-page.vue 通用分享列表组件，接受 props: shareType('user'|'dept'), showFilter(boolean)。将 shared-with-me/index.vue 和 group-share/index.vue 的公共逻辑合并：分页列表 + 文件夹浏览双模式、enterSharedFolder/exitSharedFolder/getFolderContents/breadcrumbClick、handleFileDblClick 预览路由、handleShareFile、handleRenameConfirm、handleBatchCancel (根据 shareType 自动选择 cancel API)、handleDownload、handleCtxMenuSelect、表格列定义(shareColumns/folderColumns 根据 shareType 条件渲染来源列和 pending 列)、移动端卡片布局、上下文菜单、音频/视频/图片预览。shareType='user' 额外渲染：搜索过滤栏、pending 接受/拒绝按钮、保存到网盘、来源列、权限过滤上下文菜单
      文件: src/views/shared-with-me/modules/share-list-page.vue (新建)
      验收: 组件接受 shareType 和 showFilter props，所有 shareType 相关差异通过条件分支处理；所有文本使用 i18n；lang="tsx" 仅用于 column render 函数
      依赖: T-001

- [ ] T-003: 重写 shared-with-me/index.vue 为薄壳，仅引用 ShareListPage 并传 shareType='user' showFilter=true
      文件: src/views/shared-with-me/index.vue
      验收: 页面功能与原版完全一致（搜索过滤、pending 接受/拒绝、保存到网盘、来源列、权限过滤菜单）；行数 < 30
      依赖: T-002

- [ ] T-004: 重写 group-share/index.vue 为薄壳，仅引用 ShareListPage 并传 shareType='dept' showFilter=false
      文件: src/views/group-share/index.vue
      验收: 页面功能与原版完全一致（无搜索过滤、无 pending、无保存到网盘）；硬编码中文已替换为 i18n；行数 < 30
      依赖: T-002

- [ ] T-005: Phase 1 验证 — 运行 pnpm typecheck + pnpm lint，用户手动测试 shared-with-me 和 group-share 的全部功能
      文件: 无新增
      验收: typecheck 零错误；lint 无新增错误；用户确认两个页面功能不变
      依赖: T-003, T-004

### Phase 2: 提取 useFilePreview composable

- [ ] T-006: 新建 use-file-preview.ts，封装视频/音频/图片预览状态和操作。接收 fileList: Ref<Api.Disk.FileItem[]> 和 onPreviewFile 回调。导出：视频(videoPreviewFile, videoPreviewVisible, videoStreamBaseUrl, openVideoPreview, closeVideoPreview, handleVideoTokenUpdate)、音频(audioPreviewVisible, currentAudioIndex, audioPlaylist, openAudioPreview, closeAudioPreview, handleAudioOverlayClick)、图片(imagePreviewRef, openImagePreview)、通用 handleFileDblClick
      文件: src/hooks/business/disk/use-file-preview.ts (新建)
      验收: 导出接口与 design.md 一致；TypeScript 编译通过；所有状态使用 ref/computed 管理
      依赖: T-005

- [ ] T-007: 重构 disk/index.vue，用 useFilePreview 替换内联的视频/音频/图片预览代码，删除对应 ref/function/模板绑定，改用 composable 返回值
      文件: src/views/disk/index.vue
      验收: disk 页面的视频/音频/图片预览功能与原版一致；代码行数减少
      依赖: T-006

- [ ] T-008: 重构 recent/index.vue，用 useFilePreview 替换内联预览代码
      文件: src/views/recent/index.vue
      验收: recent 页面的预览功能与原版一致
      依赖: T-006

- [ ] T-009: 重构 share-list-page.vue（Phase 1 合并后的通用组件），用 useFilePreview 替换内联预览代码
      文件: src/views/shared-with-me/modules/share-list-page.vue
      验收: shared-with-me 和 group-share 的预览功能与原版一致
      依赖: T-006, T-002

- [ ] T-010: Phase 2 验证 — pnpm typecheck + pnpm lint + 用户测试 disk/recent/shared-with-me/group-share 的预览功能
      文件: 无新增
      验收: typecheck 零错误；lint 无新增错误；视频/音频/图片/文本预览全部正常
      依赖: T-007, T-008, T-009

### Phase 3: 提取工具 composables

- [ ] T-011: 新建 src/utils/disk-format.ts，提取 formatDateTime(dateStr)、formatDateShort(dateStr)、contentTypeToFileType(contentType, isFolder) 三个纯函数
      文件: src/utils/disk-format.ts (新建)
      验收: 函数签名和返回值与原 my-share/shared-with-me/group-share 中的实现一致
      依赖: T-005

- [ ] T-012: 新建 use-file-download.ts，封装 triggerBrowserDownload(downloadUrl) 和 handleDownload(files) (含权限检查 fetchIsAllowDownload/fetchIsAllowPackageDownload)，统一单文件/多文件下载路由
      文件: src/hooks/business/disk/use-file-download.ts (新建)
      验收: 下载流程（权限检查→URL获取→浏览器触发）与原版一致
      依赖: T-005

- [ ] T-013: 重构 disk/index.vue, share-list-page.vue, my-share/index.vue，用 disk-format 工具和 use-file-download 替换内联的格式化函数和下载代码
      文件: src/views/disk/index.vue, src/views/shared-with-me/modules/share-list-page.vue, src/views/my-share/index.vue
      验收: 格式化显示和下载功能与原版一致
      依赖: T-011, T-012

- [ ] T-014: Phase 3 验证 — pnpm typecheck + pnpm lint + 用户测试下载和格式化功能
      文件: 无新增
      验收: typecheck 零错误；lint 无新增错误；下载、文件大小/时间格式化显示正常
      依赖: T-013

### Phase 4: 提取 useSimpleFileListPage composable

- [ ] T-015: 新建 use-simple-file-list.ts，封装 toggleView()、handleClearSelection()、handleSelectionChange(files)、showEmpty 计算属性、handleSort(field, order)。接收 fileList/ loading ref、sortFields 映射、onGetData 回调
      文件: src/hooks/business/disk/use-simple-file-list.ts (新建)
      验收: 导出接口与 design.md 一致；TypeScript 编译通过
      依赖: T-005

- [ ] T-016: 重构 favorite/index.vue，用 useSimpleFileList 替换内联的视图切换/选择/排序/空状态代码
      文件: src/views/favorite/index.vue
      验收: favorite 页面的视图切换、选择、排序、空状态功能与原版一致
      依赖: T-015

- [ ] T-017: 重构 trash/index.vue，用 useSimpleFileList 替换内联代码
      文件: src/views/trash/index.vue
      验收: trash 页面功能与原版一致
      依赖: T-015

- [ ] T-018: 最终验证 — pnpm typecheck + pnpm lint + 用户全量回归测试所有网盘页面
      文件: 无新增
      验收: typecheck 零错误；lint 无新增错误；disk/favorite/recent/trash/my-share/shared-with-me/group-share 功能全部正常
      依赖: T-016, T-017

## 任务拓扑

```
Phase 1:
T-001 (i18n keys)
  │
  └→ T-002 (share-list-page.vue 通用组件)
       ├→ T-003 (shared-with-me 薄壳)
       └→ T-004 (group-share 薄壳)
            │
          T-005 (Phase 1 验证)

Phase 2 (依赖 Phase 1):
T-006 (use-file-preview.ts)
  ├→ T-007 (disk 重构)
  ├→ T-008 (recent 重构)
  └→ T-009 (share-list-page 重构)
       │
     T-010 (Phase 2 验证)

Phase 3 (可与 Phase 2 并行):
T-011 (disk-format.ts)  T-012 (use-file-download.ts)
  │                          │
  └──────────┬───────────────┘
             │
          T-013 (三文件重构)
             │
          T-014 (Phase 3 验证)

Phase 4:
T-015 (use-simple-file-list.ts)
  ├→ T-016 (favorite 重构)
  └→ T-017 (trash 重构)
       │
     T-018 (最终验证)
```

可并行:
- Phase 2 + Phase 3 之间无依赖，可并行执行
- T-007, T-008, T-009 互相独立，可并行
- T-016, T-017 互相独立，可并行

## 总计: 18 个任务, 4 个 Phase

## 对抗审查记录

CC 独立审查:
1. **i18n key 位置**: 现有 group-share 的 i18n key 分散在 page.disk.groupShare 和 page.shared-with-me 下，合并时需要统一为一个命名空间。T-001 需确保 key 不冲突。
2. **disk/index.vue 的 store 依赖**: disk 的音频/视频预览状态存在 diskStore 中（非本地 ref），useFilePreview 需要同时支持 store 和本地 ref 两种模式。T-006 设计时需注意。
3. **share-list-page.vue 的复杂度**: 合并后组件预计 600-700 行（原两个文件 2300+ 行），虽然大幅减少但仍需保持可读性。内部函数按功能分组并加注释。
4. **my-share 未合并**: my-share 结构差异较大（表格+卡片双布局，无文件夹浏览），不适合与 shared-with-me/group-share 合并，仅提取格式化工具函数。
5. **hooks 目录结构**: 新建 hooks/business/disk/ 子目录，遵循 upload/ 子目录的先例。
