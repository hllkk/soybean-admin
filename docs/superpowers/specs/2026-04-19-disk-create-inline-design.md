# Disk: Inline File & Folder Creation

## Context

The disk page toolbar has "New File" and "New Folder" buttons. New folder uses a modal dialog; new file has no handler. This spec replaces both with inline creation — a placeholder card/row appears at the top of the list where the user types the name directly.

## Requirements

1. Click "New File" / "New Folder" in toolbar → placeholder item appears as first item in grid or list view
2. Placeholder has an inline text input for the name, auto-focused
3. Enter confirms, Escape cancels (removes placeholder)
4. On conflict, auto-rename by appending `(1)`, `(2)`, etc.
5. Remove the existing folder creation modal from index.vue

## Backend API

`POST /file-meta/create` — already exists.

Request: `{ fileName: string, folderPath: string, userId: number }`

Response: created file record.

`POST /file-meta/createFolder` — already exists, used via `fetchCreateFolder`.

## Architecture

### State (disk store)

Add to `useDiskStore`:

```ts
creatingType: ref<'file' | 'folder' | null>(null)
```

Actions:
- `startCreating(type: 'file' | 'folder')` — sets `creatingType`
- `cancelCreating()` — sets to `null`
- `confirmCreating(name: string)` — calls API, then sets to `null` and triggers file list refresh

### File Grid (file-grid.vue)

When `diskStore.creatingType` is set, render a placeholder `FileCard` as the first grid item. The placeholder:
- Shows folder/file icon based on type
- Has an `NInput` replacing the filename area
- Auto-focuses on mount
- Enter: `diskStore.confirmCreating(name)`
- Escape: `diskStore.cancelCreating()`
- Blur (click outside): same as Escape (cancel)

### File List (file-list.vue)

When `diskStore.creatingType` is set, render a placeholder row as the first data item. Same inline input behavior.

### Toolbar (toolbar.vue)

- `handleCreateSelect('createFile')` → `diskStore.startCreating('file')`
- `handleCreateSelect('createFolder')` → `diskStore.startCreating('folder')`

### Auto-rename Logic

Before calling the API, check `diskStore.currentFileList` for name conflicts:

```ts
function resolveNameConflict(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) return baseName;
  const ext = baseName.includes('.') ? '.' + baseName.split('.').pop() : '';
  const nameWithoutExt = ext ? baseName.slice(0, -ext.length) : baseName;
  let i = 1;
  while (existingNames.includes(`${nameWithoutExt}(${i})${ext}`)) i++;
  return `${nameWithoutExt}(${i})${ext}`;
}
```

This runs client-side before the API call. The server may also reject duplicates — in that case show an error toast and re-open the inline editor.

### Placeholder Defaults

- New folder: default name "新建文件夹" (or i18n key)
- New file: default name "新建文件.txt" (or i18n key)
- User can clear and type any name with any extension

## Files to Modify

| File | Change |
|------|--------|
| `store/modules/disk/index.ts` | Add `creatingType`, `startCreating`, `cancelCreating`, `confirmCreating` |
| `views/disk/modules/file-grid.vue` | Add placeholder card with inline input |
| `views/disk/modules/file-list.vue` | Add placeholder row with inline input |
| `views/disk/modules/toolbar.vue` | Wire `createFile` handler to `startCreating('file')` |
| `views/disk/index.vue` | Remove folder creation modal; add `confirmCreating` API calls |
| `service/api/disk/file.ts` | Add `fetchCreateFile` function |
| `typings/api/disk.api.d.ts` | Add `CreateFileParams` type |
| `locales/langs/zh-cn.ts` | Add default name i18n keys |
| `locales/langs/en-us.ts` | Add default name i18n keys |

## Error Handling

- Empty name: show warning, keep editor open
- API failure: show error toast, keep editor open for retry
- Network error: show error toast, cancel creating
