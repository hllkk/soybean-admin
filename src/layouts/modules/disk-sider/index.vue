<script lang="ts" setup>
import { computed } from 'vue';
import { GLOBAL_SIDER_MENU_ID } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import DiskLogo from '../disk-logo/index.vue';

defineOptions({
  name: 'DiskSider'
});

const appStore = useAppStore();
const themeStore = useThemeStore();

const showLogo = computed(() => themeStore.layout.diskMode === 'vertical');
const darkMenu = computed(() => !themeStore.darkMode && themeStore.sider.inverted);

const menuWrapperClass = computed(() => (showLogo.value ? 'flex-1-hidden' : 'h-full'));
</script>

<template>
  <DarkModeContainer class="size-full flex-col-stretch shadow-sider" :inverted="darkMenu">
    <DiskLogo
      v-if="showLogo"
      :show-title="!appStore.siderCollapse"
      :style="{ height: themeStore.header.height + 'px' }"
    />
    <div :id="GLOBAL_SIDER_MENU_ID" :class="menuWrapperClass"></div>
  </DarkModeContainer>
</template>
