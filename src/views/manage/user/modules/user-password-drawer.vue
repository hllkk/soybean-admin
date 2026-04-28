<script setup lang="ts">
import type { PasswordPolicy } from '@/hooks/common/form';
import { onMounted, reactive, ref, watch } from 'vue';
import { fetchGetSystemSettings, fetchResetUserPassword } from '@/service/api/system';
import { createDynamicPwdRule, buildPasswordHint, useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'UserPasswordDrawer'
});

interface Props {
  /** the edit row data */
  rowData?: Api.System.User | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { patternRules } = useFormRules();

type Model = Api.System.UserOperateParams & { deptName: string };

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    deptId: null,
    userName: '',
    nickName: '',
    deptName: '',
    password: ''
  };
}

// 密码策略
const passwordPolicy = ref<PasswordPolicy>({
  minLength: 8,
  requireUppercase: false,
  requireLowercase: false,
  requireDigit: true,
  requireSpecial: true
});

const pwdHint = ref('至少8位，需包含数字和特殊字符');

type RuleKey = Extract<keyof Model, 'password'>;

const rules = ref<Record<RuleKey, App.Global.FormRule[]>>({
  password: [{ ...patternRules.pwd }]
});

// 加载密码策略
async function loadPasswordPolicy() {
  try {
    const { data, error } = await fetchGetSystemSettings();
    if (!error && data?.security) {
      const sec = data.security;
      const policy: PasswordPolicy = {
        minLength: sec.passwordMinLength || 8,
        requireUppercase: sec.passwordRequireUppercase ?? false,
        requireLowercase: sec.passwordRequireLowercase ?? false,
        requireDigit: sec.passwordRequireDigit ?? true,
        requireSpecial: sec.passwordRequireSpecial ?? true
      };
      passwordPolicy.value = policy;
      pwdHint.value = buildPasswordHint(policy);
      rules.value = {
        password: [createDynamicPwdRule(policy)]
      };
    }
  } catch {
    // 使用默认规则
  }
}

function handleUpdateModelWhenEdit() {
  Object.assign(model, props.rowData);
  model.password = '';
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { userId, password } = model;

  // request
  const { error } = await fetchResetUserPassword(userId!, password!);
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});

onMounted(() => {
  loadPasswordPolicy();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent title="重置密码" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="$t('page.system.user.nickName')" path="nickName">
          <NInput v-model:value="model.nickName" disabled />
        </NFormItem>
        <NFormItem :label="$t('page.system.user.deptName')" path="deptName">
          <NInput v-model:value="model.deptName" disabled />
        </NFormItem>
        <NFormItem :label="$t('page.system.user.userName')" path="userName">
          <NInput v-model:value="model.userName" disabled />
        </NFormItem>
        <NFormItem :label="$t('page.system.user.password')" path="password">
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            :input-props="{ autocomplete: 'off' }"
            :placeholder="$t('page.system.user.form.password.required')"
          />
          <NText depth="3" class="ml-8px text-12px whitespace-nowrap">{{ pwdHint }}</NText>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
