<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { VNode } from 'vue';
import { useBoolean } from '@sa/hooks';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush, useSharedPageNav } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import defaultAvatar from '@/assets/imgs/soybean.jpg';
import { $t } from '@/locales';

defineOptions({
  name: 'UserAvatar'
});

const router = useRouter();
const authStore = useAuthStore();
const { toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();
const { navigateToSharedPage, currentModule } = useSharedPageNav();

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

// 判断当前模块
const isDiskPage = computed(() => currentModule.value === 'disk');
const isAdminPage = computed(() => currentModule.value === 'admin');

// 判断用户是否有 admin 权限
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

  // 不在 disk 页面时，显示"我的网盘"
  if (!isDiskPage.value) {
    opts.push({
      label: '我的网盘',
      key: 'toDisk',
      icon: SvgIconVNode({ icon: 'mdi:harddisk', fontSize: 18 })
    });
  }

  // 不在 admin/manage 页面，且有权限时，显示"管理中心"
  if (!isAdminPage.value && hasAdminPermission.value) {
    opts.push({
      label: '管理中心',
      key: 'toAdmin',
      icon: SvgIconVNode({ icon: 'mdi:monitor-dashboard', fontSize: 18 })
    });
  }

  // 如果有导航项，添加分隔线
  if (opts.length > 0) {
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
  navigateToSharedPage('user-center');
}

function handleSwitchRole() {
  window.$message?.destroyAll();
  window.$message?.warning($t('common.switchRole') + ' - 功能开发中');
}

function goToAdmin() {
  router.push({ name: 'admin' });
}

function goToDisk() {
  router.push({ name: 'disk' });
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