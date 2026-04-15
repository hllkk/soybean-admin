<script setup lang="ts">
import { computed, ref } from 'vue';
import type { VNode } from 'vue';
import { $t } from '@/locales';
import { useSvgIcon } from '@/hooks/common/icon';

defineOptions({
  name: 'UploadDropdown'
});

interface Emits {
  (e: 'uploadFile'): void;
  (e: 'uploadFolder'): void;
  (e: 'createFolder'): void;
}

const emit = defineEmits<Emits>();
const { SvgIconVNode } = useSvgIcon();
const showDropdown = ref(false);

type DropdownOption = {
  key: string;
  label: string;
  icon?: () => VNode;
};

const dropdownOptions = computed<DropdownOption[]>(() => [
  { key: 'uploadFile', label: $t('page.disk.toolbar.uploadFile'), icon: SvgIconVNode({ icon: 'mdi:file-upload', fontSize: 18 }) },
  { key: 'uploadFolder', label: $t('page.disk.toolbar.uploadFolder'), icon: SvgIconVNode({ icon: 'mdi:folder-upload', fontSize: 18 }) },
  { key: 'createFolder', label: $t('page.disk.toolbar.createFolder'), icon: SvgIconVNode({ icon: 'mdi:folder-plus', fontSize: 18 }) }
]);

function handleSelect(key: string) {
  showDropdown.value = false;
  switch (key) {
    case 'uploadFile':
      emit('uploadFile');
      break;
    case 'uploadFolder':
      emit('uploadFolder');
      break;
    case 'createFolder':
      emit('createFolder');
      break;
  }
}
</script>

<template>
  <NDropdown
    :options="dropdownOptions"
    :show="showDropdown"
    placement="bottom-start"
    trigger="hover"
    @select="handleSelect"
    @update:show="showDropdown = $event"
  >
    <NButton type="primary">
      <template #icon>
        <SvgIcon icon="mdi:upload" />
      </template>
      {{ $t('page.disk.toolbar.upload') }}
      <SvgIcon class="ml-4px" icon="mdi:chevron-down" size="16" />
    </NButton>
  </NDropdown>
</template>