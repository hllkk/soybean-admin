# 文件上传组件设计文档

## 概述

为网盘系统实现高性能文件上传组件，支持分片上传、秒传、暂停/续传、并发控制、拖拽上传等核心功能。

## 技术决策

- **方案**：自研上传引擎（方案 A）
- **理由**：后端 API 已就绪，现有 transfer-panel 和 disk store 架构可复用，完全可控无第三方依赖
- **存储**：同时支持本地存储和对象存储

## 文件结构

```
src/
├── hooks/business/upload/
│   ├── use-uploader.ts              # 主入口 composable，暴露上传 API
│   ├── uploader-engine.ts           # 上传引擎：队列管理、并发控制、状态机
│   ├── chunk-manager.ts             # 分片管理：动态分片、断点续传、hash 计算
│   └── instant-check.ts             # 秒传检测：文件标识生成 + 服务端校验
├── typings/
│   └── upload.d.ts                  # 上传相关类型定义
├── components/custom/
│   └── upload-trigger.vue           # 全局上传触发器（拖拽区域 + 文件选择）
├── views/disk/modules/
│   ├── transfer-panel.vue           # 【改造】增强：暂停/继续/重试按钮
│   └── toolbar.vue                  # 【改造】上传按钮对接新引擎
└── store/modules/disk/
    └── index.ts                     # 【改造】增加上传任务状态管理
```

## 核心模块设计

### 上传状态机

```
pending → hashing → checking → uploading → merging → completed
                              ↓      ↓        ↓
                           paused  failed   failed
                              ↓      ↓        ↓
                           uploading retry→uploading  retry→merging
```

### uploader-engine.ts — 上传引擎

核心职责：队列管理、并发控制、状态机流转。

```typescript
class UploaderEngine {
  private queue: UploadTask[]
  private activePool: Map<string, AbortController>
  private maxConcurrent: number     // 默认 3
  private autoUpload: boolean       // 默认 true，可配置

  addTask(file: File, parentId: number): UploadTask
  pause(taskId: string): void
  resume(taskId: string): void
  cancel(taskId: string): void
  retry(taskId: string): void
  pauseAll(): void
  resumeAll(): void
  private schedule(): void          // 从 queue 取任务填入 activePool
}
```

状态变更同步写入 disk store，UI 自动响应。

### chunk-manager.ts — 分片管理

动态分片策略：

| 文件大小 | 分片策略 | 分片大小 |
|----------|----------|----------|
| < 10MB | 不分片，整文件上传 | - |
| 10MB - 100MB | 固定分片 | 5MB |
| 100MB - 1GB | 固定分片 | 10MB |
| > 1GB | 固定分片 | 20MB |

关键能力：
- 使用 Blob.slice() 切片，不加载文件到内存
- 断点续传：记录已上传分片序号，服务端返回已完成分片列表，跳过已传分片
- 单个大文件内部并发上传分片（最多 3 个分片并行）

### instant-check.ts — 秒传检测

流程：
1. 使用 SparkMD5 分片读取计算文件内容 MD5 hash（不阻塞主线程）
2. 调用后端接口 `POST /disk/file/check` 传入 hash + fileSize + fileName
3. 后端返回 `exists: true` → 秒传成功；`exists: false, uploadedChunks: []` → 正常上传

### use-uploader.ts — 主入口 Composable

```typescript
const { upload, pause, resume, cancel, retry, pauseAll, resumeAll } = useUploader()

upload(files: File[], parentId: number)
upload(folder: FileList, parentId: number)  // webkitdirectory
```

内部创建或复用 UploaderEngine 实例，状态变更通过 disk store 同步到 transfer-panel。

## 前后端 API 接口约定

> 先行定义，后续对接实际后端接口时调整。

### 秒传检测

```
POST /disk/file/check
Request:  { fileHash: string, fileName: string, fileSize: number, parentId: number }
Response: { exists: boolean, fileId?: string, uploadedChunks?: number[] }
```

- `exists=true` → 秒传完成
- `exists=false, uploadedChunks=[]` → 全量上传
- `exists=false, uploadedChunks=[0,1,3]` → 断点续传

### 分片上传

```
POST /disk/file/chunk
Content-Type: multipart/form-data
Request:  { file: Blob, fileHash: string, chunkIndex: number, totalChunks: number, fileName: string, parentId: number }
Response: { success: boolean }
```

### 合并分片

```
POST /disk/file/merge
Request:  { fileHash: string, fileName: string, fileSize: number, totalChunks: number, parentId: number }
Response: { fileId: string, url: string }
```

### 整文件上传（小文件）

```
POST /disk/file/upload
Content-Type: multipart/form-data
Request:  { file: File, parentId: number }
Response: { fileId: string, url: string }
```

复用现有 `fetchUploadFile`，小文件不走分片流程。

## UI/UX 集成设计

### 全局上传触发（upload-trigger.vue）

1. **全局拖拽层**：监听 document 的 dragenter/dragover/dragleave/drop，拖入文件时全屏半透明遮罩提示"释放文件上传"
2. **文件选择**：隐藏 `<input type="file" multiple>` + webkitdirectory 属性切换文件夹模式，暴露 triggerFile() 和 triggerFolder() 方法
3. 注册在全局 layout 中，始终存在但无拖拽时不可见

### toolbar 改造

- 点击上传按钮 → upload-trigger 的文件选择
- 下拉菜单 → "上传文件" / "上传文件夹"
- 按钮右上角显示上传中数量 badge

### transfer-panel 改造

每行操作按钮：

| 状态 | 操作按钮 |
|------|----------|
| pending | 取消 |
| hashing/checking | 取消（显示计算中） |
| uploading | 暂停、取消 |
| paused | 继续、取消 |
| failed | 重试、取消 |
| completed | 无 |

底部新增"全部暂停 / 全部继续"操作栏。进度信息增强：百分比 + 已上传/总大小 + 速度 + 剩余时间 + 分片进度。

### 球体视图

状态机新增 hashing / paused 状态的颜色映射，水球图逻辑不变。

## 错误处理与重试策略

### 重试机制

| 场景 | 策略 |
|------|------|
| 单个分片上传失败 | 自动重试最多 3 次，指数退避（1s → 2s → 4s） |
| 整文件上传失败 | 不自动重试，标记 failed，用户手动点击重试 |
| 秒传检测失败 | 降级为普通上传 |
| 合并分片失败 | 自动重试 2 次，仍失败则标记 failed |
| 网络断开 | 自动暂停全部任务，恢复后手动继续 |

### 文件校验

- 上传前：计算文件 hash（大文件在 Worker 线程），用于秒传检测
- 上传后：后端返回 fileId + fileSize 前端确认

### 并发池管理

```
maxConcurrent = 3
activePool: [TaskA, TaskB, TaskC]
queue:      [TaskD, TaskE]

TaskB 完成 → TaskD 自动进入 activePool
TaskC 暂停 → TaskE 自动进入 activePool
```

暂停的任务释放并发槽位，引擎自动填补。

### 全局拖拽防护

- 拖拽区域排除 input/textarea 等可编辑元素
- 拖入非文件内容忽略
- 多次 dragenter 计数去重，防止闪烁

## 依赖

- SparkMD5 — 文件 hash 计算（轻量，约 10KB）
