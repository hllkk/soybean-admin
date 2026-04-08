<script setup lang="ts">
import type { DiskSettingConfig } from '../types';

defineOptions({
  name: 'DiskSetting'
});

const configModel = defineModel<DiskSettingConfig>('config', { required: true });

const transcodePresetOptions = [
  { label: 'ultrafast', value: 'ultrafast' },
  { label: 'superfast', value: 'superfast' },
  { label: 'veryfast', value: 'veryfast' },
  { label: 'faster', value: 'faster' },
  { label: 'fast', value: 'fast' },
  { label: 'medium', value: 'medium' },
  { label: 'slow', value: 'slow' },
  { label: 'slower', value: 'slower' },
  { label: 'veryslow', value: 'veryslow' }
];
</script>

<template>
  <div class="disk-setting">
    <NTabs type="line">
      <NTabPane name="basic" tab="基础配置">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="最大上传大小" path="maxUploadSize">
            <NInputNumber v-model:value="configModel.maxUploadSize" :min="1" class="max-w-200px">
              <template #suffix>MB</template>
            </NInputNumber>
          </NFormItem>
          <NFormItem label="允许的文件类型" path="allowedFileTypes">
            <NInput v-model:value="configModel.allowedFileTypes" placeholder="请输入允许的文件类型，多个用逗号分隔" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="存储配额" path="storageQuota">
            <NInputNumber v-model:value="configModel.storageQuota" :min="1" class="max-w-200px">
              <template #suffix>GB</template>
            </NInputNumber>
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="personal" tab="个性化配置">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="网盘名称" path="diskName">
            <NInput v-model:value="configModel.diskName" placeholder="请输入网盘名称" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="网盘Logo" path="diskLogo">
            <NInput v-model:value="configModel.diskLogo" placeholder="请输入网盘Logo地址" class="max-w-400px" />
          </NFormItem>
          <NDivider />
          <div class="section-title">分享链接配置</div>
          <NFormItem label="分享需要密码" path="shareLinkPasswordRequired">
            <NSwitch v-model:value="configModel.shareLinkPasswordRequired" />
          </NFormItem>
          <NFormItem label="分享密码最小长度" path="shareLinkPasswordMinLength">
            <NInputNumber v-model:value="configModel.shareLinkPasswordMinLength" :min="4" :max="32" class="max-w-200px" />
          </NFormItem>
          <NDivider />
          <div class="section-title">上传链接配置</div>
          <NFormItem label="上传需要密码" path="uploadLinkPasswordRequired">
            <NSwitch v-model:value="configModel.uploadLinkPasswordRequired" />
          </NFormItem>
          <NFormItem label="上传密码最小长度" path="uploadLinkPasswordMinLength">
            <NInputNumber v-model:value="configModel.uploadLinkPasswordMinLength" :min="4" :max="32" class="max-w-200px" />
          </NFormItem>
          <NDivider />
          <NFormItem label="启用同步" path="syncEnabled">
            <NSwitch v-model:value="configModel.syncEnabled" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="onlyoffice" tab="OnlyOffice">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="启用OnlyOffice" path="onlyOfficeEnabled">
            <NSwitch v-model:value="configModel.onlyOfficeEnabled" />
          </NFormItem>
          <NFormItem label="OnlyOffice地址" path="onlyOfficeUrl">
            <NInput v-model:value="configModel.onlyOfficeUrl" placeholder="请输入OnlyOffice服务地址" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="Secret密钥" path="onlyOfficeSecret">
            <NInput v-model:value="configModel.onlyOfficeSecret" type="password" placeholder="请输入Secret密钥" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="回调地址" path="onlyOfficeCallbackUrl">
            <NInput v-model:value="configModel.onlyOfficeCallbackUrl" placeholder="请输入回调地址" class="max-w-400px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="video" tab="视频转码">
        <NForm :model="configModel" label-placement="left" :label-width="120" class="mt-16px">
          <NFormItem label="启用视频转码" path="videoTranscodeEnabled">
            <NSwitch v-model:value="configModel.videoTranscodeEnabled" />
          </NFormItem>
          <NFormItem label="FFmpeg路径" path="ffmpegPath">
            <NInput v-model:value="configModel.ffmpegPath" placeholder="请输入FFmpeg可执行文件路径" class="max-w-400px" />
          </NFormItem>
          <NFormItem label="转码线程数" path="transcodeThreads">
            <NInputNumber v-model:value="configModel.transcodeThreads" :min="1" :max="64" class="max-w-200px" />
          </NFormItem>
          <NFormItem label="转码预设" path="transcodePreset">
            <NSelect v-model:value="configModel.transcodePreset" :options="transcodePresetOptions" placeholder="请选择转码预设" class="max-w-200px" />
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.disk-setting {
  padding: 0;
}

.section-title {
  font-weight: 500;
  color: #333;
  font-size: 15px;
  margin-bottom: 16px;
}
</style>