<script lang="ts" setup>
import { computed, ref, toRefs, watch } from 'vue';
import type { FormValidationStatus } from 'naive-ui';
import { REG_IPV4, REG_IPV4_MASK, REG_IPV4_RANGE } from '@/constants/reg';

defineOptions({
  name: 'SecuritySettings'
});

const props = defineProps<{
  model: Api.System.SecuritySettings;
}>();

const { model } = toRefs(props);

const checkMessage = ref();
const whiteListStatus = ref<FormValidationStatus | undefined>();
const blackListStatus = ref<FormValidationStatus | undefined>();
const whiteListData = ref();
const blackListData = ref();
const options = [
  {
    label: '黑名单',
    key: 1
  },

  {
    label: '白名单',
    key: 2
  }
];
const ipMode = computed(() => {
  return model.value.ip_check_mode === 1 ? '黑名单' : '白名单';
});

const inputDisable = computed(() => {
  return model.value.ip_check_mode === 1;
});

const checkIplist = (data: Array<string>) => {
  let res = true;
  const newList: string[] = [];
  data.every(item => {
    if (!REG_IPV4.test(item) && !REG_IPV4_MASK.test(item) && !REG_IPV4_RANGE.test(item)) {
      res = false;
      checkMessage.value = `格式错误 - ${item}`;
      return res;
    } else if (newList.includes(item)) {
      res = false;
      checkMessage.value = `重复配置 - ${item}`;
      return res;
    }
    newList.push(item);
    return true;
  });
  return res;
};

const handleSelect = (key: number) => {
  model.value.ip_check_mode = key;
};

function handleBlackListBlur() {
  if (blackListData.value) {
    const ipList = (blackListData.value as string).split(',');
    const checkRes = checkIplist(ipList);
    if (checkRes) {
      checkMessage.value = '';
      model.value.ip_black_list = ipList;
      blackListStatus.value = 'success';
    } else {
      blackListStatus.value = 'error';
    }
  } else {
    model.value.ip_black_list = [];
    checkMessage.value = '';
    blackListStatus.value = 'success';
  }
}

function handleWhiteListBlur() {
  if (whiteListData.value) {
    const ipList = (whiteListData.value as string).split(',');
    const checkRes = checkIplist(ipList);
    if (checkRes) {
      checkMessage.value = '';
      model.value.ip_white_list = ipList;
      whiteListStatus.value = 'success';
    } else {
      whiteListStatus.value = 'error';
    }
  } else {
    model.value.ip_white_list = [];
    checkMessage.value = '';
    whiteListStatus.value = 'success';
  }
}

// 初始化IP列表数据
watch(
  () => model.value,
  newVal => {
    if (newVal.ip_black_list && newVal.ip_black_list.length > 0) {
      blackListData.value = newVal.ip_black_list.join(',');
    }
    if (newVal.ip_white_list && newVal.ip_white_list.length > 0) {
      whiteListData.value = newVal.ip_white_list.join(',');
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex flex-col space-y-8">
    <div class="flex flex-col space-y-2">
      <div class="flex-1 flex-row">
        <span class="mr-2 text-base">开启MFA登录</span>
        <NSwitch v-model:value="model.ip_check">
          <template #checked>{{ $t('common.enable') }}</template>
          <template #unchecked>{{ $t('common.disable') }}</template>
        </NSwitch>
        <span class="ml-6 mr-2 text-base">IP校验模式</span>
        <NDropdown trigger="click" :options="options" @select="handleSelect">
          <NButton v-model:value="model.ip_check_mode" size="small">{{ ipMode }}</NButton>
        </NDropdown>
      </div>
      <NText depth="3" class="text-sm">
        开启IP校验后将通过判断用户的请求IP地址来限制用户访问，校验模式分为白名单和黑名单。
        <br />
        注: 白名单模式将只允许白名单列表中的IP地址访问
        <br />
        注: 黑名单模式将只允许不在黑名单列表中的IP地址访问
      </NText>
    </div>
    <div class="flex flex-col space-y-2">
      <div class="flex-1 flex-row">
        <span class="mr-2 text-base">IP黑名单列表</span>
        <span v-show="model.ip_check_mode === 1" class="ml-2 text-error">
          {{ checkMessage }}
        </span>
      </div>
      <NInput
        v-model:value="blackListData"
        type="textarea"
        size="small"
        :status="blackListStatus"
        placeholder="127.0.0.1,127.0.0.0/24,127.0.0.1-127.0.0.255"
        :disabled="!inputDisable"
        round
        @blur="handleBlackListBlur"
      />
    </div>
    <div class="flex flex-col space-y-2">
      <div class="flex-1 flex-row">
        <span class="mr-2 text-base">IP白名单列表</span>
        <span v-show="model.ip_check_mode === 2" class="ml-2 text-error">{{ checkMessage }}</span>
      </div>
      <NInput
        v-model:value="whiteListData"
        type="textarea"
        size="small"
        :status="whiteListStatus"
        placeholder="127.0.0.1,127.0.0.0/24,127.0.0.1-127.0.0.255"
        :disabled="inputDisable"
        round
        @blur="handleWhiteListBlur"
      />
    </div>
  </div>
</template>
