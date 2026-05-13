# Design Spec — 内部分享功能完善

## 需求 (MUST/SHOULD/COULD)

### MUST (必须实现)
- 分享对话框根据文件类型过滤权限：文件隐藏 UPLOAD，文件夹显示全部4项
- shared-with-me 表格页：展示共享给当前用户的文件列表
- group-share 表格页：展示部门级别的分享（shareType=dept）
- 前端 TypeScript 类型定义：新增 SharedWithMeItem

### SHOULD (应该实现)
- 移动端响应式：shared-with-me 和 group-share 页面适配卡片布局
- 双击文件触发下载（有 DOWNLOAD 权限时）

### COULD (可以实现)
- 后端文件操作权限验证（单独排期）
- 接受/拒绝分享交互（后续迭代）
- shared-with-me 页面按 shareType 参数后端过滤

## 技术方案

### 1. 分享对话框权限过滤
- `share-dialog.vue` 新增 computed `availablePermissions`
- 根据 `shareFile.isFolder` 返回不同权限选项
- 用户分享和部门分享 Tab 均使用该 computed
- 文件类型时过滤掉 UPLOAD；文件夹时保留全部

### 2. shared-with-me 表格页
- 调用 `fetchGetSharedWithMeList` API
- 表格列：文件名(图标+名称)、分享者、权限(NTag)、大小、分享时间、过期时间
- 分页 + 排序
- 移动端切换卡片布局

### 3. group-share 表格页
- 调用同一 API，前端过滤 `shareType === 'dept'`
- 表格列与 shared-with-me 一致
- 独立页面，结构复用

### 4. 类型定义
- `disk.api.d.ts` 新增 `SharedWithMeItem` 类型，对齐后端 `SharedWithMeItem` 响应

## 改动文件清单
| 文件 | 改动 |
|------|------|
| `src/views/disk/modules/share-dialog.vue` | 权限选项改为 computed，按文件类型过滤 |
| `src/views/shared-with-me/index.vue` | 重写，表格展示共享给我的文件 |
| `src/views/group-share/index.vue` | 重写，表格展示部门分享 |
| `src/typings/api/disk.api.d.ts` | 新增 SharedWithMeItem 类型 |

## 验收标准
- [ ] 分享文件时权限选项只有 DOWNLOAD/PUT/DELETE（无 UPLOAD）
- [ ] 分享文件夹时权限选项有全部4项
- [ ] shared-with-me 页面正确展示共享给我的文件列表
- [ ] group-share 页面只展示部门级别的分享
- [ ] 权限以 NTag 标签形式展示
- [ ] 分页正常工作
- [ ] 移动端卡片布局正常
- [ ] pnpm typecheck 通过
- [ ] pnpm lint 通过

## 非功能需求
- 性能: 列表分页加载，无一次性全量查询
- 安全: 前端权限过滤为 UX 优化，非安全措施；后端验证后续补充
