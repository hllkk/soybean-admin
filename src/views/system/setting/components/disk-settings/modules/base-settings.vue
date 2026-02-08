<script lang="ts" setup>
import { toRefs } from 'vue';

defineOptions({
  name: 'DiskBaseSettings'
});

const props = defineProps<{
  model: Api.System.DiskSettings;
}>();

const { model } = toRefs(props);
</script>

<template>
  <NForm :model="model" label-placement="left" :label-width="120" label-align="right">
    <NFormItem label="最大上传大小" path="maxUploadSize">
      <div class="w-240px flex flex-col space-y-2">
        <NInputNumber v-model:value="model.maxUploadSize" :min="0">
          <template #suffix>MB</template>
        </NInputNumber>
        <NText depth="3" class="text-sm">限制单次上传文件的最大大小，0表示不限制</NText>
      </div>
    </NFormItem>
    <NFormItem label="允许的扩展名" path="allowedExtensions">
      <div class="w-320px flex flex-col space-y-2">
        <NSelect
          v-model:value="model.allowedExtensions"
          multiple
          filterable
          tag
          placeholder="请输入允许上传的扩展名，回车确认"
        />
        <NText depth="3" class="text-sm">限制允许上传的文件扩展名，留空表示允许所有</NText>
      </div>
    </NFormItem>
  </NForm>
</template>
