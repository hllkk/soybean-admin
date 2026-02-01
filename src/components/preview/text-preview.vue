<script lang="tsx" setup>
import { computed, h, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { TreeOption } from 'naive-ui';
import * as monaco from 'monaco-editor';
import { useDiskStore } from '@/store/modules/disk';
import { useAuthStore } from '@/store/modules/auth';
import { useSvgIcon } from '@/hooks/common/icon';
import { formatFileSize, formatTime } from '@/utils/file';
import VditorEditor from '@/components/preview/vditor-editor.vue';
import MonacoEditor from '@/components/preview/monaco-editor.vue';

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
}

interface Props {
  shareId?: string;
}

const props = defineProps<Props>();

const diskStore = useDiskStore();
const authStore = useAuthStore();
const { SvgIconVNode } = useSvgIcon();
const { fileList, textPreviewVisible, textPreviewRow } = storeToRefs(diskStore);
const { token } = storeToRefs(authStore);

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
const collapsed = ref(true);

const visible = computed({
  get: () => textPreviewVisible.value,
  set: val => {
    textPreviewVisible.value = val;
  }
});
const currentFile = computed(() => textPreviewRow.value);
const dialogWidth = computed(() => {
  return isFullscreen.value ? `w-${window.innerWidth - 40}px` : 'w-[900px}';
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

function handleClose() {
  textPreviewVisible.value = false;
}

function handleAfterLeave() {
  tabs.value = [];
  activeTab.value = '';
  currentContent.value = '';
}

async function handleSave() {
  const tab = currentTab.value;
  if (!tab || !tab.isModified) {
    return;
  }
  saving.value = true;
  // try {
  //   await diskStore.saveFile({
  //     fileId: tab.fileId,
  //     content: tab.content
  //   });
  //   tab.isModified = false;
  //   saving.value = false;
  // } catch (error) {
  //   saving.value = false;
  // }
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

// 检查历史版本
// const checkHistoryVersion = async (fileId: string, tab: TabItem) => {
//   try {
//     const response = await fetch(`/api/file-history/list?fileId=${fileId}`, {
//       headers: {
//         Authorization: `Bearer ${token.value}`
//       }
//     });
//     const data = await response.json();
//     tab.hasHistoryVersion = data.count > 0;
//   } catch (error) {
//     console.error('检查历史版本失败:', error);
//   }
// };

async function loadFileContent(file: Api.Disk.FileItem, tab: TabItem) {
  try {
    const headers = new Headers();
    headers.append('token', token.value);

    // let metaUrl = '';
    let contentUrl = '';
    const baseUrl = import.meta.env.VITE_APP_BASE_API;

    // 1. 构建请求参数
    if (props.shareId) {
      // 共享文件
      // metaUrl = `${baseUrl}/preview/text?fileId=${file.id}&shareId=${props.shareId}`;
      contentUrl = `${baseUrl}/preview/text/content?fileId=${file.id}&shareId=${props.shareId}`;
    } else if (file.id) {
      // 普通文件
      // metaUrl = `${baseUrl}/preview/text?fileId=${file.id}`;
      contentUrl = `${baseUrl}/preview/text/content?fileId=${file.id}`;
    } else {
      // 通过路径获取
      const path = file.filePath || '';
      // metaUrl = `${baseUrl}/preview/text?path=${encodeURIComponent(path)}`;
      contentUrl = `${baseUrl}/preview/text/content?path=${encodeURIComponent(path)}`;
    }

    // 2. 获取元数据 (模拟)
    // 注意：实际后端可能不需要这一步，或者元数据在 content 响应头中
    // 按照用户需求，先请求元数据
    // const metaRes = await fetch(metaUrl, { headers });
    // if (metaRes.ok) {
    //   const meta = await metaRes.json();
    //   // 更新 tab 信息...
    // }

    // 3. 流式读取内容
    const response = await fetch(contentUrl, { headers });
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder('utf-8');
    tab.content = ''; // 清空内容

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      tab.content += chunk;

      // 实时更新当前显示内容
      if (activeTab.value === tab.path) {
        currentContent.value = tab.content;
      }
    }

    tab.originalContent = tab.content;
  } catch (error) {
    window.$message?.error(`加载文件${file.name}失败: ${error}`);
  }
}

async function initFile(file: Api.Disk.FileItem) {
  const path = file.filePath || `/${file.name}`;
  // 检查是否已打开
  const existingTab = tabs.value.find(tab => tab.path === path);
  if (existingTab) {
    activeTab.value = existingTab.path;
    return;
  }

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

  // 加载文件内容
  await loadFileContent(file, newTab);
}

// 目录树数据
const directoryTree = computed<TabNode[]>(() => {
  // 从 fileList 构建目录树
  const buildTree = (files: Api.Disk.FileItem[]): TabNode[] => {
    return files
      .filter(f => !f.isDir && isTextFile(f))
      .map(f => ({
        key: f.id,
        label: f.name,
        isLeaf: true,
        file: f
      }));
  };

  return buildTree(fileList.value);
});

const getFileIconClass = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    js: 'mdi-language-javascript #F7DF1E',
    ts: 'mdi-language-typescript #3178C6',
    vue: 'mdi-vuejs #4FC08D',
    html: 'mdi-language-html5 #E34F26',
    css: 'mdi-language-css3 #1572B6',
    scss: 'mdi-sass #CC6699',
    less: 'mdi-sass #1D365D',
    json: 'mdi-code-json',
    md: 'mdi-language-markdown',
    txt: 'mdi-file-document-outline',
    xml: 'mdi-xml #F29D00',
    yaml: 'mdi-code-json #CB171E',
    yml: 'mdi-code-json #CB171E',
    sql: 'mdi-database #CC0000',
    sh: 'mdi-bash #4EAA25',
    bash: 'mdi-bash #4EAA25',
    zsh: 'mdi-bash #4EAA25',
    py: 'mdi-language-python #3776AB',
    java: 'mdi-language-java #007396',
    go: 'mdi-language-go #00ADD8',
    rs: 'mdi-language-rust',
    c: 'mdi-language-c #A8B9CC',
    cpp: 'mdi-language-cpp #00599C',
    dockerfile: 'mdi-docker #2496ED'
  };
  return iconMap[extension] || 'mdi-file-outline #808080';
};

const renderTreeIcon = ({ option }: { option: TabNode }) => {
  if (option.file) {
    const iconClass = getFileIconClass(option.file.name);
    const [iconType, iconStyle] = iconClass.split(' ');
    const renderIcon = SvgIconVNode({ icon: iconType, fontSize: 18, color: iconStyle });
    return renderIcon ? renderIcon() : undefined;
  }
  return <icon-mdi-file-outline class="text-lg" />;
};

const handleCloseTab = (path: string) => {
  const index = tabs.value.findIndex(t => t.path === path);
  if (index > -1) {
    tabs.value.splice(index, 1);
    if (activeTab.value === path) {
      activeTab.value = tabs.value[Math.max(0, index - 1)]?.path || '';
    }
  }
};

const renderTreeLabel = ({ option }: { option: TabNode }) => {
  return h('span', { class: 'text-sm' }, option.label);
};

// 树节点选择
const handleTreeSelect = (keys: Array<string | number>, options: Array<TabNode | null>) => {
  treeSelectedKeys.value = keys;
  const node = options[0];
  if (node?.file) {
    initFile(node.file);
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
  }
});

// 监听显示状态
watch(visible, show => {
  if (show && currentFile.value) {
    initFile(currentFile.value);
  }
});
// onMounted(() => {
//   document.addEventListener('keydown', handleKeyDown);
// });

// onUnmounted(() => {
//   document.removeEventListener('keydown', handleKeyDown);
// });
</script>

<template>
  <NModal
    v-model:show="visible"
    :title="currentFile?.name"
    :closable="true"
    preset="card"
    :mask-closable="false"
    class="text-preview-modal max-w-[95vh]"
    :class="dialogWidth"
    @close="handleClose"
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
          <NButton v-if="isMarkdown" size="small" circle @click="toggleMarkdownMode">
            <template #icon>
              <icon-ic-baseline-remove-red-eye v-if="!markdownMode" />
              <icon-mdi-invoice-text-edit-outline v-else />
            </template>
          </NButton>
          <!-- 全屏 -->
          <NButton size="small" circle @click="toggleFullscreen">
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
          :data="directoryTree"
          block-line
          expand-on-click
          selectable
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
          <div class="flex-1 overflow-auto p-4" :class="{ '!p-0 !overflow-hidden': isMarkdown && markdownMode }">
            <VditorEditor v-if="isMarkdown && markdownMode" v-model="currentTab.content" class="h-full" />
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

<style scoped>
.text-preview-modal :deep(.n-card__content) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
}

.text-preview-modal :deep(.n-tabs-nav) {
  padding: 0 12px;
}
</style>
