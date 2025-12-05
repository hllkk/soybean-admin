<script lang="ts" setup>
import { toRefs } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useNaiveForm } from '@/hooks/common/form';

defineOptions({
  name: 'GeneralSettings'
});

const props = defineProps<{
  model: Api.System.GeneralSettings;
}>();

const { model } = toRefs(props);

const appStore = useAppStore();

// const { formRef, validate } = useNaiveForm();
const { formRef } = useNaiveForm();

const verifyCodeTypeOptions: SelectOption[] = [
  {
    label: '点选式验证码',
    value: 'click'
  },
  {
    label: '滑动式验证码',
    value: 'slide',
    disabled: true
  },
  {
    label: '拖拽式验证码',
    value: 'drag',
    disabled: true
  },
  {
    label: '旋转式验证码',
    value: 'rotate',
    disabled: true
  }
];
</script>

<template>
  <div class="flex flex-col items-start space-y-4">
    <NSplit :direction="appStore.isMobile ? 'vertical' : 'horizontal'" :max="0.7" :min="0.4">
      <template #1>
        <NForm ref="formRef" :model="model" label-placement="left" :label-width="100" label-align="right">
          <NFormItem label="后台管理名称" path="systemName">
            <div class="w-240px flex flex-col space-y-2">
              <NInput v-model:value="model.systemName" clearable />
              <NText depth="3" class="text-sm">后台管理菜单标题,修改后失去国际化</NText>
            </div>
          </NFormItem>
          <NFormItem label="网盘首页名称" path="diskName">
            <div class="w-240px flex flex-col space-y-2">
              <NInput v-model:value="model.diskName" clearable :input-props="{ autocomplete: 'username' }" />
              <NText depth="3" class="text-sm">网盘菜单标题,修改后失去国际化</NText>
            </div>
          </NFormItem>
          <NFormItem label="用户默认密码" path="userDefaultPassword">
            <div class="w-240px flex flex-col space-y-2">
              <NInput
                v-model:value="model.userDefaultPassword"
                clearable
                show-password-on="click"
                type="password"
                autosize
                placeholder="请输入用户默认密码"
                :input-props="{ autocomplete: 'current-password' }"
              />
              <NText depth="3" class="text-sm">创建用户时的默认密码</NText>
            </div>
          </NFormItem>
          <NFormItem label="用户默认角色" path="userDefaultRoles">
            <div class="w-240px flex flex-col space-y-2">
              <RoleSelect v-model:value="model.userDefaultRole" clearable />
              <NText depth="3" class="text-sm">用户默认角色，所有用户默认权限</NText>
            </div>
          </NFormItem>
          <NFormItem label-placement="left" label="开启验证码" path="enableVerifyCode">
            <NSwitch v-model:value="model.enableVerifyCode">
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </NSwitch>
          </NFormItem>
          <NFormItem v-if="model.enableVerifyCode" label-placement="left" label="验证码类型" path="verifyCodeType">
            <div class="w-240px flex flex-col space-y-2">
              <NSelect v-model:value="model.verifyCodeType" :options="verifyCodeTypeOptions" />
            </div>
          </NFormItem>
          <NFormItem v-if="model.enableVerifyCode" label-placement="left" label="验证码误差" path="verifyInaccuracy">
            <NInputNumber v-model:value="model.verifyInaccuracy" />
            <NText depth="3" class="ml-10px text-sm">验证码误差, 数字越大则要求的精细度越低</NText>
          </NFormItem>
        </NForm>
      </template>
      <template #2></template>
    </NSplit>
  </div>
</template>
