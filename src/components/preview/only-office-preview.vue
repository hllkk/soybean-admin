<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';
import type { IConfig } from '@onlyoffice/document-editor-vue';
import { DocumentEditor } from '@onlyoffice/document-editor-vue';

// https://api.onlyoffice.com/zh-CN/docs/docs-api/usage-api/advanced-parameters/
defineOptions({
  name: 'OnlyOfficePreview'
});

interface Props {
  fileUrl: string;
  file: Api.Disk.FileItem;
}

const props = defineProps<Props>();

const fileType = computed(() => props.file?.extendName || 'docx');

const documentType = computed(() => {
  const type = fileType.value.toLowerCase();
  if (['xls', 'xlsx', 'csv', 'ods'].includes(type)) return 'cell';
  if (['ppt', 'pptx', 'odp'].includes(type)) return 'slide';
  return 'word';
});

const config = computed<IConfig>(() => ({
  document: {
    fileType: fileType.value,
    key: props.file?.id,
    title: props.file?.name || '测试文档',
    url: props.fileUrl
  },
  documentType: documentType.value,
  editorConfig: {
    callbackUrl: 'http://127.0.0.1:8081/', // 替换为您的回调 URL（这是保存功能正常工作所必需的）
    lang: 'zh-CN'
  }
}));

function onDocumentReady() {
  window.$message?.success('文档加载完成');
}

function onLoadComponentError(errorCode: number, errorDescription: string) {
  switch (errorCode) {
    case -2:
      window.$message?.error(`加载文件服务器错误: ${errorCode}, ${errorDescription}`);
      break;
    case -3:
      window.$message?.error(`文档服务器API错误: ${errorCode}, ${errorDescription}`);
      break;
    default:
      window.$message?.error(`未知错误: ${errorCode}, ${errorDescription}`);
      break;
  }
}

watch(
  () => props.file?.id,
  () => {
    console.log(props.file);
  }
);

onMounted(() => {
  console.log(config.value);
});
</script>

<template>
  <div class="size-full">
    <DocumentEditor
      id="docEditor"
      document-server-url="http://172.21.10.30:8081/"
      :config="config"
      :events-on-document-ready="onDocumentReady"
      :on-load-component-error="onLoadComponentError"
    />
  </div>
</template>
