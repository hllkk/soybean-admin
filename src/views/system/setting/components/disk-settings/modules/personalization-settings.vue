<script lang="ts" setup>
import { toRefs } from 'vue';

defineOptions({
  name: 'DiskPersonalizationSettings'
});

const props = defineProps<{
  model: Api.System.DiskSettings;
}>();

const { model } = toRefs(props);
</script>

<template>
  <NForm :model="model" label-placement="left" :label-width="120" label-align="right">
    <NFormItem label="网盘首页名称" path="diskName">
      <div class="w-240px flex flex-col space-y-2">
        <NInput v-model:value="model.diskName" clearable :input-props="{ autocomplete: 'username' }" />
        <NText depth="3" class="text-sm">网盘菜单标题,修改后失去国际化</NText>
      </div>
    </NFormItem>
  </NForm>
</template>
