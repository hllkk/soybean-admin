<script lang="ts" setup>
import { ref } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchGetSocialList, fetchSocialAuthBinding, fetchSocialAuthUnbinding } from '@/service/api/system';

defineOptions({
  name: 'SocialCard'
});


const socialList = ref<Api.System.Social[]>([]);
const { loading, startLoading, endLoading } = useLoading();
const { loading: btnLoading, startLoading: startBtnLoading, endLoading: endBtnLoading } = useLoading();

/** 获取SSO账户列表 */
async function getSsoUserList() {
  startLoading();
  const { data, error } = await fetchGetSocialList();
  if (!error) {
    socialList.value = data || [];
  }
  endLoading();
}

/** 绑定SSO账户（简化版：模拟绑定） */
async function bindSsoAccount(type: Api.System.SocialSource) {
  // 由于没有实际的OAuth服务，这里模拟绑定流程
  // 实际项目中应该跳转到第三方授权页面
  window.$message?.info('请在实际部署环境中配置OAuth服务');

  // 模拟绑定（开发测试用）
  const mockData = {
    source: type,
    authId: `${type}_${Date.now()}`,
    nickName: `测试${type}账号`,
    avatar: '',
    email: ''
  };

  const { error } = await fetchSocialAuthBinding(mockData);
  if (!error) {
    window.$message?.success('绑定成功');
    await getSsoUserList();
  }
}

/** 解绑SSO账户 */
async function unbindSsoAccount(socialId: CommonType.IdType) {
  startBtnLoading();
  const { error } = await fetchSocialAuthUnbinding(socialId);
  if (!error) {
    window.$message?.success('账户解绑成功');
    await getSsoUserList();
  }
  endBtnLoading();
}

const socialSources: {
  key: Api.System.SocialSource;
  icon?: string;
  localIcon?: string;
  color: string;
  name: string;
}[] = [
  { key: 'wechat_open', icon: 'ic:outline-wechat', color: '#44b549', name: '微信' },
  { key: 'wechat_enterprise', icon: 'tdesign-logo-wecom', color: '#007AFF', name: '企业微信' },
  { key: 'gitee', icon: 'simple-icons:gitee', color: '#c71d23', name: 'Gitee' },
  { key: 'github', icon: 'mdi:github', color: '#010409', name: 'GitHub' }
];

getSsoUserList();

function getSocial(key: string) {
  return socialList.value.find(s => s.source.toLowerCase() === key.toLowerCase());
}
</script>

<template>
  <NSpin :show="loading" class="mt-16px">
    <div class="grid grid-cols-1 gap-16px 2xl:grid-cols-3 xl:grid-cols-2">
      <div v-for="source in socialSources" :key="source.key" class="relative">
        <NCard class="h-full transition-all duration-300 hover:shadow-md" :bordered="true">
          <template v-if="getSocial(source.key)">
            <div class="flex flex-col items-center gap-16px">
              <NAvatar round size="large" :src="getSocial(source.key)?.avatar" class="size-80px" />
              <div class="text-center">
                <div class="text-16px font-medium">
                  {{ getSocial(source.key)?.nickName }}
                </div>
                <div class="mt-4px text-12px text-gray-500">绑定时间：{{ getSocial(source.key)?.createTime }}</div>
              </div>
              <NButton
                type="error"
                size="small"
                :loading="btnLoading"
                @click="unbindSsoAccount(getSocial(source.key)?.id || '')"
              >
                解绑
              </NButton>
            </div>
          </template>
          <template v-else>
            <div class="h-full flex flex-col items-center justify-center gap-16px">
              <SvgIcon
                :local-icon="source.localIcon"
                :icon="source.icon"
                class="size-48px"
                :style="{ color: source.color }"
              />
              <div class="text-16px font-medium">{{ source.name }}</div>
              <NButton type="primary" size="small" @click="bindSsoAccount(source.key)">绑定</NButton>
            </div>
          </template>
        </NCard>
      </div>
    </div>
  </NSpin>
</template>

<style scoped>
.border-primary {
  border-color: var(--primary-color);
}
</style>
