<script lang="ts" setup>
import { toRefs } from 'vue';

defineOptions({
  name: 'VideoTranscodeSettings'
});

const props = defineProps<{
  model: Api.System.VideoTranscodeSettings;
}>();

const { model } = toRefs(props);

const presetOptions = [
  { label: 'Ultrafast', value: 'ultrafast' },
  { label: 'Superfast', value: 'superfast' },
  { label: 'Veryfast', value: 'veryfast' },
  { label: 'Faster', value: 'faster' },
  { label: 'Fast', value: 'fast' },
  { label: 'Medium', value: 'medium' },
  { label: 'Slow', value: 'slow' },
  { label: 'Slower', value: 'slower' },
  { label: 'Veryslow', value: 'veryslow' }
];
</script>

<template>
  <NForm :model="model" label-placement="left" :label-width="120" label-align="right">
    <div class="mb-6 flex flex-col space-y-2">
      <div class="flex-1 flex-row">
        <span class="mr-2 text-base">开启视频转码</span>
        <NSwitch v-model:value="model.enable">
          <template #checked>{{ $t('common.enable') }}</template>
          <template #unchecked>{{ $t('common.disable') }}</template>
        </NSwitch>
      </div>
      <NText depth="3" class="text-sm">开启后上传的视频将自动转码为 H.264/AAC 格式以便在线播放</NText>
    </div>

    <template v-if="model.enable">
      <NFormItem label="FFmpeg 路径" path="ffmpegPath">
        <div class="w-320px flex flex-col space-y-2">
          <NInput v-model:value="model.ffmpegPath" placeholder="/usr/bin/ffmpeg" />
          <NText depth="3" class="text-sm">系统 FFmpeg 可执行文件的绝对路径</NText>
        </div>
      </NFormItem>

      <NFormItem label="转码线程数" path="threads">
        <div class="w-240px flex flex-col space-y-2">
          <NInputNumber v-model:value="model.threads" :min="1" :max="32" />
          <NText depth="3" class="text-sm">并行转码使用的 CPU 线程数</NText>
        </div>
      </NFormItem>

      <NFormItem label="预设 (Preset)" path="preset">
        <div class="w-240px flex flex-col space-y-2">
          <NSelect v-model:value="model.preset" :options="presetOptions" />
          <NText depth="3" class="text-sm">编码速度与压缩率的平衡，速度越快文件越大</NText>
        </div>
      </NFormItem>
    </template>
  </NForm>
</template>
