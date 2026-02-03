<script lang="tsx" setup>
import { computed, defineAsyncComponent, h, ref, watch } from 'vue';
import { useThrottleFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useDialog } from 'naive-ui';
import type { TreeOption } from 'naive-ui';
import * as monaco from 'monaco-editor';
import { fetchGetFileList, fetchUpdateFileContent } from '@/service/api/disk/list';
import { useDiskStore } from '@/store/modules/disk';
import { useAuthStore } from '@/store/modules/auth';
import { useSvgIcon } from '@/hooks/common/icon';
import { getServiceBaseURL } from '@/utils/service';
import { formatFileSize, formatTime } from '@/utils/file';

const VditorEditor = defineAsyncComponent(() => import('@/components/preview/vditor-editor.vue'));
const MonacoEditor = defineAsyncComponent(() => import('@/components/preview/monaco-editor.vue'));

defineOptions({
  name: 'TextPreview'
});

interface TabItem {
  path: string;
  title: string;
  fileId: string;
  language: string;
  content: string;
  originalContent: string;
  isModified: boolean;
  hasHistoryVersion?: boolean;
}

interface TabNode extends TreeOption {
  file?: Api.Disk.FileItem;
  fullPath?: string;
}

interface Props {
  shareId?: string;
}

const props = defineProps<Props>();

const dialog = useDialog();
const diskStore = useDiskStore();
const authStore = useAuthStore();
const { SvgIconVNode } = useSvgIcon();
const { textPreviewVisible, textPreviewRow } = storeToRefs(diskStore);

const isFullscreen = ref(false);
const showHistoryDrawer = ref(false);
const markdownMode = ref(false);
const saving = ref(false);
const tabs = ref<TabItem[]>([]);
const activeTab = ref('');
const treeSelectedKeys = ref<Array<string | number>>([]);
const currentContent = ref('');
const cursorLine = ref(1);
const cursorColumn = ref(1);
const lastSaved = ref<Date | null>(null);
const collapsed = ref(false);
const treeData = ref<TabNode[]>([]);
const abortControllerMap = new Map<string, AbortController>();

const visible = computed({
  get: () => textPreviewVisible.value,
  set: val => {
    textPreviewVisible.value = val;
  }
});
const currentFile = computed(() => textPreviewRow.value);
const dialogWidth = computed(() => {
  return isFullscreen.value
    ? '!w-full !h-[100vh] !max-w-full !max-h-full !rounded-0'
    : 'w-[900px] max-w-[95vw] h-[80vh]';
});

const currentTab = computed(() => {
  return tabs.value.find(tab => tab.path === activeTab.value);
});

const isMarkdown = computed(() => {
  return activeTab.value.toLowerCase().endsWith('.md');
});

const isModified = computed(() => {
  return currentTab.value?.isModified ?? false;
});

// 监听 tab 内容变化，更新 isModified 状态
watch(
  () => tabs.value,
  newTabs => {
    newTabs.forEach(tab => {
      // 只有当 content 和 originalContent 都存在时才比较
      if (tab.originalContent !== undefined && tab.content !== undefined) {
        tab.isModified = tab.content !== tab.originalContent;
      }
    });
  },
  { deep: true }
);

const isShare = computed(() => Boolean(props.shareId));
const hasHistoryVersion = computed(() => {
  return currentTab.value?.hasHistoryVersion ?? false;
});

const currentLanguage = computed(() => {
  const suffix = activeTab.value.split('.').pop() || 'txt';
  const languages = monaco.languages.getLanguages();
  const lang = languages.find(l => l.extensions?.includes(`.${suffix}`));
  return lang?.id || 'plaintext';
});

async function saveTab(tab: TabItem) {
  if (!tab.isModified) return;

  try {
    await fetchUpdateFileContent({
      fileId: tab.fileId,
      content: tab.content
    });
    tab.originalContent = tab.content;
    tab.isModified = false;
    window.$message?.success(`文件 ${tab.title} 保存成功`);
  } catch (error) {
    window.$message?.error(`文件 ${tab.title} 保存失败: ${error}`);
    throw error;
  }
}

async function handleSave() {
  const tab = currentTab.value;
  if (!tab || !tab.isModified) {
    return;
  }
  saving.value = true;
  try {
    await saveTab(tab);
  } finally {
    saving.value = false;
  }
}

async function handleClose() {
  const modifiedTabs = tabs.value.filter(tab => tab.isModified);
  if (modifiedTabs.length > 0) {
    return new Promise(resolve => {
      dialog.warning({
        title: '警告',
        content: '检测到未保存的内容，是否在离开前保存修改？',
        positiveText: '保存并关闭',
        negativeText: '放弃修改',
        onPositiveClick: async () => {
          try {
            for (const tab of modifiedTabs) {
              // eslint-disable-next-line no-await-in-loop
              await saveTab(tab);
            }
            textPreviewVisible.value = false;
            resolve(true);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
            resolve(false);
          }
        },
        onNegativeClick: () => {
          textPreviewVisible.value = false;
          resolve(true);
        },
        onClose: () => {
          resolve(false);
        }
      });
    });
  }
  textPreviewVisible.value = false;
  return true;
}

function handleAfterLeave() {
  tabs.value = [];
  activeTab.value = '';
  currentContent.value = '';
}

function toggleMarkdownMode() {
  markdownMode.value = !markdownMode.value;
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

// 判断是否为文本文件
const isTextFile = (file: Api.Disk.FileItem) => {
  const textExtensions = [
    'txt',
    'md',
    'json',
    'xml',
    'yml',
    'yaml',
    'js',
    'ts',
    'vue',
    'jsx',
    'tsx',
    'py',
    'java',
    'go',
    'rs',
    'cpp',
    'c',
    'h',
    'css',
    'scss',
    'less',
    'html',
    'htm',
    'sh',
    'bash',
    'zsh',
    'ps1',
    'sql',
    'dockerfile',
    'nginx'
  ];
  const suffix = file.extendName?.toLowerCase() || '';
  return textExtensions.includes(suffix) || file.contentType?.includes('text');
};

// 获取语言类型
const getLanguageBySuffix = (suffix: string): string => {
  const langMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    vue: 'html',
    jsx: 'javascript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    htm: 'html',
    json: 'json',
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    md: 'markdown',
    txt: 'plaintext'
  };
  return langMap[suffix] || 'plaintext';
};

async function loadFileContent(file: Api.Disk.FileItem, tab: TabItem) {
  // 取消该文件之前的请求
  if (abortControllerMap.has(tab.path)) {
    abortControllerMap.get(tab.path)?.abort();
    abortControllerMap.delete(tab.path);
  }

  const abortController = new AbortController();
  abortControllerMap.set(tab.path, abortController);

  try {
    const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
    const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

    let url = '';
    const params: Record<string, string> = {};

    if (props.shareId) {
      url = `${baseURL}/preview/shared/text/stream`;
      params.shareId = props.shareId;
      params.fileId = file.id;
    } else {
      url = `${baseURL}/preview/text/stream`;
      params.fileId = file.id;
    }

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryString}&t=${new Date().getTime()}`;

    const headers = new Headers();
    if (authStore.token) {
      headers.append('Authorization', `Bearer ${authStore.token}`);
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder('utf-8');

    // 节流更新内容，避免频繁渲染导致卡顿
    const updateContent = useThrottleFn((text: string) => {
      tab.content = text;
      // 可以在这里更新 originalContent 如果需要
    }, 150);

    let result = '';

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        // 确保最后一次更新
        tab.content = result;
        tab.originalContent = result;
        break;
      }
      result += decoder.decode(value, { stream: true });
      updateContent(result);
    }
  } catch (error) {
    window.$message?.error?.(`加载文件失败: ${error}`);
  } finally {
    abortControllerMap.delete(tab.path);
  }
}

async function initFile(file: Api.Disk.FileItem, fullPath?: string) {
  let path = fullPath || file.filePath || `/${file.name}`;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  // 检查是否已打开
  const existingTab = tabs.value.find(tab => tab.path === path);
  if (existingTab) {
    activeTab.value = existingTab.path;
    return;
  }

  // 检查文件大小限制 (例如 2MB)
  if (file.size && file.size > 2 * 1024 * 1024) {
    window.$message?.warning(`文件 ${file.name} 过大，暂不支持预览`);
    return;
  }

  // 调用后端接口，

  // 创建新标签
  const suffix = file.extendName?.toLowerCase() || '';
  const newTab: TabItem = {
    path,
    title: file.name,
    fileId: file.id,
    language: getLanguageBySuffix(suffix),
    content: '',
    originalContent: '',
    isModified: false
  };
  tabs.value.push(newTab);
  activeTab.value = path;

  // 获取响应式对象，确保更新内容时触发视图更新
  const reactiveTab = tabs.value.find(t => t.path === path);
  if (reactiveTab) {
    // 加载文件内容
    await loadFileContent(file, reactiveTab);
  }
}

// 获取文件列表
async function fetchFiles(directory: string): Promise<TabNode[]> {
  const params = {
    userId: authStore.userInfo.userId,
    currentDirectory: encodeURIComponent(directory),
    queryType: 'all' as const,
    page: 1,
    size: 1000
  };
  const { data, error } = await fetchGetFileList(params);
  if (error || !data) return [];

  return data.list
    .filter(f => f.isDir || isTextFile(f))
    .map(f => {
      let fullPath = directory === '/' ? `/${f.name}` : `${directory}/${f.name}`;
      fullPath = fullPath.replace(/\/\//g, '/');
      return {
        key: f.id,
        label: f.name,
        isLeaf: !f.isDir,
        file: f,
        fullPath
      };
    });
}

// 懒加载目录
const handleLoad = async (node: TabNode) => {
  if (!node.fullPath || node.isLeaf) return;
  const children = await fetchFiles(node.fullPath);
  node.children = children;
};

// 初始化树数据
async function initTreeData(file: Api.Disk.FileItem) {
  let path = file.filePath || `/${file.name}`;
  if (!path.startsWith('/')) path = `/${path}`;

  const lastSlashIndex = path.lastIndexOf('/');
  const parentDir = lastSlashIndex <= 0 ? '/' : path.substring(0, lastSlashIndex);

  treeData.value = await fetchFiles(parentDir);

  // 选中当前文件
  treeSelectedKeys.value = [file.id];
}

const getFileIconClass = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    js: 'disk-file_js',
    ts: 'disk-file_js',
    vue: 'disk-file_html',
    html: 'disk-file_html',
    css: 'disk-file_css',
    scss: 'disk-file_css',
    less: 'disk-file_css',
    json: 'disk-file_json',
    md: 'disk-file_md',
    txt: 'disk-file_txt',
    xml: 'disk-file_other',
    yaml: 'disk-file_yaml',
    yml: 'disk-file_yaml',
    sql: 'disk-file_other',
    sh: 'disk-file_other',
    bash: 'disk-file_other',
    zsh: 'disk-file_other',
    py: 'disk-file_python',
    java: 'disk-file_other',
    go: 'disk-file_other',
    rs: 'disk-file_other',
    c: 'disk-file_other',
    cpp: 'disk-file_other',
    dockerfile: 'disk-file_other'
  };
  return iconMap[extension] || 'disk-file_other';
};

const renderTreeIcon = ({ option }: { option: TabNode }) => {
  if (option.file) {
    if (option.file.isDir) {
      const renderIcon = SvgIconVNode({ localIcon: 'disk-file_dir', fontSize: 18 });
      return renderIcon ? renderIcon() : undefined;
    }
    const localIcon = getFileIconClass(option.file.name);
    const renderIcon = SvgIconVNode({ localIcon, fontSize: 18 });
    return renderIcon ? renderIcon() : undefined;
  }
  return <icon-mdi-file-outline class="text-lg" />;
};

const closeTabLogic = (path: string) => {
  const index = tabs.value.findIndex(t => t.path === path);
  if (index > -1) {
    tabs.value.splice(index, 1);
    if (activeTab.value === path) {
      activeTab.value = tabs.value[Math.max(0, index - 1)]?.path || '';
    }
  }
};

const handleCloseTab = (path: string) => {
  const tab = tabs.value.find(t => t.path === path);
  if (!tab) return;

  if (tab.isModified) {
    dialog.warning({
      title: '警告',
      content: `文件 "${tab.title}" 有未保存的修改，是否保存？`,
      positiveText: '保存',
      negativeText: '放弃修改',
      onPositiveClick: async () => {
        try {
          await saveTab(tab);
          closeTabLogic(path);
        } finally {
          //
        }
      },
      onNegativeClick: () => {
        closeTabLogic(path);
      }
    });
    return;
  }

  closeTabLogic(path);
};

const renderTreeLabel = ({ option }: { option: TabNode }) => {
  return h('span', { class: 'text-sm' }, option.label);
};

// 树节点选择
const handleTreeSelect = (keys: Array<string | number>, options: Array<TabNode | null>) => {
  treeSelectedKeys.value = keys;
  const node = options[0];
  if (node?.file && !node.file.isDir) {
    initFile(node.file, node.fullPath);
  }
};

// 监听 activeTab 变化，同步树节点选中状态
watch(activeTab, newPath => {
  const tab = tabs.value.find(t => t.path === newPath);
  if (tab) {
    treeSelectedKeys.value = [tab.fileId];
  } else {
    treeSelectedKeys.value = [];
  }
});

// 切换标签
function handleTabChange(path: string) {
  const tab = tabs.value.find(t => t.path === path);
  if (tab) {
    currentContent.value = tab.content;
    markdownMode.value = path.toLowerCase().endsWith('.md');
  }
}

// 监听当前文件变化
watch(currentFile, file => {
  if (file && visible.value) {
    initFile(file);
    initTreeData(file);
  }
});

// 监听显示状态
watch(visible, show => {
  if (show && currentFile.value) {
    initFile(currentFile.value);
    initTreeData(currentFile.value);
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    :title="currentFile?.name"
    :closable="true"
    preset="card"
    :mask-closable="false"
    class="text-preview-modal"
    :class="dialogWidth"
    :on-close="handleClose"
    @after-leave="handleAfterLeave"
  >
    <!-- 头部工具栏 -->
    <template #header-extra>
      <div class="w-full flex items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- <span class="font-medium">{{ currentFile?.name }}</span> -->
          <NTag v-if="isModified" type="warning" size="small" class="mr-2">已修改</NTag>
        </div>
        <div class="flex items-center gap-2">
          <!-- 历史版本按钮 -->
          <NButton v-if="!isShare && hasHistoryVersion" size="small" @click="showHistoryDrawer = true">
            历史版本
          </NButton>
          <!-- 保存按钮 -->
          <NButton v-if="isModified" type="primary" size="small" :loading="saving" @click="handleSave">保存</NButton>
          <!-- Markdown 预览切换 -->
          <NButton v-if="isMarkdown" quaternary size="small" @click="toggleMarkdownMode">
            <template #icon>
              <icon-ic-baseline-remove-red-eye v-if="!markdownMode" />
              <icon-mdi-invoice-text-edit-outline v-else />
            </template>
          </NButton>
          <!-- 全屏 -->
          <NButton quaternary size="small" @click="toggleFullscreen">
            <template #icon>
              <icon-gridicons-fullscreen-exit v-if="isFullscreen" />
              <icon-gridicons-fullscreen v-else />
            </template>
          </NButton>
        </div>
      </div>
    </template>
    <!-- 内容区域 -->
    <NLayout has-sider class="h-full">
      <NLayoutSider
        v-if="!isShare"
        v-model:collapsed="collapsed"
        collapse-mode="transform"
        :collapsed-width="0"
        :width="240"
        show-trigger="bar"
        bordered
        resizable
        :native-scrollbar="false"
        class="h-full min-h-500px"
      >
        <NTree
          v-model:selected-keys="treeSelectedKeys"
          :data="treeData"
          block-line
          expand-on-click
          selectable
          :on-load="handleLoad"
          :render-label="renderTreeLabel"
          :render-prefix="renderTreeIcon"
          @update:selected-keys="handleTreeSelect"
        />
      </NLayoutSider>
      <NLayoutContent class="h-full flex flex-col bg-white dark:bg-[#18181c]">
        <div v-if="currentTab" class="h-full flex flex-col">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <NTabs
              v-model:value="activeTab"
              type="card"
              closable
              class="flex-none"
              @close="handleCloseTab"
              @update:value="handleTabChange"
            >
              <NTabPane
                v-for="tabItem in tabs"
                :key="tabItem.path"
                :name="tabItem.path"
                :tab="tabItem.title"
                :closable="tabs.length > 0"
              >
                <template #tab>
                  <div class="flex items-center gap-1">
                    <span>{{ tabItem.title }}</span>
                    <NBadge v-if="tabItem.isModified" dot type="warning" />
                  </div>
                </template>
              </NTabPane>
            </NTabs>
          </div>
          <!-- 这里放置内容预览组件，暂时留空或根据逻辑补充 -->
          <div
            class="relative min-h-0 flex-1 overflow-auto p-4"
            :class="{ '!p-0 !overflow-hidden': isMarkdown && markdownMode }"
          >
            <VditorEditor
              v-if="isMarkdown && markdownMode"
              v-model="currentTab.content"
              class="absolute inset-0 size-full"
            />
            <MonacoEditor v-else v-model="currentTab.content" :language="currentTab.language" class="h-full" />
          </div>
        </div>
        <div v-else class="h-full flex items-center justify-center text-gray-400">
          <div class="flex flex-col items-center gap-2">
            <div class="i-mdi-file-document-outline text-6xl opacity-50"></div>
            <span>请选择文件查看</span>
          </div>
        </div>
      </NLayoutContent>
    </NLayout>
    <!-- 底部状态栏 -->
    <template #footer>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-4">
          <span>{{ currentLanguage }}</span>
          <span>行 {{ cursorLine }}, 列 {{ cursorColumn }}</span>
          <span>{{ currentFile?.size ? formatFileSize(currentFile.size) : '' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="lastSaved">上次保存: {{ formatTime(lastSaved) }}</span>
        </div>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.text-preview-modal {
  display: flex;
  flex-direction: column;
}

.text-preview-modal .n-card__content {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.text-preview-modal .n-tabs-nav {
  padding: 0 12px;
}
</style>
