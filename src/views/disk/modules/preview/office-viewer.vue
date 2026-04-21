<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { request } from '@/service/request';

defineOptions({ name: 'OfficeViewer' });

interface Props {
  file: Api.Disk.PreviewFileInfo;
}

const props = defineProps<Props>();

const loading = ref(true);
const errorMsg = ref('');
const editorReady = ref(false);

onMounted(async () => {
  const docServerUrl = import.meta.env.VITE_OFFICE_URL || 'http://localhost:8080';

  try {
    // Fetch OnlyOffice config from backend
    const { data } = await request<any>({
      url: '/disk/office/config',
      method: 'get',
      params: {
        fileId: props.file.fileId,
        fileName: props.file.fileName,
        mode: 'view'
      }
    });

    if (!data) {
      errorMsg.value = '获取Office配置失败';
      loading.value = false;
      return;
    }

    // Load OnlyOffice API script dynamically
    const script = document.createElement('script');
    script.src = `${docServerUrl}/web-apps/apps/api/documents/api.js`;
    script.async = true;

    script.addEventListener('load', () => {
      const DocsAPI = (window as any).DocsAPI;
      if (DocsAPI && editorReady.value) {
        const docEditor = new DocsAPI.DocEditor('office-editor-placeholder', data);
        void docEditor;
      }
      loading.value = false;
    });

    script.addEventListener('error', () => {
      errorMsg.value = 'OnlyOffice 服务不可用，请确认服务已启动';
      loading.value = false;
    });

    editorReady.value = true;
    document.head.appendChild(script);
  } catch {
    errorMsg.value = 'OnlyOffice 服务不可用，请确认服务已启动';
    loading.value = false;
  }
});
</script>

<template>
  <div class="office-viewer-container">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <NSpin size="large" />
    </div>
    <div v-else-if="errorMsg" class="flex items-center justify-center h-full text-red-400">
      {{ errorMsg }}
    </div>
    <div v-else id="office-editor-placeholder" class="office-editor" />
  </div>
</template>

<style scoped>
.office-viewer-container {
  width: 100%;
  height: 100%;
}

.office-editor {
  width: 100%;
  height: 100%;
}
</style>
