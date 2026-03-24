<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { VNode } from 'vue';
import { useBoolean } from '@sa/hooks';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import defaultAvatar from '@/assets/imgs/soybean.jpg';
import { $t } from '@/locales';

defineOptions({
  name: 'UserAvatar'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

const { bool: avatarError, setTrue: setError, setFalse: clearError } = useBoolean(false);

function loginOrRegister() {
  toLogin();
}

function handleAvatarLoad() {
  clearError();
}

function handleAvatarError() {
  setError();
}

type DropdownKey = 'userCenter' | 'switchRole' | 'toAdmin' | 'toDisk' | 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

// 判断是否在 disk 页面
const isDiskPage = computed(() => route.path.startsWith('/disk'));

// 判断是否在 admin 页面
const isAdminPage = computed(() => route.path.startsWith('/admin'));

// 判断用户是否有 admin 权限
// 1. 超级管理员（角色代码 R_SUPER 或角色名称包含 SuperAdmin）
// 2. 管理员角色（角色代码 R_ADMIN 或角色名称包含 Admin）
const hasAdminPermission = computed(() => {
  // 方式1：检查 isStaticSuper（基于角色名称）
  if (authStore.isStaticSuper) return true;

  // 方式2：检查角色代码
  const roleCode = authStore.userInfo.role?.toLowerCase() || '';
  if (['r_super', 'r_admin', 'superadmin', 'admin'].includes(roleCode)) return true;

  // 方式3：检查角色名称数组
  const roleNames = authStore.userInfo.roles.map(r => r.toLowerCase());
  if (roleNames.some(r => r.includes('superadmin') || r.includes('admin'))) return true;

  return false;
});

const options = computed(() => {
  const opts: DropdownOption[] = [];

  // 在 disk 页面，有 admin 权限时显示"去往管理中心"
  if (isDiskPage.value && hasAdminPermission.value) {
    opts.push({
      label: '管理中心',
      key: 'toAdmin',
      icon: SvgIconVNode({ icon: 'mdi:monitor-dashboard', fontSize: 18 })
    });
    opts.push({ type: 'divider', key: 'divider-nav' });
  }

  // 在 admin 页面，显示"去往网盘"
  if (isAdminPage.value) {
    opts.push({
      label: '我的网盘',
      key: 'toDisk',
      icon: SvgIconVNode({ icon: 'mdi:harddisk', fontSize: 18 })
    });
    opts.push({ type: 'divider', key: 'divider-nav' });
  }

  // 通用选项
  opts.push(
    {
      label: $t('common.userCenter'),
      key: 'userCenter',
      icon: SvgIconVNode({ icon: 'ph:user-circle', fontSize: 18 })
    },
    {
      label: $t('common.switchRole'),
      key: 'switchRole',
      icon: SvgIconVNode({ icon: 'ph:swap', fontSize: 18 })
    },
    {
      type: 'divider',
      key: 'divider'
    },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  );

  return opts;
});

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      authStore.resetStore();
    }
  });
}

function handleUserCenter() {
  window.$message?.destroyAll();
  window.$message?.info($t('common.userCenter') + ' - 功能开发中');
}

function handleSwitchRole() {
  window.$message?.destroyAll();
  window.$message?.warning($t('common.switchRole') + ' - 功能开发中');
}

function goToAdmin() {
  router.push('/admin');
}

function goToDisk() {
  router.push('/disk');
}

function handleDropdown(key: DropdownKey) {
  switch (key) {
    case 'logout':
      logout();
      break;
    case 'userCenter':
      handleUserCenter();
      break;
    case 'switchRole':
      handleSwitchRole();
      break;
    case 'toAdmin':
      goToAdmin();
      break;
    case 'toDisk':
      goToDisk();
      break;
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div class="flex cursor-pointer items-center rounded-md px-2 py-1 transition-colors duration-300 hover:bg-black/6">
      <div class="flex items-center gap-2" :class="{ 'opacity-50': avatarError }">
        <NAvatar
          v-if="authStore.userInfo.userAvatar"
          :size="24"
          round
          :src="authStore.userInfo.userAvatar"
          @load="handleAvatarLoad"
          @error="handleAvatarError"
        />
        <NAvatar v-else :size="32" round :src="defaultAvatar" @load="handleAvatarLoad" @error="handleAvatarError" />
        <span class="max-w-120px truncate text-14px font-medium">
          {{ authStore.userInfo.nickName }}
        </span>
      </div>
    </div>
  </NDropdown>
</template>

<style scoped></style>