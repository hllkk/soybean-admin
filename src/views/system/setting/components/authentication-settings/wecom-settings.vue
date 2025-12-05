<script lang="ts" setup>
import { ref, toRefs, watch } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
defineOptions({
  name: 'WecomSettings'
});

const { formRef } = useNaiveForm();

const props = defineProps<{
  model: Api.System.WecomSettings;
}>();

const { model } = toRefs(props);

// 确保model.enableWecom有正确的布尔值
watch(
  () => model.value.enableWecom,
  newVal => {
    // 确保enableWecom是布尔值
    if (newVal !== undefined && typeof newVal !== 'boolean') {
      model.value.enableWecom = Boolean(newVal);
    }
  },
  { immediate: true }
);

const showValidateInfo = ref(false);

const changeStatus = () => {
  showValidateInfo.value = !showValidateInfo.value;
};
</script>

<template>
  <div class="">
    <NForm ref="formRef" :model="model" label-placement="left" :label-width="100" label-align="right">
      <NFormItem label="企业微信登录" path="enableWecom">
        <NSwitch v-model:value="model.enableWecom">
          <template #checked>开启</template>
          <template #unchecked>关闭</template>
        </NSwitch>
        <NText depth="3" class="ml-10px text-sm">开启后，用户可以使用企业微信扫码登录</NText>
      </NFormItem>
      <NFormItem path="validateDomain">
        <NButton text type="info" icon-placement="right" @click="changeStatus">
          可信域名校验
          <template #icon>
            <icon-material-symbols:keyboard-arrow-down v-if="showValidateInfo" />
            <icon-material-symbols:keyboard-arrow-up v-else />
          </template>
        </NButton>
      </NFormItem>
      <NFormItem v-if="showValidateInfo" path="validateDomain">
        <NFlex vertical>
          <NAlert type="warning" :bordered="false">
            <template #icon>
              <icon-material-symbols:lightbulb-outline-rounded />
            </template>
            1. 用于企业微信自建应用“网页授权及JS-SDK”中可信域名校验。
            <br />
            2. 配置可信域名的文件名及文件内容信息，只需在创建企业微信认证服务器时填写，验证完毕后，无需再次填写。
            <br />
            3. 集群场景下，请在主节点配置可信域名。
          </NAlert>
          <NFormItem label="文件名" label-align="left" path="validateDomainFileName">
            <NInput v-model:value="model.validateDomainFileName" placeholder="请输入文件名" />
          </NFormItem>
          <NFormItem label="文件内容" label-align="left" path="validateDomainFileContent">
            <NInput v-model:value="model.validateDomainFileContent" placeholder="请输入文件内容" />
          </NFormItem>
        </NFlex>
      </NFormItem>
    </NForm>
  </div>
</template>
