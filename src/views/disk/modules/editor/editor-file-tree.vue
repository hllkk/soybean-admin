<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Editor } from '@/types/editor';
import { fetchFileTree } from '@/service/api/disk/editor';

defineOptions({ name: 'EditorFileTree' });

interface Props {
  visible: boolean;
  currentFilePath?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', node: Editor.FileTreeNode): void;
  (e: 'refresh'): void;
  (e: 'create'): void;
  (e: 'toggle'): void;
}>();

const treeData = ref<Editor.FileTreeNode[]>([]);
const expandedPaths = ref<Set<string>>(new Set());
const loading = ref(false);
const loadingPaths = ref<Set<string>>(new Set());

async function loadTree(path?: string) {
  loading.value = true;
  try {
    const { data, error } = await fetchFileTree(path);
    if (!error && data) {
      if (path) {
        // 将子节点追加到展开的父节点下（简化：直接追加到列表）
        const _parentPath = path.split('/').slice(0, -1).join('/') || '/';
        // TODO: 实现树形结构的正确插入
      } else {
        treeData.value = data;
      }
    }
  } finally {
    loading.value = false;
  }
}

async function expandNode(node: Editor.FileTreeNode) {
  if (!node.isDir || !node.hasChildren) return;

  if (!expandedPaths.value.has(node.path)) {
    expandedPaths.value.add(node.path);
    loadingPaths.value.add(node.path);
    await loadTree(node.path);
    loadingPaths.value.delete(node.path);
  } else {
    expandedPaths.value.delete(node.path);
  }
}

function handleSelect(node: Editor.FileTreeNode) {
  if (!node.isDir) {
    emit('select', node);
  } else {
    expandNode(node);
  }
}

function getFileIcon(node: Editor.FileTreeNode): string {
  if (node.isDir) return 'material-symbols:folder';
  if (node.contentType?.startsWith('image')) return 'material-symbols:image';
  if (node.contentType?.startsWith('video')) return 'material-symbols:videocam';
  if (node.contentType?.startsWith('audio')) return 'material-symbols:audiotrack';
  return 'material-symbols:description';
}

function isActive(node: Editor.FileTreeNode): boolean {
  return node.path === props.currentFilePath;
}

onMounted(() => {
  loadTree();
});
</script>

<template>
  <div v-show="visible" class="editor-file-tree">
    <!-- Tree header -->
    <div class="tree-header">
      <NButton quaternary size="small" @click="emit('toggle')">
        <template #icon><SvgIcon icon="mdi:menu-left" :size="16" /></template>
      </NButton>
      <NButton quaternary size="small" @click="loadTree()">
        <template #icon><SvgIcon icon="mdi:refresh" :size="16" /></template>
      </NButton>
      <NButton quaternary size="small" @click="emit('create')">
        <template #icon><SvgIcon icon="mdi:plus" :size="16" /></template>
      </NButton>
    </div>

    <!-- Tree content -->
    <div class="tree-content">
      <NSpin v-if="loading" size="small" />
      <div v-else class="tree-list">
        <template v-for="node in treeData" :key="node.id">
          <div
            class="tree-node"
            :class="{ active: isActive(node), expanded: expandedPaths.has(node.path) }"
            :style="{ paddingLeft: '8px' }"
            @click="handleSelect(node)"
          >
            <SvgIcon :icon="getFileIcon(node)" :size="16" class="node-icon" />
            <span class="node-name">{{ node.name }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-file-tree {
  width: 180px;
  height: 100%;
  background: var(--n-color-modal, #252526);
  border-right: 1px solid var(--n-border-color, #464647);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.tree-header {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--n-border-color, #464647);
}

.tree-content {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
}

.tree-node:hover {
  background: var(--n-color-hover, #2a2d2e);
}

.tree-node.active {
  background: var(--n-color-active, #094771);
}

.node-icon {
  opacity: 0.7;
}

.node-name {
  font-size: 13px;
  color: var(--n-text-color, #ccc);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>