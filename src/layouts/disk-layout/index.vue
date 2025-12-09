<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import type { LayoutMode } from '@sa/materials';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import GlobalContent from '../modules/global-content/index.vue';
import { provideMixMenuContext } from '../modules/global-menu/context';
import DiskSider from '../modules/disk-sider/index.vue';
import DiskHeader from '../modules/disk-header/index.vue';

defineOptions({
  name: 'DiskLayout'
});

const GlobalMenu = defineAsyncComponent(() => import('../modules/global-menu/index.vue'));

const appStore = useAppStore();
const themeStore = useThemeStore();
provideMixMenuContext();

const layoutMode = computed(() => {
  const vertical: LayoutMode = 'vertical';
  const horizontal: LayoutMode = 'horizontal';
  return themeStore.layout.diskMode.includes(vertical) ? vertical : horizontal;
});

const headerProps = computed(() => {
  const { diskMode } = themeStore.layout;

  const headerPropsConfig: Record<UnionKey.ThemeDiskLayoutMode, App.Global.HeaderProps> = {
    vertical: {
      showLogo: false,
      showMenu: false,
      showMenuToggler: true
    },
    'vertical-mix': {
      showLogo: false,
      showMenu: false,
      showMenuToggler: appStore.isMobile
    },
    horizontal: {
      showLogo: true,
      showMenu: true,
      showMenuToggler: false
    }
  };

  return headerPropsConfig[diskMode];
});

const siderVisible = computed(() => themeStore.layout.diskMode !== 'horizontal');

const siderWidth = computed(() => {
  const { diskCollapsedWidth, diskWidth } = themeStore.sider;
  return appStore.siderCollapse ? diskCollapsedWidth : diskWidth;
});

const siderCollapsedWidth = computed(() => themeStore.sider.diskCollapsedWidth);
</script>

<template>
  <AdminLayout
    v-model:sider-collapse="appStore.siderCollapse"
    :mode="layoutMode"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.diskScrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab"
    :header-height="themeStore.header.diskHeight"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''"
    :sider-visible="siderVisible"
    :sider-width="siderWidth"
    :sider-collapsed-width="siderCollapsedWidth"
    :footer-visible="themeStore.footer.visible"
    :footer-height="themeStore.footer.height"
    :fixed-footer="themeStore.footer.fixed"
    :right-footer="themeStore.footer.right"
  >
    <template #header>
      <DiskHeader v-bind="headerProps" />
    </template>
    <template #sider>
      <DiskSider />
    </template>
    <GlobalMenu />
    <GlobalContent />
  </AdminLayout>
</template>

<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
