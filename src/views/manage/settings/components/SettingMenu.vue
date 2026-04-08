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
  { key: 'general', label: '常规配置', icon: 'carbon:settings', description: '通用默认配置，优化系统体验' },
  { key: 'security', label: '安全配置', icon: 'carbon:security', description: '密码策略、IP校验设置' },
  { key: 'ldap', label: 'LDAP配置', icon: 'carbon:network-3', description: '企业目录服务集成设置' },
  { key: 'disk', label: '网盘配置', icon: 'carbon:cloud', description: '文件存储、OnlyOffice配置' },
  { key: 'notify', label: '通知渠道', icon: 'carbon:notification', description: '邮件、短信、飞书推送配置' },
  { key: 'auth', label: '认证配置', icon: 'carbon:user-authentication', description: '企业微信、GitHub等第三方登录' }
];

function handleSelect(key: string) {
  emit('update:activeKey', key);
}
</script>

<template>
  <div class="setting-menu">
    <div
      v-for="item in menuItems"
      :key="item.key"
      class="menu-item"
      :class="{ active: props.activeKey === item.key }"
      @click="handleSelect(item.key)"
    >
      <div class="menu-title">
        <SvgIcon :icon="item.icon" class="mr-8px" />
        <span>{{ item.label }}</span>
      </div>
      <div class="menu-desc">{{ item.description }}</div>
    </div>
  </div>
</template>

<style scoped>
.setting-menu {
  padding: 12px;
}

.menu-item {
  padding: 12px 14px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  border: 1px solid transparent;
  position: relative;
  transition: all 0.2s ease;
  background: transparent;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.12) 100%);
  border-right: 3px solid #667eea;
}

.menu-item.active::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #a8b4f9 0%, #c4a8e9 100%);
  border-radius: 50%;
}

.menu-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
}

.menu-desc {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

/* 暗黑模式适配 */
html.dark .menu-item:hover {
  background: rgba(255,255,255,0.08);
}

html.dark .menu-title {
  color: #e0e0e0;
}

html.dark .menu-desc {
  color: #888;
}
</style>