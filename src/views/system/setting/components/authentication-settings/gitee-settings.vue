<script lang="ts" setup>
import { toRefs } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';

defineOptions({
  name: 'GiteeSettings'
});

const { formRef } = useNaiveForm();

const props = defineProps<{
  model: Api.System.GiteeSettings;
}>();

const { model } = toRefs(props);
</script>

<template>
  <NForm ref="formRef" :model="model" label-placement="left" :label-width="100" label-align="right">
    <NFormItem label="Gitee登录" path="enableGitee">
      <NSwitch v-model:value="model.enableGitee">
        <template #checked>开启</template>
        <template #unchecked>关闭</template>
      </NSwitch>
      <NText depth="3" class="ml-10px text-sm">开启后，用户可以使用Gitee扫码登录</NText>
    </NFormItem>
  </NForm>
</template>
