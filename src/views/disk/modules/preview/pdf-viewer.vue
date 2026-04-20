<script setup lang="ts">
import { ref } from 'vue';
import { PDFViewer } from '@embedpdf/vue-pdf-viewer';

defineOptions({ name: 'PdfViewer' });

interface Props {
  url: string;
  fileName: string;
}

const props = defineProps<Props>();

const isLoading = ref(true);
const loadError = ref<string | null>(null);

const handleInit = () => {
  isLoading.value = false;
};

const handleReady = () => {
  isLoading.value = false;
};

const handleError = (error: unknown) => {
  isLoading.value = false;
  loadError.value = error instanceof Error ? error.message : 'Failed to load PDF';
};
</script>

<template>
  <div class="pdf-viewer-container">
    <div v-if="isLoading" class="pdf-viewer-loading">
      <NSpin :size="40" />
    </div>
    <div v-else-if="loadError" class="pdf-viewer-error">
      <NResult status="error" :title="loadError" size="small">
        <template #footer>
          <NButton size="small" @click="isLoading = true; loadError = null">
            Retry
          </NButton>
        </template>
      </NResult>
    </div>
    <PDFViewer
      v-else
      :config="{
        src: url,
        theme: {
          preference: 'system'
        }
      }"
      @init="handleInit"
      @ready="handleReady"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
.pdf-viewer-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-viewer-loading,
.pdf-viewer-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-viewer-error {
  padding: 24px;
}
</style>
