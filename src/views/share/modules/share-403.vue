<script setup lang="ts">
import { useRouter } from 'vue-router';
import { $t } from '@/locales';

defineOptions({
  name: 'Share403'
});

interface Props {
  message?: string;
}

const props = defineProps<Props>();

const router = useRouter();

// 返回首页
function goHome() {
  router.push('/');
}

// 登录
function goLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="w-full max-w-400px flex flex-col items-center gap-24px">
    <!-- 错误图标 -->
    <div class="w-80px h-80px rounded-full bg-error/10 flex items-center justify-center">
      <SvgIcon icon="mdi:cancel" :size="48" class="text-error" />
    </div>

    <!-- 标题 -->
    <div class="text-20px font-medium text-error">
      {{ $t('page.share.shareExpired') }}
    </div>

    <!-- 说明 -->
    <div class="text-14px opacity-60 text-center leading-relaxed">
      {{ props.message || $t('page.share.shareExpiredTip') }}
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-16px">
      <NButton @click="goHome">
        {{ $t('page.share.goHome') }}
      </NButton>
      <NButton type="primary" @click="goLogin">
        {{ $t('page.share.loginMyDisk') }}
      </NButton>
    </div>
  </div>
</template>