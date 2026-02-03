<script lang="ts" setup>
import type { IConfig } from '@onlyoffice/document-editor-vue';
import { DocumentEditor } from '@onlyoffice/document-editor-vue';

// https://api.onlyoffice.com/zh-CN/docs/docs-api/usage-api/advanced-parameters/
defineOptions({
  name: 'OnlyOfficePreview'
});

const config: IConfig = {
  document: {
    fileType: 'docx',
    key: '123',
    title: '测试文档',
    url: 'https://static.onlyoffice.com/assets/docs/samples/demo.docx'
  },
  documentType: 'word',
  editorConfig: {
    callbackUrl: 'http://127.0.0.1:8081/', // 替换为您的回调 URL（这是保存功能正常工作所必需的）
    lang: 'zh-CN'
  }
};

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
