<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'DiskBreadcrumb'
});

interface BreadcrumbItem {
  label: string;
  id: CommonType.IdType | null;
}

interface Props {
  totalCount?: number;
}

const _props = withDefaults(defineProps<Props>(), {
  totalCount: 0
});

const diskStore = useDiskStore();

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: $t('page.disk.breadcrumb.allFiles'), id: null }
  ];

  diskStore.currentPath.forEach(item => {
    items.push({
      label: item.fileName,
      id: item.fileId
    });
  });

  return items;
});

function handleClick(index: number) {
  diskStore.goBack(index);
}
</script>

<template>
  <div class="disk-breadcrumb">
    <NBreadcrumb>
      <NBreadcrumbItem
        v-for="(item, index) in breadcrumbItems"
        :key="item.id ?? 'root'"
        @click="handleClick(index)"
      >
        {{ item.label }}
      </NBreadcrumbItem>
    </NBreadcrumb>
    <div class="breadcrumb-count">
      {{ $t('page.disk.breadcrumb.loaded') }}，
      {{ $t('page.disk.breadcrumb.total', { count: totalCount }) }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.disk-breadcrumb {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  .breadcrumb-count {
    font-size: 12px;
    color: var(--n-text-color-disabled);
  }
}
</style>