<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';
import UploadDropdown from './upload-dropdown.vue';
import SearchGroup from './search-group.vue';
import SortDropdown from './sort-dropdown.vue';
import TransferModal from './transfer-modal.vue';

defineOptions({
  name: 'DiskToolbar'
});

interface Emits {
  (e: 'uploadFile'): void;
  (e: 'uploadFolder'): void;
  (e: 'createFolder'): void;
  (e: 'search'): void;
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

const diskStore = useDiskStore();
const showTransferModal = ref(false);

function handleUploadFile() {
  emit('uploadFile');
}

function handleUploadFolder() {
  emit('uploadFolder');
}

function handleCreateFolder() {
  emit('createFolder');
}

function handleSearch() {
  emit('search');
}

function handleRefresh() {
  emit('refresh');
}

function handleTransferList() {
  showTransferModal.value = true;
}
</script>

<template>
  <div class="disk-toolbar">
    <NSpace align="center">
      <UploadDropdown
        @upload-file="handleUploadFile"
        @upload-folder="handleUploadFolder"
        @create-folder="handleCreateFolder"
      />
      <SearchGroup @search="handleSearch" />
    </NSpace>

    <NSpace align="center">
      <NButton quaternary @click="handleTransferList">
        <template #icon>
          <SvgIcon icon="mdi:swap-vertical" />
        </template>
        {{ $t('page.disk.toolbar.transferList') }}
      </NButton>
      <SortDropdown />
      <NButton
        :type="diskStore.viewMode === 'grid' ? 'primary' : 'default'"
        quaternary
        @click="diskStore.setViewMode('grid')"
      >
        <template #icon>
          <SvgIcon icon="mdi:view-grid" />
        </template>
      </NButton>
      <NButton
        :type="diskStore.viewMode === 'list' ? 'primary' : 'default'"
        quaternary
        @click="diskStore.setViewMode('list')"
      >
        <template #icon>
          <SvgIcon icon="mdi:view-list" />
        </template>
      </NButton>
      <NButton quaternary @click="handleRefresh">
        <template #icon>
          <SvgIcon icon="mdi:refresh" />
        </template>
      </NButton>
    </NSpace>

    <TransferModal v-model:visible="showTransferModal" />
  </div>
</template>

<style scoped lang="scss">
.disk-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--n-color);
  border-radius: 8px;
}
</style>