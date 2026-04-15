<script setup lang="ts">
import { computed, ref } from 'vue';
import type { VNode } from 'vue';
import { $t } from '@/locales';
import { useSvgIcon } from '@/hooks/common/icon';
import { useDiskStore } from '@/store/modules/disk';

defineOptions({
  name: 'SortDropdown'
});

const diskStore = useDiskStore();
const { SvgIconVNode } = useSvgIcon();
const showDropdown = ref(false);

type DropdownOption = {
  key: string;
  label: string;
  icon?: () => VNode;
};

const sortOptions = computed<DropdownOption[]>(() => [
  { key: 'name-asc', label: $t('page.disk.sort.nameAsc'), icon: SvgIconVNode({ icon: 'mdi:sort-alphabetical-ascending', fontSize: 18 }) },
  { key: 'name-desc', label: $t('page.disk.sort.nameDesc'), icon: SvgIconVNode({ icon: 'mdi:sort-alphabetical-descending', fontSize: 18 }) },
  { key: 'size-asc', label: $t('page.disk.sort.sizeAsc'), icon: SvgIconVNode({ icon: 'mdi:sort-ascending', fontSize: 18 }) },
  { key: 'size-desc', label: $t('page.disk.sort.sizeDesc'), icon: SvgIconVNode({ icon: 'mdi:sort-descending', fontSize: 18 }) },
  { key: 'modifyTime-asc', label: $t('page.disk.sort.timeAsc'), icon: SvgIconVNode({ icon: 'mdi:clock-outline', fontSize: 18 }) },
  { key: 'modifyTime-desc', label: $t('page.disk.sort.timeDesc'), icon: SvgIconVNode({ icon: 'mdi:clock-reverse', fontSize: 18 }) },
  { key: 'type-asc', label: $t('page.disk.sort.typeAsc'), icon: SvgIconVNode({ icon: 'mdi:folder-outline', fontSize: 18 }) },
  { key: 'type-desc', label: $t('page.disk.sort.typeDesc'), icon: SvgIconVNode({ icon: 'mdi:file-outline', fontSize: 18 }) }
]);

function handleSelect(key: string) {
  showDropdown.value = false;
  const [field, order] = key.split('-') as ['name' | 'size' | 'modifyTime' | 'type', 'asc' | 'desc'];
  diskStore.setSort(field, order);
}
</script>

<template>
  <NDropdown
    :options="sortOptions"
    :show="showDropdown"
    placement="bottom-end"
    trigger="hover"
    @select="handleSelect"
    @update:show="showDropdown = $event"
  >
    <NButton quaternary>
      <template #icon>
        <SvgIcon icon="mdi:sort" />
      </template>
      {{ $t('page.disk.toolbar.sort') }}
      <SvgIcon class="ml-4px" icon="mdi:chevron-down" size="16" />
    </NButton>
  </NDropdown>
</template>