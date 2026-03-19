<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { loginModuleRecord } from '@/constants/app';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import ClickCaptcha from '@/components/captcha/ClickCaptcha.vue';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  userName: string;
  password: string;
}

const model: FormModel = reactive({
  userName: '',
  password: ''
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
  // 显示验证码弹窗
  showCaptcha.value = true;
}

function handleCaptchaSuccess(captchaToken: string) {
  // 验证码验证成功，执行登录
  authStore.login(model.userName, model.password, captchaToken);
}

type AccountKey = 'super' | 'admin' | 'user';

interface Account {
  key: AccountKey;
  label: string;
  userName: string;
  password: string;
}

const accounts = computed<Account[]>(() => [
  {
    key: 'super',
    label: $t('page.login.pwdLogin.superAdmin'),
    userName: 'Super',
    password: '123456'
  },
  {
    key: 'admin',
    label: $t('page.login.pwdLogin.admin'),
    userName: 'Admin',
    password: '123456'
  },
  {
    key: 'user',
    label: $t('page.login.pwdLogin.user'),
    userName: 'User',
    password: '123456'
  }
]);

async function handleAccountLogin(account: Account) {
  model.userName = account.userName;
  model.password = account.password;
  await validate();
  showCaptcha.value = true;
}

// 预计算国际化标签
const codeLoginLabel = computed(() => $t(loginModuleRecord['code-login']));
const registerLabel = computed(() => $t(loginModuleRecord.register));
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
          <NCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
          <NButton quaternary @click="toggleLoginModule('reset-pwd')">
            {{ $t('page.login.pwdLogin.forgetPassword') }}
          </NButton>
        </div>
        <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
        <div class="flex-y-center justify-between gap-12px">
          <NButton class="flex-1" block @click="toggleLoginModule('code-login')">
            {{ codeLoginLabel }}
          </NButton>
          <NButton class="flex-1" block @click="toggleLoginModule('register')">
            {{ registerLabel }}
          </NButton>
        </div>
        <NDivider class="text-14px text-#666 !m-0">{{ $t('page.login.pwdLogin.otherAccountLogin') }}</NDivider>
        <div class="flex-center gap-12px">
          <NButton v-for="item in accounts" :key="item.key" type="primary" @click="handleAccountLogin(item)">
            {{ item.label }}
          </NButton>
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

<style scoped></style>