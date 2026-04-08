<script setup lang="ts">
import type { SettingMenuItem } from '../types';

defineOptions({
  name: 'SettingMenu'
});

interface Props {
  activeKey: string;
}

interface Emits {
  (e: 'update:activeKey', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const menuItems: SettingMenuItem[] = [
  { key: 'general', label: '常规配置', icon: '📌', description: '通用默认配置，优化系统体验' },
  { key: 'security', label: '安全配置', icon: '🔒', description: '系统安全配置，增强系统防护' },
  { key: 'ldap', label: 'LDAP配置', icon: '🌐', description: '企业目录服务集成设置' },
  { key: 'disk', label: '网盘配置', icon: '💾', description: '文件存储、OnlyOffice配置' },
  { key: 'notify', label: '通知渠道', icon: '📢', description: '通知渠道配置，发送系统通知' },
  { key: 'auth', label: '认证配置', icon: '🔐', description: '认证配置，系统认证' }
];

function handleSelect(key: string) {
  emit('update:activeKey', key);
}
</script>

<template>
  <DarkModeContainer class="h-full flex flex-col rounded-md space-y-2">
    <div
      v-for="item in menuItems"
      :key="item.key"
      class="ml-0 flex flex-none flex-row cursor-pointer items-center justify-start rounded-md bg-container p-4 transition-all duration-200 ease-in-out space-x-2 active:bg-primary-100 hover:bg-primary-50 dark:active:bg-primary-800/30 dark:hover:bg-primary-900/20"
      :class="[
        props.activeKey === item.key
          ? [
            'border-solid border-0 rounded-r-none border-r-3 border-primary-600',
            'bg-gradient-to-r from-primary-200/80 to-primary-100/60',
            'dark:border-primary-400 dark:from-primary-800/60 dark:to-primary-900/40',
            'shadow-sm']
          : 'border-transparent'
      ]"
      @click="handleSelect(item.key)"
    >
      <span class="mr-8px">{{ item.icon }}</span>
      <div class="flex flex-col flex-1 space-y-1">
        <span
          class="select-none font-semibold transition-colors"
          :class="[props.activeKey === item.key ? 'text-primary-800 dark:text-primary-200' : 'text-base-text']"
        >
          {{ item.label }}
        </span>
        <span
          class="select-none text-xs transition-colors"
          :class="[props.activeKey === item.key ? 'text-primary-700/80 dark:text-primary-300/80' : 'text-base-text/70 opacity-75']"
        >
          {{ item.description }}
        </span>
      </div>
      <!-- 选中状态指示器 -->
      <div
        v-if="props.activeKey === item.key"
        class="h-3 w-3 rounded-full bg-primary-600 shadow-sm transition-all duration-200 dark:bg-primary-400"
      />
    </div>
  </DarkModeContainer>
</template>

<style scoped>
</style>
