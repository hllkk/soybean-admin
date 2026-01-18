<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { fetchWecomQrCode, fetchWecomQrCodeStatus } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({
  name: 'WecomLogin'
});

const { toggleLoginModule, redirectFromLogin } = useRouterPush(false);
const authStore = useAuthStore();

const qrCodeUrl = ref<string>('');
// const qrCodeKey = ref<string>('');
const qrCodeStatus = ref<Api.Auth.WecomQrCodeStatus>('waiting');
const qrCodeSceneId = ref<string>('');
const loading = ref<boolean>(false);
const error = ref<string>('');
const pollingTimer = ref<number | null>(null);

const POLLING_INTERVAL = 2000;

async function loadQrCode() {
  try {
    loading.value = true;
    error.value = '';
    const { data: blob, error: err, response } = await fetchWecomQrCode();
    if (err) {
      error.value = `${err}，请点击刷新后重试`;
      return;
    }
    // 从响应头中获取场景ID
    const sceneId = response?.headers['x-scene-id'] as string | undefined;
    if (sceneId) {
      qrCodeSceneId.value = sceneId;
      startPolling();
    }
    qrCodeUrl.value = URL.createObjectURL(blob);
    qrCodeStatus.value = 'waiting';
  } catch (err) {
    error.value = `${err}，请点击刷新后重试`;
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollingTimer.value = window.setInterval(async () => {
    try {
      if (!qrCodeSceneId.value) {
        return;
      }
      const { data: response, error: err } = await fetchWecomQrCodeStatus(qrCodeSceneId.value);
      if (err) {
        stopPolling();
        error.value = '查询二维码状态失败';
        return;
      }
      qrCodeStatus.value = response.status;

      if (response.status === 'confirmed' && response.token && response.refreshToken) {
        stopPolling();
        const success = await authStore.loginByToken({
          token: response.token,
          refreshToken: response.refreshToken
        });
        if (success) {
          window.$notification?.success({
            title: $t('page.login.common.loginSuccess'),
            content: $t('page.login.common.welcomeBack', { userName: authStore.userInfo.userName }),
            duration: 4500
          });
          await redirectFromLogin();
        } else {
          error.value = '登录失败';
        }
        return;
      }

      if (response.status === 'expired' || response.status === 'canceled') {
        stopPolling();
      }
    } catch (err) {
      stopPolling();
      error.value = `查询二维码状态失败:${err}`;
    }
  }, POLLING_INTERVAL);
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
}

function handleRefresh() {
  if (qrCodeUrl.value) {
    URL.revokeObjectURL(qrCodeUrl.value);
  }
  loadQrCode();
}

function handleBack() {
  stopPolling();
  if (qrCodeUrl.value) {
    URL.revokeObjectURL(qrCodeUrl.value);
  }
  toggleLoginModule('pwd-login');
}

onMounted(() => {
  loadQrCode();
});

onUnmounted(() => {
  stopPolling();
  if (qrCodeUrl.value) {
    URL.revokeObjectURL(qrCodeUrl.value);
  }
});
</script>

<template>
  <div class="size-full min-h-320px">
    <div v-if="loading" class="h-320px flex-center">
      <NSpin size="large" />
    </div>

    <div v-else-if="error" class="h-320px flex-center">
      <div class="flex-col-center" @click="handleRefresh">
        <SvgIcon icon="ic-baseline-refresh" class="text-32px" />
        <span class="text-gray-500">{{ error }}, 请点击刷新后重试</span>
      </div>
    </div>

    <div v-else class="flex-col-center gap-16px">
      <div class="h-280px w-280px">
        <NImage v-if="qrCodeUrl" :src="qrCodeUrl" />
      </div>
      <div v-if="qrCodeStatus === 'scanned'" class="flex-y-center gap-4px">
        <SvgIcon local-icon="page-check_mark" class="text-24px text-success" />
        <span>已扫描</span>
      </div>
      <div class="flex flex-col-center gap-12px">
        <div class="text-gray-500">其他方式登录</div>
        <NButton round type="primary" @click="handleBack">
          <template #icon>
            <SvgIcon icon="ri-arrow-go-back-fill" />
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
