# Design: 网盘模块组件复用优化

## Status: APPROVED
## Date: 2026-05-17
## Supersedes: 内部分享功能完善 (已完成)

## Overview
网盘模块（disk, favorite, recent, trash, my-share, shared-with-me, group-share）存在大量重复代码。
通过渐进式提取 composable 和合并相似组件，预计消除 ~1200 行重复代码。

## Constraints
- **MUST**: 功能不变，所有现有行为完整保留
- **MUST**: 每个阶段独立可验证
- **MUST**: 统一国际化（消除硬编码中文）
- **SHOULD**: TSX 渲染函数尽量放入 composable，页面使用 lang="ts"
- **COULD**: 简化 toolbar 的重复逻辑

## Phases

### Phase 1: 合并 shared-with-me + group-share
**Priority**: P0 (收益最大 ~500 行)

**核心差异点与参数化**:
| 差异 | shared-with-me | group-share | 参数化方式 |
|---|---|---|---|
| API shareType | `'user'` | `'dept'` | prop: `shareType` |
| 取消分享 API | fetchRejectInternalShare | fetchCancelInternalShare | 根据 shareType 自动切换 |
| 搜索/过滤栏 | 有 | 无 | prop: `showFilter` |
| Pending 状态 | 有（接受/拒绝） | 无 | 根据 shareType 条件渲染 |
| 保存到网盘 | 有 | 无 | 根据 shareType 条件渲染 |
| 来源列 | 有 | 无 | 根据 shareType 条件渲染 |
| 上下文菜单 | 动态权限过滤 | 静态 | 统一为动态方式 |
| 国际化 | 完全 i18n | 混合硬编码 | 统一 i18n |

**文件变更**:
| 文件 | 操作 |
|---|---|
| `src/views/shared-with-me/modules/share-list-page.vue` | 新建：通用分享列表组件 |
| `src/views/shared-with-me/index.vue` | 重写：引用通用组件，shareType='user' |
| `src/views/group-share/index.vue` | 重写：引用通用组件，shareType='dept' |

**Acceptance**:
- [ ] shared-with-me 功能与优化前完全一致
- [ ] group-share 功能与优化前完全一致
- [ ] 硬编码中文全部替换为 i18n

### Phase 2: 提取 useFilePreview composable
**Priority**: P1 (~150 行 × 4 文件受益)

**新建文件**: `src/hooks/business/disk/use-file-preview.ts`

**导出接口**:
```typescript
interface UseFilePreviewOptions {
  fileList: Ref<Api.Disk.FileItem[]>;
  onPreviewFile?: (file: Api.Disk.FileItem) => void;  // 文本/Office/PDF 预览回调
}

function useFilePreview(options: UseFilePreviewOptions) {
  return {
    // 视频
    videoPreviewFile, videoPreviewVisible, videoStreamBaseUrl,
    openVideoPreview, closeVideoPreview, handleVideoTokenUpdate,
    // 音频
    audioPreviewVisible, currentAudioIndex, audioPlaylist,
    openAudioPreview, closeAudioPreview, handleAudioOverlayClick,
    // 图片
    imagePreviewRef, openImagePreview,
    // 通用
    handleFileDblClick,
  };
}
```

**修改文件**: disk/index.vue, recent/index.vue, 合并后的 share-list-page.vue

**Acceptance**:
- [ ] disk 页面预览功能不变
- [ ] recent 页面预览功能不变
- [ ] 分享页面预览功能不变

### Phase 3: 提取工具 composables
**Priority**: P2 (~100 行)

**新建文件**:
- `src/hooks/business/disk/use-file-download.ts` — triggerBrowserDownload + 下载权限检查
- `src/utils/disk-format.ts` — formatDateTime, formatDateShort, contentTypeToFileType

**修改文件**: disk/index.vue, share-list-page.vue, my-share/index.vue

**Acceptance**:
- [ ] 下载功能不变
- [ ] 格式化显示不变

### Phase 4: 提取 useSimpleFileListPage composable
**Priority**: P3 (~40 行 × 3)

**新建文件**: `src/hooks/business/disk/use-simple-file-list.ts`

**导出接口**:
```typescript
interface UseSimpleFileListOptions {
  fileList: Ref<any[]>;
  loading: Ref<boolean>;
  sortFields: Record<string, string>;
  onGetData: () => Promise<void>;
}

function useSimpleFileList(options) {
  return {
    toggleView, handleClearSelection, handleSelectionChange,
    showEmpty, handleSort,
  };
}
```

**修改文件**: favorite/index.vue, trash/index.vue

**Acceptance**:
- [ ] favorite 功能不变
- [ ] trash 功能不变

## Global Acceptance Criteria
- [ ] pnpm typecheck 通过
- [ ] pnpm lint 通过
- [ ] 无硬编码中文（统一 i18n）
- [ ] 每阶段完成后用户手动验证功能

## TSX 影响评估
- 当前 18 个文件使用 lang="tsx"，主要用于 NDataTable 的 column render 函数
- 提取 composable 后，TSX render 函数放入 composable 返回，页面只需 lang="ts"
- 合并 shared-with-me/group-share 后少维护一份 TSX 代码
- TSX 不影响组件提取，因为 render 函数本质是普通 TypeScript 函数
