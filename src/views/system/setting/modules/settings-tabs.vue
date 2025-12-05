<script lang="ts" setup>
defineOptions({
  name: 'SettingsTabs'
});

interface Props {
  clickStatus?: string;
}

type tabOptionsType = {
  key: Api.System.SettingsClickStatus;
  title: string;
  description: string;
};

withDefaults(defineProps<Props>(), {
  clickStatus: 'general'
});

type Emits = {
  (e: 'changeStatus', status: Api.System.SettingsClickStatus): void;
};

const emit = defineEmits<Emits>();

function handleClick(status: Api.System.SettingsClickStatus) {
  emit('changeStatus', status);
}

// 定义选项卡配置
const tabOptions: tabOptionsType[] = [
  {
    key: 'general',
    title: '常规配置',
    description: '通用默认配置，优化系统体验'
  },
  {
    key: 'authentication',
    title: '认证配置',
    description: '认证配置，系统认证'
  },
  {
    key: 'security',
    title: '安全配置',
    description: '系统安全配置，增强系统防护'
  },
  {
    key: 'ldap',
    title: 'LDAP配置',
    description: 'LDAP配置，对接LDAP服务器'
  },
  {
    key: 'channels',
    title: '通知渠道',
    description: '通知渠道配置，发送系统通知'
  }
];
</script>

<template>
  <DarkModeContainer class="h-full flex flex-col rounded-md space-y-2">
    <div
      v-for="option in tabOptions"
      :key="option.key"
      class="ml-0 flex flex-none flex-row cursor-pointer items-center justify-start rounded-md bg-container p-4 transition-all duration-200 ease-in-out space-x-2 active:bg-primary-100 hover:bg-primary-50 dark:active:bg-primary-800/30 dark:hover:bg-primary-900/20"
      :class="[
        // 基础样式 - 使用主题变量
        clickStatus === option.key
          ? [
              'border-solid border-0 rounded-r-none border-r-3 border-primary-600',
              'bg-gradient-to-r from-primary-200/80 to-primary-100/60',
              'dark:border-primary-400 dark:from-primary-800/60 dark:to-primary-900/40',
              'shadow-sm'
            ]
          : 'border-transparent'
      ]"
      @click="handleClick(option.key)"
    >
      <div class="flex flex-col flex-1 space-y-1">
        <span
          class="select-none font-semibold transition-colors"
          :class="[clickStatus === option.key ? 'text-primary-800 dark:text-primary-200' : 'text-base-text']"
        >
          {{ option.title }}
        </span>
        <span
          class="select-none text-xs transition-colors"
          :class="[
            clickStatus === option.key ? 'text-primary-700/80 dark:text-primary-300/80' : 'text-base-text/70 opacity-75'
          ]"
        >
          {{ option.description }}
        </span>
      </div>

      <!-- 选中状态指示器 - 使用更深的颜色 -->
      <div
        v-if="clickStatus === option.key"
        class="h-3 w-3 rounded-full bg-primary-600 shadow-sm transition-all duration-200 dark:bg-primary-400"
      />
    </div>
  </DarkModeContainer>
</template>

<style scoped>
/* 可选：添加一些自定义动画效果 */
</style>
