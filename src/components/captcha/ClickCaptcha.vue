<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { fetchCaptcha, fetchCaptchaRefresh, fetchCaptchaVerify } from "@/service/api/captcha";
import type { ClickDot } from "@/service/api/captcha";

interface Props {
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  success: [token: string];
  cancel: [];
}>();

const loading = ref(false);
const captchaKey = ref("");
const imageBase64 = ref("");
const thumbBase64 = ref("");
const clickDots = ref<ClickDot[]>([]);
const clickIndex = ref(0);
const errorMsg = ref("");
const imageRef = ref<HTMLImageElement | null>(null);

const imageSrc = computed(() => {
  if (!imageBase64.value) return "";
  return imageBase64.value.startsWith("data:")
    ? imageBase64.value
    : `data:image/png;base64,${imageBase64.value}`;
});

const thumbSrc = computed(() => {
  if (!thumbBase64.value) return "";
  return thumbBase64.value.startsWith("data:")
    ? thumbBase64.value
    : `data:image/png;base64,${thumbBase64.value}`;
});

async function loadCaptcha() {
  loading.value = true;
  errorMsg.value = "";
  clickDots.value = [];
  clickIndex.value = 0;

  try {
    const { data, error } = await fetchCaptcha();
    if (!error && data) {
      captchaKey.value = data.captchaKey;
      imageBase64.value = data.image;
      thumbBase64.value = data.thumb;
    } else {
      errorMsg.value = "获取验证码失败";
    }
  } catch (e) {
    console.error("获取验证码失败:", e);
    errorMsg.value = "获取验证码失败";
  } finally {
    loading.value = false;
  }
}

async function refreshCaptcha() {
  if (!captchaKey.value) {
    await loadCaptcha();
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  clickDots.value = [];
  clickIndex.value = 0;

  try {
    const { data, error } = await fetchCaptchaRefresh(captchaKey.value);
    if (!error && data) {
      captchaKey.value = data.captchaKey;
      imageBase64.value = data.image;
      thumbBase64.value = data.thumb;
    } else {
      await loadCaptcha();
    }
  } catch (e) {
    errorMsg.value = `刷新验证码失败: ${e}`;
    await loadCaptcha();
  } finally {
    loading.value = false;
  }
}

function handleImageClick(event: MouseEvent) {
  if (!imageRef.value) return;

  const rect = imageRef.value.getBoundingClientRect();
  const x = Math.round(event.clientX - rect.left);
  const y = Math.round(event.clientY - rect.top);

  clickIndex.value++;

  clickDots.value.push({
    key: Date.now(),
    index: clickIndex.value,
    x,
    y
  });
}

async function handleConfirm() {
  if (clickDots.value.length === 0) {
    errorMsg.value = "请点击验证码图片";
    return;
  }

  loading.value = true;
  errorMsg.value = "";

  try {
    const { data, error } = await fetchCaptchaVerify({
      captchaKey: captchaKey.value,
      clickDots: clickDots.value
    });

    if (!error && data) {
      emit("success", data.captchaToken);
      handleClose();
    } else {
      errorMsg.value = "验证失败，请重试";
      await refreshCaptcha();
    }
  } catch (e) {
    console.error("验证验证码失败:", e);
    errorMsg.value = "验证失败，请重试";
    await refreshCaptcha();
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit("update:show", false);
}

function handleCancel() {
  emit("cancel");
  handleClose();
}

function clearClicks() {
  clickDots.value = [];
  clickIndex.value = 0;
}

// 监听 show 变化，显示时加载验证码
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      loadCaptcha();
    }
  }
);

onMounted(() => {
  if (props.show) {
    loadCaptcha();
  }
});

defineExpose({
  refresh: refreshCaptcha,
  load: loadCaptcha
});
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="false"
    preset="card"
    title="请完成安全验证"
    :bordered="false"
    class="w-400px"
    @update:show="emit('update:show', $event)"
  >
    <div class="flex flex-col items-center gap-4">
      <!-- 缩略图提示 -->
      <div v-if="thumbSrc" class="flex items-center gap-2 text-14px text-gray-600">
        <span>请依次点击:</span>
        <img :src="thumbSrc" alt="提示图" class="h-40px rounded" />
      </div>

      <!-- 验证码图片 -->
      <NSpin :show="loading">
        <div class="relative">
          <img
            ref="imageRef"
            :src="imageSrc"
            alt="验证码"
            class="w-300px h-200px cursor-pointer rounded border border-gray-200"
            @click="handleImageClick"
          />
          <!-- 点击标记点 -->
          <div
            v-for="dot in clickDots"
            :key="dot.key"
            class="absolute w-24px h-24px -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-white flex-center text-12px font-bold"
            :style="{ left: `${dot.x}px`, top: `${dot.y}px` }"
          >
            {{ dot.index }}
          </div>
        </div>
      </NSpin>

      <!-- 错误提示 -->
      <NText v-if="errorMsg" type="error" class="text-12px">
        {{ errorMsg }}
      </NText>

      <!-- 操作按钮 -->
      <NSpace>
        <NButton quaternary size="small" @click="refreshCaptcha">
          <template #icon>
            <icon-mdi-refresh />
          </template>
          换一张
        </NButton>
        <NButton size="small" @click="clearClicks">
          清除
        </NButton>
      </NSpace>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" :loading="loading" :disabled="clickDots.length === 0" @click="handleConfirm">
          确认
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
