# Disk Inline File & Folder Creation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the modal-based folder creation and missing file creation with inline placeholder cards/rows where users type the name directly.

**Architecture:** A `creatingType` state in the disk store drives both grid and list views. When set, a placeholder item with an inline `NInput` renders as the first item. Enter calls the API, Escape/blur cancels. Client-side auto-rename resolves name conflicts before the API call.

**Tech Stack:** Vue 3, Naive UI (NInput), Pinia store, TypeScript

---

### Task 1: Add `fetchCreateFile` API function and types

**Files:**
- Modify: `src/typings/api/disk.api.d.ts` — add `CreateFileParams`
- Modify: `src/service/api/disk/file.ts` — add `fetchCreateFile`

- [ ] **Step 1: Add `CreateFileParams` type to `src/typings/api/disk.api.d.ts`**

Insert after the `CreateFolderParams` type (around line 76):

```ts
    /** 新建文件参数 */
    type CreateFileParams = {
      /** 文件名（含扩展名） */
      fileName: string;
      /** 当前目录路径 */
      folderPath: string;
    };
```

- [ ] **Step 2: Add `fetchCreateFile` to `src/service/api/disk/file.ts`**

Import `useAuthStore` is already present. Add after `fetchCreateFolder` (after line 118):

```ts
/** 新建空文件 */
export function fetchCreateFile(data: Api.Disk.CreateFileParams) {
  const userId = Number(useAuthStore().userInfo.userId);
  return request<boolean>({
    url: '/file-meta/create',
    method: 'post',
    data: { ...data, userId }
  });
}
```

- [ ] **Step 3: Export from `src/service/api/disk/index.ts`**

Add `fetchCreateFile` to the re-export:

```ts
export * from './file';
```

(This already exports everything, so no change needed — verify it works.)

- [ ] **Step 4: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/typings/api/disk.api.d.ts src/service/api/disk/file.ts
git commit -m "feat(disk): add fetchCreateFile API and CreateFileParams type"
```

---

### Task 2: Add i18n keys for default placeholder names

**Files:**
- Modify: `src/locales/langs/zh-cn.ts`
- Modify: `src/locales/langs/en-us.ts`
- Modify: `src/typings/app.d.ts`

- [ ] **Step 1: Add keys to zh-cn.ts**

In the `page.disk` section, add after the `contextMenu` block. Find the line with `form:` under disk and add before it:

```ts
      createInline: {
        defaultFileName: '新建文件.txt',
        defaultFolderName: '新建文件夹',
        emptyName: '名称不能为空'
      },
```

- [ ] **Step 2: Add keys to en-us.ts**

Same location:

```ts
      createInline: {
        defaultFileName: 'New File.txt',
        defaultFolderName: 'New Folder',
        emptyName: 'Name cannot be empty'
      },
```

- [ ] **Step 3: Add type definition to `src/typings/app.d.ts`**

In the disk page type, add after `contextMenu`:

```ts
          createInline: {
            defaultFileName: string;
            defaultFolderName: string;
            emptyName: string;
          };
```

- [ ] **Step 4: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/locales/langs/zh-cn.ts src/locales/langs/en-us.ts src/typings/app.d.ts
git commit -m "feat(disk): add i18n keys for inline creation placeholder names"
```

---

### Task 3: Add `creatingType` state and actions to disk store

**Files:**
- Modify: `src/store/modules/disk/index.ts`

- [ ] **Step 1: Add state and actions**

After the `selectedFiles` ref (around line 65), add:

```ts
  // 内联创建状态
  const creatingType = ref<'file' | 'folder' | null>(null);
```

After `clearSelection` function (around line 218), add:

```ts
  // 开始内联创建
  function startCreating(type: 'file' | 'folder') {
    creatingType.value = type;
  }

  // 取消内联创建
  function cancelCreating() {
    creatingType.value = null;
  }
```

Add to the return statement:

```ts
    // state
    creatingType,
    // actions
    startCreating,
    cancelCreating,
```

- [ ] **Step 2: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/store/modules/disk/index.ts
git commit -m "feat(disk): add creatingType state to disk store"
```

---

### Task 4: Add auto-rename utility

**Files:**
- Create: `src/views/disk/utils/resolve-name-conflict.ts`

- [ ] **Step 1: Create the utility**

```ts
/**
 * Resolve name conflicts by appending (1), (2), etc.
 * e.g. "file.txt" → "file(1).txt" if "file.txt" exists
 */
export function resolveNameConflict(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) return baseName;

  const lastDotIndex = baseName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? baseName.slice(0, lastDotIndex) : baseName;
  const ext = lastDotIndex > 0 ? baseName.slice(lastDotIndex) : '';

  let i = 1;
  while (existingNames.includes(`${nameWithoutExt}(${i})${ext}`)) {
    i++;
  }
  return `${nameWithoutExt}(${i})${ext}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/disk/utils/resolve-name-conflict.ts
git commit -m "feat(disk): add resolveNameConflict utility"
```

---

### Task 5: Wire toolbar to disk store's `startCreating`

**Files:**
- Modify: `src/views/disk/modules/toolbar.vue`

- [ ] **Step 1: Update `handleCreateSelect`**

Replace the existing function (around line 150):

```ts
// 处理新建选择
function handleCreateSelect(key: string) {
  if (key === 'createFile') {
    diskStore.startCreating('file');
  } else if (key === 'createFolder') {
    diskStore.startCreating('folder');
  }
}
```

- [ ] **Step 2: Remove the `createFolder` emit**

Remove `(e: 'createFolder'): void;` from the `Emits` interface since we no longer emit to the parent — the toolbar directly drives the store.

- [ ] **Step 3: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS (index.vue will need the `@create-folder` handler removed in Task 8, but that's not a typecheck error since the event listener just won't fire)

- [ ] **Step 4: Commit**

```bash
git add src/views/disk/modules/toolbar.vue
git commit -m "feat(disk): wire toolbar create buttons to disk store startCreating"
```

---

### Task 6: Add inline creation placeholder to file-grid.vue

**Files:**
- Modify: `src/views/disk/modules/file-grid.vue`

- [ ] **Step 1: Add imports**

Add to imports at top of script:

```ts
import { $t } from '@/locales';
import { resolveNameConflict } from '../utils/resolve-name-conflict';
```

- [ ] **Step 2: Add emits for creation**

Add two new emits to the `Emits` interface:

```ts
  (e: 'fileCreated'): void;
  (e: 'folderCreated'): void;
```

- [ ] **Step 3: Add inline creation state and handlers**

After the existing `handleContextSelect` function, add:

```ts
// --- 内联创建 ---
const createInputRef = ref<InstanceType<typeof NInput>>();
const createName = ref('');

watch(() => diskStore.creatingType, type => {
  if (type === 'file') {
    createName.value = $t('page.disk.createInline.defaultFileName');
  } else if (type === 'folder') {
    createName.value = $t('page.disk.createInline.defaultFolderName');
  }
});

function handleCreateConfirm() {
  const name = createName.value.trim();
  if (!name) {
    window.$message?.warning($t('page.disk.createInline.emptyName'));
    return;
  }

  const existingNames = props.files.map(f => f.fileName);
  const resolvedName = resolveNameConflict(name, existingNames);

  if (diskStore.creatingType === 'file') {
    emit('fileCreated', resolvedName);
  } else if (diskStore.creatingType === 'folder') {
    emit('folderCreated', resolvedName);
  }
}

function handleCreateCancel() {
  diskStore.cancelCreating();
  createName.value = '';
}

function handleCreateKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleCreateConfirm();
  } else if (e.key === 'Escape') {
    handleCreateCancel();
  }
}
```

- [ ] **Step 4: Add placeholder card to template**

In the template, inside the grid `<div class="grid ...">`, add this BEFORE the `<FileCard v-for>`:

```vue
        <!-- 内联创建占位卡片 -->
        <div
          v-if="diskStore.creatingType"
          class="flex flex-col items-center px-8px py-16px rd-8px bg-primary/5 dark:bg-primary/10"
        >
          <div class="mb-8px mt-16px">
            <FileIcon
              :file-type="diskStore.creatingType === 'folder' ? 'folder' : 'other'"
              size="large"
            />
          </div>
          <div class="w-full px-4px">
            <NInput
              ref="createInputRef"
              v-model:value="createName"
              size="small"
              autofocus
              @keydown="handleCreateKeydown"
              @blur="handleCreateCancel"
            />
          </div>
        </div>
```

- [ ] **Step 5: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/views/disk/modules/file-grid.vue
git commit -m "feat(disk): add inline creation placeholder to file grid"
```

---

### Task 7: Add inline creation placeholder to file-list.vue

**Files:**
- Modify: `src/views/disk/modules/file-list.vue`

- [ ] **Step 1: Add imports**

Add to imports:

```ts
import { $t } from '@/locales';
import { resolveNameConflict } from '../utils/resolve-name-conflict';
```

- [ ] **Step 2: Add emits**

Add to the `Emits` interface:

```ts
  (e: 'fileCreated', name: string): void;
  (e: 'folderCreated', name: string): void;
```

- [ ] **Step 3: Add inline creation state and handlers**

After `getRowKey`, add:

```ts
// --- 内联创建 ---
const createName = ref('');

watch(() => diskStore.creatingType, type => {
  if (type === 'file') {
    createName.value = $t('page.disk.createInline.defaultFileName');
  } else if (type === 'folder') {
    createName.value = $t('page.disk.createInline.defaultFolderName');
  }
});

function handleCreateConfirm() {
  const name = createName.value.trim();
  if (!name) {
    window.$message?.warning($t('page.disk.createInline.emptyName'));
    return;
  }

  const existingNames = props.files.map(f => f.fileName);
  const resolvedName = resolveNameConflict(name, existingNames);

  if (diskStore.creatingType === 'file') {
    emit('fileCreated', resolvedName);
  } else if (diskStore.creatingType === 'folder') {
    emit('folderCreated', resolvedName);
  }
}

function handleCreateCancel() {
  diskStore.cancelCreating();
  createName.value = '';
}

function handleCreateKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleCreateConfirm();
  } else if (e.key === 'Escape') {
    handleCreateCancel();
  }
}
```

- [ ] **Step 4: Add placeholder row to template**

In the template, inside the `<div class="h-full flex flex-col">`, add this BEFORE the `<NDataTable>` (after `<FileEmpty>` and the v-else):

Replace the `<NDataTable v-else` with a template that includes both the placeholder and the table. Change the structure so the placeholder appears as the first row above the NDataTable:

```vue
    <!-- 内联创建占位行 -->
    <div
      v-if="diskStore.creatingType && !showEmpty"
      class="flex items-center gap-8px px-12px py-8px bg-primary/5 dark:bg-primary/10"
    >
      <div class="flex items-center gap-8px flex-1">
        <FileIcon
          :file-type="diskStore.creatingType === 'folder' ? 'folder' : 'other'"
          size="small"
        />
        <NInput
          v-model:value="createName"
          size="small"
          autofocus
          class="max-w-300px"
          @keydown="handleCreateKeydown"
          @blur="handleCreateCancel"
        />
      </div>
    </div>

    <!-- 文件列表 -->
    <NDataTable
      v-if="!showEmpty"
      :columns="columns"
      :data="files"
      :loading="loading"
      :checked-row-keys="diskStore.selectedFiles"
      :row-key="getRowKey"
      :row-props="getRowProps"
      size="small"
      :flex-height="!isMobile"
      class="flex-1"
      @update:checked-row-keys="handleCheckedRowKeysChange"
    />
```

Note: remove the `v-else` from NDataTable and use `v-if="!showEmpty"` instead so both the placeholder and table can coexist.

- [ ] **Step 5: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/views/disk/modules/file-list.vue
git commit -m "feat(disk): add inline creation placeholder to file list"
```

---

### Task 8: Wire up creation handlers in index.vue

**Files:**
- Modify: `src/views/disk/index.vue`

- [ ] **Step 1: Update imports**

Change the import line:

```ts
import { fetchGetFileList, fetchCreateFolder, fetchCreateFile, mapBackendFileList } from '@/service/api/disk';
```

- [ ] **Step 2: Remove old folder creation state and handlers**

Delete these:
- `const showCreateFolderModal = ref(false);` (line 27)
- `const newFolderName = ref('');` (line 28)
- The entire `handleCreateFolder()` function (lines 267-269)
- The entire `submitCreateFolder()` function (lines 271-288)

- [ ] **Step 3: Add inline creation handlers**

Add where the deleted handlers were:

```ts
async function handleFileCreated(name: string) {
  const { error } = await fetchCreateFile({
    fileName: name,
    folderPath: diskStore.getCurrentPathString()
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
    diskStore.cancelCreating();
    getFileList();
  } else {
    window.$message?.error($t('common.addFail'));
  }
}

async function handleFolderCreated(name: string) {
  const { error } = await fetchCreateFolder({
    folderName: name,
    parentId: diskStore.currentParentId
  });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
    diskStore.cancelCreating();
    getFileList();
  } else {
    window.$message?.error($t('common.addFail'));
  }
}
```

- [ ] **Step 4: Update template — remove modal, add event handlers**

Remove the `@create-folder="handleCreateFolder"` from `<Toolbar>`.

Remove the entire `<NModal>` block (the "Create Folder Modal" section, approximately lines 439-462).

Add event handlers to `<FileGrid>`:

```vue
            <FileGrid
              v-if="diskStore.viewMode === 'grid'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
              @file-share="handleFileAction('share', $event)"
              @file-download="handleFileAction('download', $event)"
              @file-delete="handleFileAction('delete', $event)"
              @file-rename="handleFileAction('rename', $event)"
              @file-copy="handleFileAction('copy', $event)"
              @file-move="handleFileAction('move', $event)"
              @refresh="handleRefresh"
              @file-created="handleFileCreated"
              @folder-created="handleFolderCreated"
            />
```

Add event handlers to `<FileList>`:

```vue
            <FileList
              v-if="diskStore.viewMode === 'list'"
              :files="fileList"
              :loading="loading"
              @file-dbl-click="handleFileDblClick"
              @file-share="handleFileAction('share', $event)"
              @file-download="handleFileAction('download', $event)"
              @file-delete="handleFileAction('delete', $event)"
              @file-rename="handleFileAction('rename', $event)"
              @file-copy="handleFileAction('copy', $event)"
              @file-move="handleFileAction('move', $event)"
              @refresh="handleRefresh"
              @file-created="handleFileCreated"
              @folder-created="handleFolderCreated"
            />
```

- [ ] **Step 5: Run typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/views/disk/index.vue
git commit -m "feat(disk): wire inline creation handlers, remove folder modal"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full typecheck**

Run: `cd /home/devops-admin/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Run full lint**

Run: `cd /home/devops-admin/frontend && pnpm lint`
Expected: PASS (0 errors)

- [ ] **Step 3: Manual smoke test checklist**

Start dev server (`pnpm dev`) and verify:
- [ ] Click "新建" → "新建文件" → placeholder card appears in grid with "新建文件.txt"
- [ ] Type a name, press Enter → file created, list refreshes
- [ ] Click "新建" → "新建文件夹" → placeholder card with "新建文件夹"
- [ ] Type a name, press Enter → folder created, list refreshes
- [ ] Press Escape while editing → placeholder removed
- [ ] Create a file with same name as existing → auto-renamed to "name(1).ext"
- [ ] Switch to list view → same inline creation works in list
