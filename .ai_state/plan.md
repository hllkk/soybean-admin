# Plan — 内部分享功能完善

## 任务列表

- [ ] T-001: 新增 SharedWithMeItem 类型定义，对齐后端 SharedWithMeItem 响应结构
      文件: src/typings/api/disk.api.d.ts
      验收: typecheck 通过，类型包含 fileShareId/fileId/fileName/isFolder/contentType/size/shareUserId/shareUserName/shareType/permissions/expireDate/status/remark/createdAt
      依赖: 无

- [ ] T-002: 修改 internal-share.ts 的 fetchGetSharedWithMeList 返回类型为 Api.Disk.SharedWithMeList
      文件: src/service/api/disk/internal-share.ts
      验收: 函数签名使用强类型替代 any[]
      依赖: T-001

- [ ] T-003: share-dialog.vue 新增 availablePermissions computed，根据 shareFile.isFolder 过滤权限选项，同时应用于用户分享和部门分享 Tab
      文件: src/views/disk/modules/share-dialog.vue
      验收: 分享文件时权限无 UPLOAD，分享文件夹时有全部4项；切换文件类型时重置已选权限
      依赖: 无

- [ ] T-004: 后端 InternalShareListRequest 增加 ShareType 字段，service 层 GetSharedWithMeList 增加按 shareType 过滤
      文件: backend/model/disk/request/disk_internal_share.go, backend/service/disk/disk_internal_share.go
      验收: 传入 shareType=user 只返回用户分享，shareType=dept 只返回部门分享，不传返回全部；total 与实际过滤后数据一致
      依赖: 无

- [ ] T-005: 重写 shared-with-me/index.vue，表格展示共享给我的文件列表（分页+移动端卡片），调用 API 传 shareType=user
      文件: src/views/shared-with-me/index.vue
      验收: 表格列（文件名+图标、分享者、权限NTag、大小、分享时间、过期时间）正确渲染；分页正常；移动端卡片布局正常；空状态显示 FileEmpty
      依赖: T-001, T-002, T-004

- [ ] T-006: 重写 group-share/index.vue，表格展示部门分享，调用 API 传 shareType=dept
      文件: src/views/group-share/index.vue
      验收: 只展示部门分享记录；表格列与 shared-with-me 一致；分页由后端精确返回；空状态显示 FileEmpty
      依赖: T-001, T-002, T-004

- [ ] T-007: 全局验证 — 后端 go build + 前端 pnpm typecheck + pnpm lint 通过
      文件: 无新增
      验收: go build 相关包零错误；typecheck 零错误；lint 无新增错误
      依赖: T-001 ~ T-006

## 任务拓扑

```
T-001 (前端类型)  T-003 (权限过滤)  T-004 (后端 shareType 参数)
  │                                      │
  └─→ T-002 (前端 API 类型)              │
       │                                  │
       ├─→ T-005 (shared-with-me) ←──────┘
       └─→ T-006 (group-share)    ←──────┘
                    │
              T-007 (全局验证)
```

可并行: T-001 + T-003 + T-004
串行: T-001 → T-002 → T-005/T-006 → T-007

## 总计: 7 个任务

## 对抗审查记录
CC 独立审查:
- T-005 分页已通过后端 shareType 参数解决，total 精确
- 权限默认值：T-003 中切换文件类型时需重置已选权限，watch shareFile 或 computed setter 中处理
- group-share 和 shared-with-me 结构高度相似，可提取共享组件，但当前先用 copy-paste 保持简单，后续 refactor 清理
