<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { PDFViewer } from '@embedpdf/vue-pdf-viewer';
import type { PluginRegistry } from '@embedpdf/vue-pdf-viewer';
import { useThemeStore } from '@/store/modules/theme';
import { useAppStore } from '@/store/modules/app';
import { storeToRefs } from 'pinia';
import { getPreviewUrl } from '@/service/api/disk/file';
import type { DocumentManagerCapability, I18nCapability } from '@embedpdf/snippet';

defineOptions({
  name: 'PdfPreview'
});

interface Props {
  fileId?: CommonType.IdType;
}

const props = withDefaults(defineProps<Props>(), {
  fileId: undefined
});

interface Emits {
  (e: 'ready'): void;
  (e: 'close'): void;
}

const emit = defineEmits<Emits>();

const themeStore = useThemeStore();
const appStore = useAppStore();
const { darkMode } = storeToRefs(themeStore);
const { locale } = storeToRefs(appStore);

const viewerReady = ref(false);
let unsubscribe: (() => void) | null = null;
let i18nCap: I18nCapability | null = null;

const pdfUrl = computed(() => {
  if (!props.fileId) return '';
  return getPreviewUrl(props.fileId);
});

const embedLocale = computed(() => (locale.value === 'zh-CN' ? 'zh-CN' : 'en'));

const themePreference = computed(() => (darkMode.value ? 'dark' as const : 'light' as const));

const viewerConfig = computed(() => ({
  src: pdfUrl.value,
  theme: { preference: themePreference.value }
}));

function handleReady(registry: PluginRegistry) {
  setupCloseListener(registry);
  setupLocale(registry);
  viewerReady.value = true;
  emit('ready');
}

function setupCloseListener(registry: PluginRegistry) {
  cleanupSubscription();
  const docPlugin = registry.getPlugin('document-manager');
  if (!docPlugin) return;

  const cap = (docPlugin as any).provides() as DocumentManagerCapability;
  if (!cap?.onDocumentClosed) return;

  unsubscribe = cap.onDocumentClosed(() => {
    emit('close');
  });
}

function setupLocale(registry: PluginRegistry) {
  const plugin = registry.getPlugin('i18n');
  if (!plugin) return;

  i18nCap = (plugin as any).provides() as I18nCapability;
  if (i18nCap?.setLocale) {
    i18nCap.setLocale(embedLocale.value);
  }
}

function cleanupSubscription() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

watch(embedLocale, (newLocale) => {
  if (i18nCap?.setLocale) {
    i18nCap.setLocale(newLocale);
  }
});

watch(
  () => props.fileId,
  (newId) => {
    if (!newId) return;
    viewerReady.value = false;
    cleanupSubscription();
    i18nCap = null;
  }
);

onUnmounted(() => {
  viewerReady.value = false;
  cleanupSubscription();
  i18nCap = null;
});
</script>

<template>
  <div class="pdf-preview-container relative w-full h-full">
    <!-- Loading state -->
    <div
      v-if="!viewerReady"
      class="absolute inset-0 flex-center z-10"
    >
      <NSpin size="large">
        <template #description>
          <span class="text-gray-300">正在加载PDF文档...</span>
        </template>
      </NSpin>
    </div>

    <!-- PDF Viewer -->
    <PDFViewer
      v-if="pdfUrl"
      :key="pdfUrl"
      :config="viewerConfig"
      class="w-full h-full"
      @ready="handleReady"
    />
  </div>
</template>

<style scoped lang="scss">
.pdf-preview-container {
  min-height: 400px;
  background-color: var(--n-color, #1a1a2e);
}
</style>
