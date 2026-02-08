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
  <NForm :model="model" label-placement="left" :label-width="150" label-align="right">
    <NFormItem label="开启 OnlyOffice" path="enable">
      <NSwitch v-model:value="model.enable">
        <template #checked>{{ $t('common.enable') }}</template>
        <template #unchecked>{{ $t('common.disable') }}</template>
      </NSwitch>
      <NText depth="3" class="ml-10px text-sm">禁用后offcie文件无法在线预览</NText>
    </NFormItem>
    <template v-if="model.enable">
      <NFormItem label="OnlyOffice地址" path="url">
        <div class="w-420px">
          <NInput v-model:value="model.serverUrl" clearable placeholder="请输入OnlyOffice的URL" />
          <NText depth="3" class="ml-3px text-sm">例如: https://your-jmalcloud-server.com/office</NText>
        </div>
      </NFormItem>
      <NFormItem label="密钥" path="secret">
        <div class="w-420px">
          <NInput
            v-model:value="model.tokenSecret"
            clearable
            placeholder="OnlyOffice JWT(留空为不适用密钥)"
            show-password-on="click"
            type="password"
          />
          <NText depth="3" class="ml-3px text-sm">建议使用密钥,防止office服务被白嫖</NText>
        </div>
      </NFormItem>
      <NFormItem label="回调服务地址" path="callbackUrl">
        <div class="w-420px">
          <NInput v-model:value="model.callbackUrl" clearable placeholder="后端API地址" />
          <NText depth="3" class="ml-3px text-sm">例如: http://your-domain-or-ip:8088/api</NText>
        </div>
      </NFormItem>
    </template>
  </NForm>
</template>
