<script setup lang="ts">
import { computed, watch, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { useRouteStore } from '@/store/modules/route';
import GlobalSider from '../modules/global-sider/index.vue';
import GlobalContent from '../modules/global-content/index.vue';
import DiskHeader from './components/disk-header.vue';
import UploadTrigger from '@/components/custom/upload-trigger.vue';
import { provideMixMenuContext } from '../modules/global-menu/context';

defineOptions({
  name: 'DiskLayout'
});

const route = useRoute();
const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();

// 监听路由变化设置模块
watch(
  () => route.path,
  () => {
    routeStore.setCurrentModule('disk');
  },
  { immediate: true }
);

// 提供 mix 菜单上下文
const { secondLevelMenus } = provideMixMenuContext();

// 异步加载菜单组件 - 与 base-layout 一致
const VerticalMixMenu = defineAsyncComponent(() => import('../modules/global-menu/modules/vertical-mix-menu.vue'));

// sider 宽度计算 - 与 base-layout 中 vertical-mix 模式一致
const siderWidth = computed(() => {
  const { mixWidth, mixCollapsedWidth, mixChildMenuWidth } = themeStore.sider;
  const isCollapsed = appStore.siderCollapse;
  return isCollapsed ? mixCollapsedWidth : mixWidth + (appStore.mixSiderFixed && secondLevelMenus.value.length ? mixChildMenuWidth : 0);
});

const siderCollapsedWidth = computed(() => themeStore.sider.mixCollapsedWidth);
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
    <VerticalMixMenu :key="appStore.isMobile ? 'mobile' : 'desktop'" />
    <GlobalContent />
    <UploadTrigger />
  </AdminLayout>
</template>

<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
