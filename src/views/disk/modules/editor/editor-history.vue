<script setup lang="ts">
import { ref } from 'vue';
import type { Editor } from '@/types/editor';
import { fetchHistoryList, fetchHistoryContent, fetchRestoreHistory, fetchDeleteHistory } from '@/service/api/disk/editor';

defineOptions({ name: 'EditorHistory' });

interface Props {
  fileId: CommonType.IdType;
  currentContent: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'restore', content: string): void;
  (e: 'close'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const historyList = ref<Editor.HistoryVersion[]>([]);
const diffContent = ref<string | null>(null);
const diffMode = ref(false);

async function loadHistory() {
  loading.value = true;
  try {
    const { data, error } = await fetchHistoryList(props.fileId);
    if (!error && data) {
      historyList.value = data;
    }
  } finally {
    loading.value = false;
  }
}

async function previewVersion(version: Editor.HistoryVersion) {
  loading.value = true;
  try {
    const { data, error } = await fetchHistoryContent(version.id);
    if (!error && data) {
      diffContent.value = data;
      diffMode.value = true;
    }
  } finally {
    loading.value = false;
  }
}

async function restoreVersion(version: Editor.HistoryVersion) {
  loading.value = true;
  try {
    const { data, error } = await fetchRestoreHistory(version.id);
    if (!error && data?.success) {
      // 获取恢复后的内容
      const contentResult = await fetchHistoryContent(version.id);
      if (!contentResult.error && contentResult.data) {
        emit('restore', contentResult.data);
      }
      window.$message?.success('恢复成功');
      visible.value = false;
    }
  } finally {
    loading.value = false;
  }
}

async function deleteVersion(version: Editor.HistoryVersion) {
  try {
    const { error } = await fetchDeleteHistory([version.id]);
    if (!error) {
      historyList.value = historyList.value.filter((v: Editor.HistoryVersion) => v.id !== version.id);
      window.$message?.success('删除成功');
    }
  } catch {}
}

function toggleDropdown() {
  visible.value = !visible.value;
  if (visible.value) {
    loadHistory();
  }
}
</script>

<template>
  <div class="editor-history">
    <NButton quaternary size="small" @click="toggleDropdown">
      <template #icon><SvgIcon icon="mdi:history" :size="16" /></template>
      历史版本
    </NButton>

    <!-- Dropdown -->
    <div v-show="visible" class="history-dropdown">
      <NSpin v-if="loading" size="small" class="loading-center" />
      <div v-else class="history-list">
        <div v-if="historyList.length === 0" class="empty-text">
          暂无历史版本
        </div>
        <template v-for="version in historyList" :key="version.id">
          <div class="history-item">
            <!-- 第一排：时间 + 大小 + 文件名 -->
            <div class="item-row">
              <span class="item-time">{{ version.createTime }}</span>
              <span class="item-size">{{ (version.size / 1024).toFixed(1) }}KB</span>
              <span class="item-name">{{ version.fileName }}</span>
            </div>
            <!-- 第二排：操作用户 + 预览 + 恢复 + 删除 -->
            <div class="item-actions">
              <span class="item-operator">{{ version.operator }}</span>
              <NButton size="tiny" @click="previewVersion(version)">预览</NButton>
              <NButton size="tiny" type="primary" @click="restoreVersion(version)">恢复</NButton>
              <NButton size="tiny" type="error" @click="deleteVersion(version)">删除</NButton>
            </div>
          </div>
        </template>
      </div>

      <!-- Diff preview -->
      <div v-if="diffMode && diffContent" class="diff-preview">
        <div class="diff-header">
          <span>历史版本内容</span>
          <NButton size="tiny" @click="diffMode = false; diffContent = null">关闭</NButton>
        </div>
        <pre class="diff-content">{{ diffContent }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-history {
  position: relative;
}

.history-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: var(--n-color-modal, #3c3c3c);
  border: 1px solid var(--n-border-color, #555);
  border-radius: 8px;
  z-index: 100;
  overflow: auto;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.history-list {
  padding: 8px;
}

.empty-text {
  text-align: center;
  color: var(--n-text-color-disabled, #888);
  padding: 20px;
}

.history-item {
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  background: var(--n-color-hover, #2a2d2e);
}

.history-item:hover {
  background: var(--n-color-active, #094771);
}

.item-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 4px;
}

.item-time {
  color: var(--n-text-color, #ccc);
}

.item-size {
  color: var(--n-text-color-disabled, #888);
}

.item-name {
  color: var(--n-text-color, #e8e8e8);
}

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.item-operator {
  font-size: 11px;
  color: var(--n-text-color-disabled, #888);
}

.diff-preview {
  margin-top: 8px;
  padding: 8px;
  border-top: 1px solid var(--n-border-color, #555);
}

.diff-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.diff-content {
  font-size: 12px;
  background: #2d2d2d;
  padding: 8px;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
}
</style>