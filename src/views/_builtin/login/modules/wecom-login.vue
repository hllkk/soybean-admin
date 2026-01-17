<script setup lang="ts">
import { ref } from 'vue';

// import { onMounted, onUnmounted, ref } from 'vue';
// import { fetchWecomQrCode, fetchWecomQrCodeStatus } from '@/service/api/system/auth';
// import { useAuthStore } from '@/store/modules/auth';
// import { useRouterPush } from '@/hooks/common/router';
// import { $t } from '@/locales';

defineOptions({
  name: 'WecomLogin'
});

// const authStore = useAuthStore();
// const { toggleLoginModule } = useRouterPush();

const qrCodeUrl = ref<string>('');
// const qrCodeKey = ref<string>('');
const qrCodeStatus = ref<Api.Auth.WecomQrCodeStatus>('waiting');
const loading = ref<boolean>(false);
const error = ref<string>('');
// const pollingTimer = ref<number | null>(null);

// const POLLING_INTERVAL = 2000;

// async function loadQrCode() {
//   try {
//     loading.value = true;
//     error.value = '';
//     const blob = await fetchWecomQrCode();
//     qrCodeUrl.value = URL.createObjectURL(blob);

//     const response = await fetchWecomQrCodeStatus('');
//     qrCodeKey.value = response.qrCodeKey;
//     qrCodeStatus.value = response.status;

//     startPolling();
//   } catch (err) {
//     error.value = $t('page.login.wecomLogin.loadFailed');
//   } finally {
//     loading.value = false;
//   }
// }

// function startPolling() {
//   stopPolling();
//   pollingTimer.value = window.setInterval(async () => {
//     try {
//       const response = await fetchWecomQrCodeStatus(qrCodeKey.value);
//       qrCodeStatus.value = response.status;

//       if (response.status === 'confirmed' && response.token) {
//         stopPolling();
//         await authStore.handleLoginSuccess(response.token, response.refreshToken);
//       } else if (response.status === 'expired' || response.status === 'canceled') {
//         stopPolling();
//       }
//     } catch (err) {
//       stopPolling();
//     }
//   }, POLLING_INTERVAL);
// }

// function stopPolling() {
//   if (pollingTimer.value) {
//     clearInterval(pollingTimer.value);
//     pollingTimer.value = null;
//   }
// }

function handleRefresh() {
  window.$message?.info('刷新二维码');
  // if (qrCodeUrl.value) {
  //   URL.revokeObjectURL(qrCodeUrl.value);
  // }
  // loadQrCode();
}

function handleBack() {
  // stopPolling();
  // if (qrCodeUrl.value) {
  //   URL.revokeObjectURL(qrCodeUrl.value);
  // }
  // toggleLoginModule('pwd-login');
}

// onMounted(() => {
//   loadQrCode();
// });

// onUnmounted(() => {
//   stopPolling();
//   if (qrCodeUrl.value) {
//     URL.revokeObjectURL(qrCodeUrl.value);
//   }
// });
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
