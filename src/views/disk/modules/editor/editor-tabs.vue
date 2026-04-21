<script setup lang="ts">
import type { Editor } from '@/types/editor';

defineOptions({ name: 'EditorTabs' });

interface Props {
  tabs: Editor.Tab[];
  activeTabId: string;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'switch', tabId: string): void;
  (e: 'close', tabId: string): void;
}>();

function getTabIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['md', 'markdown'].includes(ext)) return 'material-symbols:description';
  if (['go'].includes(ext)) return 'material-symbols:code';
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return 'material-symbols:code-blocks';
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'material-symbols:settings';
  if (['css', 'scss', 'less'].includes(ext)) return 'material-symbols:palette';
  if (['html', 'vue'].includes(ext)) return 'material-symbols:web';
  if (['py'].includes(ext)) return 'material-symbols-terminal';
  return 'material-symbols:description';
}

function handleClose(tabId: string, e: MouseEvent) {
  e.stopPropagation();
  emit('close', tabId);
}
</script>

<template>
  <div class="editor-tabs">
    <div class="tabs-scroll">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: tab.id === activeTabId, modified: tab.isModified }"
        @click="emit('switch', tab.id)"
      >
        <SvgIcon :icon="getTabIcon(tab.fileName)" :size="14" class="tab-icon" />
        <span class="tab-name">{{ tab.fileName }}</span>
        <span v-if="tab.isModified" class="modified-dot">●</span>
        <button class="tab-close" @click="handleClose(tab.id, $event)">
          <SvgIcon icon="mdi:close" :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-tabs {
  width: 100%;
  height: 32px;
  background: var(--n-color-modal, #252526);
  border-bottom: 1px solid var(--n-border-color, #464647);
  display: flex;
  overflow: hidden;
}

.tabs-scroll {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}

.tabs-scroll::-webkit-scrollbar {
  height: 4px;
}

.tabs-scroll::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #2d2d2d;
  border-right: 1px solid #464647;
  cursor: pointer;
  white-space: nowrap;
  min-width: 80px;
  max-width: 200px;
}

.tab-item:hover {
  background: #353535;
}

.tab-item.active {
  background: var(--n-color-modal, #1e1e1e);
}

.tab-item.modified .tab-name {
  color: #f0a020;
}

.tab-icon {
  opacity: 0.7;
}

.tab-name {
  font-size: 13px;
  color: var(--n-text-color, #ccc);
  overflow: hidden;
  text-overflow: ellipsis;
}

.modified-dot {
  color: #f0a020;
  font-size: 10px;
  margin-left: 2px;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #888;
  opacity: 0;
  transition: opacity 0.2s;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: #555;
  color: #fff;
}
</style>