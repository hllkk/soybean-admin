<script lang="ts" setup>
defineOptions({
  name: 'DiskSider'
});

interface Props {
  siderTitle?: string;
}

withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
  siderTitle: undefined
});
</script>

<template>
  <NGrid
    class="min-h-500px flex-col-stretch gap-16px overflow-auto"
    :x-gap="12"
    :y-gap="12"
    item-responsive
    responsive="screen"
  >
    <NGridItem span="0 s:8 1034:8 m:6 l:5 xl:4 xxl:3">
      <NCard :bordered="false" size="small" class="h-full card-wrapper" content-style="padding: 0;" :segmented="true">
        <template #header>
          <span>{{ siderTitle }}</span>
        </template>
        <template #header-extra>
          <slot name="header-extra" />
        </template>
        <slot name="sider" />
      </NCard>
    </NGridItem>
    <NGridItem class="content" span="24 s:16 m:18 l:19 xl:20 xxl:21">
      <slot />
    </NGridItem>
  </NGrid>
</template>

<style scoped lang="scss">
.content {
  min-height: calc(100vh - 196px - var(--calc-footer-height, 0px));
}
</style>
