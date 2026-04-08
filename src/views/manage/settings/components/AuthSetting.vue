<script setup lang="ts">
import type { AuthSettingConfig } from '../types';

defineOptions({
  name: 'AuthSetting'
});

const configModel = defineModel<AuthSettingConfig>('config', { required: true });
</script>

<template>
  <div class="auth-setting">
    <NTabs type="line" animated>
      <NTabPane name="wework" tab="企业微信">
        <div class="tab-content">
          <NCollapse class="mb-16px">
            <NCollapseItem title="⚠️ 可信域名校验" name="domain">
              <div class="warning-box">
                <div class="warning-message">1. 用于企业微信自建应用"网页授权及JS-SDK"中可信域名校验。</div>
                <div class="warning-message">2. 配置可信域名的文件名及文件内容信息，只需在创建企业微信认证服务器时填写，验证完毕后，无需再次填写。</div>
                <div class="warning-message">3. 集群场景下，请在主节点配置可信域名。</div>
              </div>
              <NForm :model="configModel" label-placement="left" :label-width="100" class="mt-16px">
                <NFormItem label="文件名" path="weworkDomainFileName">
                  <NInput v-model:value="configModel.weworkDomainFileName" placeholder="请输入可信域名文件名" class="max-w-400px" />
                </NFormItem>
                <NFormItem label="文件内容" path="weworkDomainFileContent">
                  <NInput v-model:value="configModel.weworkDomainFileContent" placeholder="请输入可信域名文件内容" class="max-w-400px" />
                </NFormItem>
              </NForm>
            </NCollapseItem>
          </NCollapse>

          <NForm :model="configModel" label-placement="left" :label-width="120">
            <NFormItem label="启用企业微信" path="weworkEnabled">
              <NSwitch v-model:value="configModel.weworkEnabled" />
            </NFormItem>
          </NForm>

          <NAlert type="info" title="提示">
            企业微信认证需要在后端配置 Corp ID、Agent ID 和 Secret 等信息。
          </NAlert>
        </div>
      </NTabPane>

      <NTabPane name="wechat" tab="微信">
        <div class="tab-content">
          <NForm :model="configModel" label-placement="left" :label-width="120">
            <NFormItem label="启用微信" path="wechatEnabled">
              <NSwitch v-model:value="configModel.wechatEnabled" />
            </NFormItem>
          </NForm>

          <NAlert type="info" title="提示">
            微信认证需要在后端配置 App ID 和 App Secret 等信息。
          </NAlert>
        </div>
      </NTabPane>

      <NTabPane name="gitee" tab="Gitee">
        <div class="tab-content">
          <NForm :model="configModel" label-placement="left" :label-width="120">
            <NFormItem label="启用 Gitee" path="giteeEnabled">
              <NSwitch v-model:value="configModel.giteeEnabled" />
            </NFormItem>
          </NForm>

          <NAlert type="info" title="提示">
            Gitee 认证需要在后端配置 Client ID 和 Client Secret 等信息。
          </NAlert>
        </div>
      </NTabPane>

      <NTabPane name="github" tab="GitHub">
        <div class="tab-content">
          <NForm :model="configModel" label-placement="left" :label-width="120">
            <NFormItem label="启用 GitHub" path="githubEnabled">
              <NSwitch v-model:value="configModel.githubEnabled" />
            </NFormItem>
          </NForm>

          <NAlert type="info" title="提示">
            GitHub 认证需要在后端配置 Client ID 和 Client Secret 等信息。
          </NAlert>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.auth-setting {
  width: 100%;
}

.tab-content {
  padding: 16px 0;
}

.warning-box {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  padding: 12px 16px;
}

.warning-message {
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}
</style>