<script lang="ts" setup>
import { toRefs, watch } from 'vue';

defineOptions({
  name: 'OnlyOfficeSettings'
});

const props = defineProps<{
  model: Api.System.OnlyOfficeSettings;
}>();

const { model } = toRefs(props);

// 确保model存在
watch(
  () => model.value,
  val => {
    if (!val) {
      // 如果未定义，通常父组件应该传入一个空对象，或者在这里处理
      // 但由于是 props.model 是引用，这里不能重新赋值 props.model
      // 依赖父组件确保传入了非空对象，或者在父组件初始化
    }
  },
  { immediate: true }
);
</script>

<template>
  <NForm :model="model" label-placement="left" :label-width="120" label-align="right">
    <div class="mb-6 flex flex-col space-y-2">
      <div class="flex-1 flex-row">
        <span class="mr-2 text-base">开启 OnlyOffice</span>
        <NSwitch v-model:value="model.enable">
          <template #checked>{{ $t('common.enable') }}</template>
          <template #unchecked>{{ $t('common.disable') }}</template>
        </NSwitch>
      </div>
      <NText depth="3" class="text-sm">开启后支持在线预览和编辑 Office 文档</NText>
    </div>

    <template v-if="model.enable">
      <NFormItem label="服务器地址" path="serverUrl">
        <div class="w-320px flex flex-col space-y-2">
          <NInput v-model:value="model.serverUrl" placeholder="http://onlyoffice.example.com/" />
          <NText depth="3" class="text-sm">OnlyOffice Document Server 的访问地址</NText>
        </div>
      </NFormItem>

      <NFormItem label="开启 Token 校验" path="verifyToken">
        <div class="w-320px flex flex-col space-y-2">
          <NSwitch v-model:value="model.verifyToken">
            <template #checked>{{ $t('common.enable') }}</template>
            <template #unchecked>{{ $t('common.disable') }}</template>
          </NSwitch>
          <NText depth="3" class="text-sm">开启 JWT Token 校验以增强安全性</NText>
        </div>
      </NFormItem>

      <NFormItem v-if="model.verifyToken" label="Token 密钥" path="tokenSecret">
        <div class="w-320px flex flex-col space-y-2">
          <NInput
            v-model:value="model.tokenSecret"
            type="password"
            show-password-on="click"
            placeholder="请输入 Token 密钥"
          />
          <NText depth="3" class="text-sm">与 Document Server 配置文件中保持一致的 secret</NText>
        </div>
      </NFormItem>
    </template>
  </NForm>
</template>
