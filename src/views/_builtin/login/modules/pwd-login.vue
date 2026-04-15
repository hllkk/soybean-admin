<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { fetchCheckDB } from '@/service/api/init';
import { fetchGetCaptchaStatus } from '@/service/api/system/setting';
import ClickCaptcha from '@/components/captcha/ClickCaptcha.vue';

defineOptions({
  name: 'PwdLogin'
});

const router = useRouter();
const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  userName: string;
  password: string;
}

const model: FormModel = reactive({
  userName: '',
  password: ''
});

// 记住我功能
const rememberMe = ref(false);
const REMEMBER_ME_KEY = 'login_remember_me';
const REMEMBERED_USER_KEY = 'remembered_user';

// 是否显示初始化按钮（默认隐藏，只有需要初始化时才显示）
const showInitButton = ref(false);

// 验证码是否开启（默认开启，防止API失败时无法登录）
const captchaEnabled = ref(true);

// checkDB 缓存 Key
const CHECK_DB_CACHE_KEY = 'check_db_result';
const CHECK_DB_CACHE_EXPIRE = 5 * 60 * 1000; // 5分钟缓存

interface CheckDBCache {
  needInit: boolean;
  timestamp: number;
}

// 页面加载时恢复记住的用户名
onMounted(async () => {
  const remembered = localStg.get(REMEMBER_ME_KEY);
  if (remembered) {
    rememberMe.value = true;
    const savedUser = localStg.get(REMEMBERED_USER_KEY);
    if (savedUser) {
      model.userName = savedUser;
    }
  }

  // 检查缓存
  const cache = localStg.get(CHECK_DB_CACHE_KEY) as CheckDBCache | null;
  const now = Date.now();

  if (cache && (now - cache.timestamp) < CHECK_DB_CACHE_EXPIRE) {
    // 使用缓存结果
    showInitButton.value = cache.needInit;
    return;
  }

  // 检查是否需要初始化（使用扁平响应模式）
  const { data, error } = await fetchCheckDB();
  if (!error && data) {
    showInitButton.value = data.needInit;
    // 缓存结果
    localStg.set(CHECK_DB_CACHE_KEY, {
      needInit: data.needInit,
      timestamp: now
    } as CheckDBCache);
  }

  // 获取验证码状态
  const captchaResult = await fetchGetCaptchaStatus();
  if (captchaResult.data) {
    captchaEnabled.value = captchaResult.data.enabled;
  }
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd
  };
});

// 验证码相关
const showCaptcha = ref(false);
const captchaRef = ref<InstanceType<typeof ClickCaptcha> | null>(null);

async function handleSubmit() {
  await validate();
  if (captchaEnabled.value) {
    // 验证码开启，触发验证码弹窗
    showCaptcha.value = true;
  } else {
    // 验证码关闭，直接登录
    handleCaptchaSuccess('');
  }
}

function handleCaptchaSuccess(captchaToken: string) {
  // 保存记住我状态
  if (rememberMe.value) {
    localStg.set(REMEMBER_ME_KEY, true);
    localStg.set(REMEMBERED_USER_KEY, model.userName);
  } else {
    localStg.remove(REMEMBER_ME_KEY);
    localStg.remove(REMEMBERED_USER_KEY);
  }
  authStore.login(model.userName, model.password, captchaToken);
}

// 第三方登录处理
function handleThirdPartyLogin(_type: 'wecom' | 'github' | 'gitee') {
  window.$notification?.destroyAll();
  window.$notification?.warning({
    title: $t('common.warning'),
    content: $t('page.login.pwdLogin.featureNotImplemented'),
    duration: 3000
  });
}

// 前往初始化页面
function goToInit() {
  router.push('/init');
}
</script>

<template>
  <div>
    <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
      <NFormItem path="userName">
        <NInput v-model:value="model.userName" :placeholder="$t('page.login.common.userNamePlaceholder')" />
      </NFormItem>
      <NFormItem path="password">
        <NInput
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('page.login.common.passwordPlaceholder')"
        />
      </NFormItem>
      <NSpace vertical :size="24">
        <div class="flex-y-center justify-between">
          <NCheckbox v-model:checked="rememberMe">{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        </div>
        <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
        <!-- 初始化按钮 -->
        <NButton v-if="showInitButton" quaternary size="large" round block @click="goToInit">
          <template #icon>
            <SvgIcon icon="mdi:database-cog" class="text-18px" />
          </template>
          前往系统初始化
        </NButton>
        <NDivider class="text-14px text-#666 !m-0">{{ $t('page.login.pwdLogin.thirdPartyLogin') }}</NDivider>
        <div class="flex-center gap-24px">
          <!-- 企业微信登录 -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton quaternary circle size="large" class="third-party-btn wecom" @click="handleThirdPartyLogin('wecom')">
                <template #icon>
                  <icon-tdesign-logo-wecom class="size-5" />
                </template>
              </NButton>
            </template>
            {{ $t('page.login.pwdLogin.wecomLogin') }}
          </NTooltip>
          <!-- GitHub 登录 -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton quaternary circle size="large" class="third-party-btn github" @click="handleThirdPartyLogin('github')">
                <template #icon>
                  <icon-radix-icons-github-logo class="size-5" />
                </template>
              </NButton>
            </template>
            {{ $t('page.login.pwdLogin.githubLogin') }}
          </NTooltip>
          <!-- Gitee 登录 -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton quaternary circle size="large" class="third-party-btn gitee" @click="handleThirdPartyLogin('gitee')">
                <template #icon>
                  <icon-simple-icons-gitee class="size-5" />
                </template>
              </NButton>
            </template>
            {{ $t('page.login.pwdLogin.giteeLogin') }}
          </NTooltip>
        </div>
      </NSpace>
    </NForm>

    <!-- 点击验证码弹窗 -->
    <ClickCaptcha
      ref="captchaRef"
      v-model:show="showCaptcha"
      @success="handleCaptchaSuccess"
    />
  </div>
</template>

<style scoped>
/* 第三方登录按钮基础样式 */
.third-party-btn {
  transition: all 0.2s ease;
}

.third-party-btn:hover {
  transform: scale(1.1);
}

/* 企业微信 - 蓝色品牌色 #2B7EF9 */
.third-party-btn.wecom {
  color: #2B7EF9;
}

.third-party-btn.wecom:hover {
  background-color: rgba(43, 126, 249, 0.1);
}

/* 暗黑模式下的企业微信颜色 */
:root.dark .third-party-btn.wecom {
  color: #5B9DFA;
}

:root.dark .third-party-btn.wecom:hover {
  background-color: rgba(91, 157, 250, 0.15);
}

/* GitHub - 深灰/黑色 */
.third-party-btn.github {
  color: #24292F;
}

.third-party-btn.github:hover {
  background-color: rgba(36, 41, 47, 0.1);
}

/* 暗黑模式下的 GitHub 颜色 */
:root.dark .third-party-btn.github {
  color: #E6EDF3;
}

:root.dark .third-party-btn.github:hover {
  background-color: rgba(230, 237, 243, 0.1);
}

/* Gitee - 红色品牌色 #C71D23 */
.third-party-btn.gitee {
  color: #C71D23;
}

.third-party-btn.gitee:hover {
  background-color: rgba(199, 29, 35, 0.1);
}

/* 暗黑模式下的 Gitee 颜色 */
:root.dark .third-party-btn.gitee {
  color: #E85D62;
}

:root.dark .third-party-btn.gitee:hover {
  background-color: rgba(232, 93, 98, 0.15);
}
</style>
