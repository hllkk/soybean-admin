<script setup lang="ts">
import { computed } from 'vue';
import { useDialog } from 'naive-ui';

defineOptions({ name: 'EditorHeader' });

interface Props {
  filePath: string;
  hasUnsavedChanges: boolean;
  showTree: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'save'): void;
  (e: 'close'): void;
  (e: 'toggleTree'): void;
  (e: 'goHome'): void;
}>();

const dialog = useDialog();

function handleClose() {
  if (props.hasUnsavedChanges) {
    dialog.warning({
      title: '未保存的修改',
      content: '有文件未保存，是否保存后再关闭？',
      positiveText: '保存并关闭',
      negativeText: '放弃修改',
      onPositiveClick: () => {
        emit('save');
        emit('close');
      },
      onNegativeClick: () => {
        emit('close');
      }
    });
  } else {
    emit('close');
  }
}

const pathSegments = computed(() => {
  if (!props.filePath) return [];
  return props.filePath.split('/').filter(Boolean);
});
</script>

<template>
  <div class="editor-header">
    <!-- Left: Tree toggle + Breadcrumb -->
    <div class="header-left">
      <NButton quaternary size="small" @click="emit('toggleTree')">
        <template #icon>
          <SvgIcon :icon="showTree ? 'mdi:menu-left' : 'mdi:menu-right'" :size="18" />
        </template>
      </NButton>

      <!-- Home icon -->
      <NButton quaternary size="small" @click="emit('goHome')">
        <template #icon>
          <SvgIcon icon="mdi:home-outline" :size="16" />
        </template>
      </NButton>

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <template v-for="(segment, index) in pathSegments" :key="index">
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item">{{ segment }}</span>
        </template>
      </div>
    </div>

    <!-- Right: Save + History + Close -->
    <div class="header-right">
      <span v-if="hasUnsavedChanges" class="modified-indicator">●</span>

      <NButton
        v-if="hasUnsavedChanges"
        size="small"
        type="primary"
        @click="emit('save')"
      >
        <template #icon><SvgIcon icon="mdi:content-save" :size="16" /></template>
        保存
      </NButton>

      <slot name="history" />

      <NButton quaternary size="small" @click="emit('close')">
        <template #icon><SvgIcon icon="mdi:close" :size="18" /></template>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--n-color-modal, #323233);
  border-bottom: 1px solid var(--n-border-color, #464647);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.breadcrumb-separator {
  color: var(--n-text-color-disabled, #888);
  margin: 0 4px;
}

.breadcrumb-item {
  color: var(--n-text-color, #ccc);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modified-indicator {
  color: #f0a020;
  font-size: 12px;
}
</style>