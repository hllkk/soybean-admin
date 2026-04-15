<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'SearchGroup'
});

interface Emits {
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();

const keyword = ref('');
const selectedFileType = ref<Api.Disk.FileType | 'all'>('all');

const fileTypeOptions = computed(() => {
  const types: Api.Disk.FileType[] = ['all', 'image', 'document', 'video', 'audio', 'other'];
  return types.map(type => ({
    label: $t(`page.disk.fileType.${type}`),
    value: type
  }));
});

function handleSearch() {
  diskStore.setFileType(selectedFileType.value === 'all' ? 'all' : selectedFileType.value);
  emit('search');
}

function _handleClear() {
  keyword.value = '';
  selectedFileType.value = 'all';
}
</script>

<template>
  <NSpace align="center">
    <NSelect
      v-model:value="selectedFileType"
      :options="fileTypeOptions"
      :consistent-menu-width="false"
      style="width: 100px"
    />
    <NInput
      v-model:value="keyword"
      :placeholder="$t('page.disk.toolbar.searchPlaceholder')"
      clearable
      style="width: 200px"
      @keyup.enter="handleSearch"
    />
    <NButton type="primary" ghost @click="handleSearch">
      <template #icon>
        <SvgIcon icon="mdi:magnify" />
      </template>
    </NButton>
  </NSpace>
</template>