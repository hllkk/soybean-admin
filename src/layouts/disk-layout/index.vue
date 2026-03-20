<script setup lang="ts">
import { computed } from 'vue';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import GlobalSider from '../modules/global-sider/index.vue';
import GlobalContent from '../modules/global-content/index.vue';
import DiskHeader from './components/disk-header.vue';
import { provideMixMenuContext } from '../modules/global-menu/context';

defineOptions({
  name: 'DiskLayout'
});

const appStore = useAppStore();
const themeStore = useThemeStore();
provideMixMenuContext();

// Disk 布局固定使用 vertical-mix 模式
const siderWidth = computed(() => {
  const { mixWidth, mixCollapsedWidth, mixChildMenuWidth } = themeStore.sider;
  const isCollapsed = appStore.siderCollapse;
  return isCollapsed ? mixCollapsedWidth : mixWidth + (appStore.mixSiderFixed ? mixChildMenuWidth : 0);
});

const siderCollapsedWidth = computed(() => {
  const { mixCollapsedWidth } = themeStore.sider;
  return mixCollapsedWidth;
});
</script>

<template>
  <AdminLayout
    v-model:sider-collapse="appStore.siderCollapse"
    mode="vertical"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab"
    :header-height="themeStore.header.height"
    :tab-visible="false"
    :sider-visible="true"
    :sider-width="siderWidth"
    :sider-collapsed-width="siderCollapsedWidth"
    :footer-visible="false"
  >
    <template #header>
      <DiskHeader />
    </template>
    <template #sider>
      <GlobalSider />
    </template>
    <GlobalContent />
  </AdminLayout>
</template>

<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
