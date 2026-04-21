<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDialog } from 'naive-ui';
import type { Editor } from '@/types/editor';
import { getPreviewCategory, getMonacoLanguage } from '@/utils/file-type';
import { fetchSaveWithHistory } from '@/service/api/disk/editor';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import EditorHeader from './editor-header.vue';
import EditorFileTree from './editor-file-tree.vue';
import EditorTabs from './editor-tabs.vue';
import EditorMonaco from './editor-monaco.vue';
import EditorMarkdownPreview from './editor-markdown-preview.vue';
import EditorHistory from './editor-history.vue';

defineOptions({ name: 'TextEditorModal' });

interface Props {
  visible: boolean;
  file: Api.Disk.PreviewFileInfo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}>();

const dialog = useDialog();

// State
const tabs = ref<Editor.Tab[]>([]);
const activeTabId = ref<string>('');
const fileContents = ref<Map<string, string>>(new Map());
const originalContents = ref<Map<string, string>>(new Map());
const showTree = ref(true);
const saving = ref(false);

// Computed
const activeTab = computed(() => tabs.value.find((t: Editor.Tab) => t.id === activeTabId.value));
const currentContent = computed(() => fileContents.value.get(activeTabId.value) || '');
const hasUnsavedChanges = computed(() => {
  return tabs.value.some((t: Editor.Tab) => t.isModified);
});
const isMarkdown = computed(() => {
  if (!activeTab.value) return false;
  return getPreviewCategory(activeTab.value.fileName) === 'markdown';
});

// Methods
function generateTabId(fileId: CommonType.IdType): string {
  return `tab-${fileId}-${Date.now()}`;
}

async function openFile(file: Api.Disk.FileItem) {
  const existingTab = tabs.value.find((t: Editor.Tab) => t.fileId === file.fileId);
  if (existingTab) {
    activeTabId.value = existingTab.id;
    return;
  }

  // Fetch file content
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  const url = `${baseURL}/preview/text/stream?fileId=${file.fileId}`;

  const token = localStg.get('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  const content = await response.text();

  const tabId = generateTabId(file.fileId);
  const newTab: Editor.Tab = {
    id: tabId,
    fileId: file.fileId,
    fileName: file.fileName,
    filePath: file.filePath || '',
    language: getMonacoLanguage(file.fileName),
    isModified: false,
    contentType: file.fileType,
    size: file.fileSize,
    updateTime: file.modifyTime || ''
  };

  tabs.value.push(newTab);
  fileContents.value.set(tabId, content);
  originalContents.value.set(tabId, content);
  activeTabId.value = tabId;
}

function closeTab(tabId: string) {
  const tab = tabs.value.find((t: Editor.Tab) => t.id === tabId);
  if (tab?.isModified) {
    dialog.warning({
      title: '未保存的修改',
      content: `文件 ${tab.fileName} 有未保存的修改，是否保存？`,
      positiveText: '保存',
      negativeText: '不保存',
      onPositiveClick: async () => {
        await saveFile(tabId);
        removeTab(tabId);
      },
      onNegativeClick: () => {
        removeTab(tabId);
      }
    });
  } else {
    removeTab(tabId);
  }
}

function removeTab(tabId: string) {
  const index = tabs.value.findIndex((t: Editor.Tab) => t.id === tabId);
  if (index === -1) return;

  tabs.value.splice(index, 1);
  fileContents.value.delete(tabId);
  originalContents.value.delete(tabId);

  if (activeTabId.value === tabId) {
    activeTabId.value = tabs.value[Math.max(0, index - 1)]?.id || '';
  }

  if (tabs.value.length === 0) {
    emit('update:visible', false);
  }
}

async function saveFile(tabId?: string) {
  const targetTabId = tabId || activeTabId.value;
  const tab = tabs.value.find((t: Editor.Tab) => t.id === targetTabId);
  if (!tab || !tab.isModified) return;

  saving.value = true;
  try {
    const content = fileContents.value.get(targetTabId) || '';
    const { error } = await fetchSaveWithHistory({
      fileId: tab.fileId,
      content
    });

    if (!error) {
      tab.isModified = false;
      originalContents.value.set(targetTabId, content);
      window.$message?.success('保存成功');
      emit('saved');
    }
  } finally {
    saving.value = false;
  }
}

function handleContentChange(content: string) {
  const tab = activeTab.value;
  if (!tab) return;

  fileContents.value.set(tab.id, content);
  const original = originalContents.value.get(tab.id);
  tab.isModified = content !== original;
}

function handleHistoryRestore(content: string) {
  const tab = activeTab.value;
  if (!tab) return;

  fileContents.value.set(tab.id, content);
  tab.isModified = true;
}

function handleFileSelect(node: Editor.FileTreeNode) {
  // Convert tree node to FileItem format
  openFile({
    fileId: node.id,
    fileName: node.name,
    filePath: node.path,
    fileSize: node.size,
    fileType: node.contentType,
    isFolder: false
  } as Api.Disk.FileItem);
}

function handleClose() {
  if (hasUnsavedChanges.value) {
    dialog.warning({
      title: '未保存的修改',
      content: '有文件未保存，是否保存后再关闭？',
      positiveText: '保存并关闭',
      negativeText: '放弃修改',
      onPositiveClick: async () => {
        for (const tab of tabs.value.filter((t: Editor.Tab) => t.isModified)) {
          await saveFile(tab.id);
        }
        emit('update:visible', false);
      },
      onNegativeClick: () => {
        emit('update:visible', false);
      }
    });
  } else {
    emit('update:visible', false);
  }
}

// Watch visibility
watch(
  () => props.visible,
  async (val) => {
    if (val && props.file) {
      // Reset state
      tabs.value = [];
      fileContents.value.clear();
      originalContents.value.clear();

      // Open initial file
      await openFile(props.file as Api.Disk.FileItem);
    }
  }
);
</script>

<template>
  <div v-if="visible" class="text-editor-modal">
    <!-- Header -->
    <EditorHeader
      :file-path="activeTab?.filePath || ''"
      :file-name="activeTab?.fileName || ''"
      :has-unsaved-changes="hasUnsavedChanges"
      :show-tree="showTree"
      @save="saveFile()"
      @close="handleClose"
      @toggle-tree="showTree = !showTree"
      @go-home="emit('update:visible', false)"
    >
      <template #history>
        <EditorHistory
          v-if="activeTab"
          :file-id="activeTab.fileId"
          :current-content="currentContent"
          @restore="handleHistoryRestore"
        />
      </template>
    </EditorHeader>

    <!-- Main content -->
    <div class="editor-main">
      <!-- File Tree -->
      <EditorFileTree
        :visible="showTree"
        :current-file-path="activeTab?.filePath"
        @select="handleFileSelect"
        @toggle="showTree = false"
      />

      <!-- Editor area -->
      <div class="editor-content">
        <!-- Tabs -->
        <EditorTabs
          :tabs="tabs"
          :active-tab-id="activeTabId"
          @switch="activeTabId = $event"
          @close="closeTab"
        />

        <!-- Editor + Preview -->
        <div class="editor-body">
          <!-- Monaco Editor -->
          <div class="editor-pane" :style="{ width: isMarkdown ? '50%' : '100%' }">
            <EditorMonaco
              v-if="activeTab"
              :content="currentContent"
              :file-name="activeTab.fileName"
              :file-id="activeTab.fileId"
              :read-only="false"
              @change="handleContentChange"
              @save="saveFile()"
            />
          </div>

          <!-- Markdown Preview -->
          <div v-if="isMarkdown" class="preview-pane">
            <EditorMarkdownPreview :content="currentContent" />
          </div>
        </div>
      </div>
    </div>

    <!-- Saving overlay -->
    <div v-if="saving" class="saving-overlay">
      <NSpin size="large" />
      <span class="saving-text">保存中...</span>
    </div>
  </div>
</template>

<style scoped>
.text-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: var(--n-color-modal, #1e1e1e);
  display: flex;
  flex-direction: column;
}

.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  overflow: hidden;
}

.preview-pane {
  width: 50%;
  border-left: 1px solid var(--n-border-color, #464647);
  overflow: hidden;
}

.saving-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.saving-text {
  color: #fff;
  font-size: 14px;
}
</style>