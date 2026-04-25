<script lang="tsx" setup>
import { computed, defineAsyncComponent, h, ref, shallowRef, watch } from 'vue';
import { useThrottleFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useDialog } from 'naive-ui';
import type { TreeOption } from 'naive-ui';
import * as monaco from 'monaco-editor';
import {
  fetchCreateFile
} from '@/service/api/disk/file';
import { request } from '@/service/request';
import {
  fetchHistoryList,
  fetchHistoryContent,
  fetchRestoreHistory,
  fetchDeleteHistory,
  fetchSaveWithHistory
} from '@/service/api/disk/editor';
import { useDiskStore } from '@/store/modules/disk';
import { useAuthStore } from '@/store/modules/auth';
import { useSvgIcon } from '@/hooks/common/icon';
import { getServiceBaseURL } from '@/utils/service';
import { formatFileSize } from '@/utils/format';
import type { Editor } from '@/types/editor';

const VditorEditor = defineAsyncComponent(() => import('@/components/preview/vditor-editor.vue'));
const MonacoEditor = defineAsyncComponent(() => import('@/components/preview/monaco-editor.vue'));

defineOptions({
  name: 'TextPreview'
});

interface TabItem {
  path: string;
  title: string;
  fileId: CommonType.IdType;
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

interface HistoryVersion {
  id: CommonType.IdType;
  createTime: string;
  size: number;
}

// 辅助函数：递归更新树节点的 children
function updateTreeNodeChildren(nodes: TabNode[], key: string | number, children: TabNode[]): TabNode[] {
  return nodes.map(node => {
    if (node.key === key) {
      return { ...node, children };
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateTreeNodeChildren(node.children as TabNode[], key, children) };
    }
    return node;
  });
}

const dialog = useDialog();
const diskStore = useDiskStore();
const authStore = useAuthStore();
const { SvgIconVNode } = useSvgIcon();
const { textPreviewVisible, textPreviewRow } = storeToRefs(diskStore);

const isFullscreen = ref(false);
const markdownMode = ref(false);
const saving = ref(false);
const tabs = ref<TabItem[]>([]);
const activeTab = ref('');
const treeSelectedKeys = ref<Array<string | number>>([]);
const treeExpandedKeys = ref<Array<string | number>>([]);
const collapsed = ref(true);
const treeData = ref<TabNode[]>([]);
const abortControllerMap = new Map<string, AbortController>();

// 历史版本
const showHistoryDrawer = ref(false);
const historyList = shallowRef<HistoryVersion[]>([]);
const historyLoading = ref(false);
const historyContent = ref<string | null>(null);
const previewingHistoryId = ref<CommonType.IdType | null>(null);

// 当前目录路径
const currentTreePath = ref('/');

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

// 监听 tab 内容变化，更新 isModified 状态（关键：解决保存按钮不显示问题）
watch(
  () => tabs.value,
  newTabs => {
    newTabs.forEach(tab => {
      if (tab.originalContent !== undefined && tab.content !== undefined) {
        tab.isModified = tab.content !== tab.originalContent;
      }
    });
  },
  { deep: true }
);

const hasHistoryVersion = computed(() => {
  return currentTab.value?.hasHistoryVersion ?? false;
});

const currentLanguage = computed(() => {
  const suffix = activeTab.value.split('.').pop() || 'txt';
  const languages = monaco.languages.getLanguages();
  const lang = languages.find(l => l.extensions?.includes(`.${suffix}`));
  return lang?.id || 'plaintext';
});

// 面包屑路径 - 使用当前目录路径
const breadcrumbSegments = computed(() => {
  const path = currentTreePath.value;
  return path.split('/').filter(Boolean);
});

// 保存文件（使用历史版本 API）
async function saveTab(tab: TabItem) {
  if (!tab.isModified) return;

  try {
    const { error } = await fetchSaveWithHistory({
      fileId: tab.fileId,
      content: tab.content
    });

    if (!error) {
      tab.originalContent = tab.content;
      tab.isModified = false;
      tab.hasHistoryVersion = true;
      window.$message?.success(`文件 ${tab.title} 保存成功`);
    } else {
      throw new Error(error.message || '保存失败');
    }
  } catch (error) {
    window.$message?.error(`文件 ${tab.title} 保存失败: ${error}`);
    throw error;
  }
}

async function handleSave() {
  const tab = currentTab.value;
  if (!tab || !tab.isModified) return;

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
               
              await saveTab(tab);
            }
            textPreviewVisible.value = false;
            resolve(true);
          } catch {
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
  treeData.value = [];
  treeExpandedKeys.value = [];
  treeSelectedKeys.value = [];
  currentTreePath.value = '/';
  historyList.value = [];
  showHistoryDrawer.value = false;
}

function toggleMarkdownMode() {
  markdownMode.value = !markdownMode.value;
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

// 返回根目录
function handleGoHome() {
  currentTreePath.value = '/';
  initTreeData(currentFile.value!);
}

// 上一级
function handleGoUp() {
  if (currentTreePath.value === '/') return;

  const segments = currentTreePath.value.split('/').filter(Boolean);
  segments.pop();
  currentTreePath.value = segments.length > 0 ? '/' + segments.join('/') : '/';

  initTreeData(currentFile.value!);
}

// 刷新文件树
async function handleRefreshTree() {
  await initTreeData(currentFile.value!);
}

// 新建文件
async function handleCreateFile() {
  dialog.create({
    title: '新建文件',
    content: '请输入文件名：',
    positiveText: '创建',
    negativeText: '取消',
    onPositiveClick: async () => {
      // 使用 prompt 获取文件名（简化处理）
    }
  });

  // 使用简单的输入方式
  const fileName = await new Promise<string | null>(resolve => {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '请输入文件名（如 newfile.txt）';
    input.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;padding:8px 12px;border-radius:4px;border:1px solid #ccc;width:300px;';

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:9999;';
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.removeChild(input);
      resolve(null);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(input);
    input.focus();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        document.body.removeChild(overlay);
        document.body.removeChild(input);
        resolve(value || null);
      } else if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.body.removeChild(input);
        resolve(null);
      }
    });
  });

  if (!fileName) return;

  try {
    const { error } = await fetchCreateFile({
      fileName,
      folderPath: currentTreePath.value === '/' ? '/' : currentTreePath.value
    });

    if (!error) {
      window.$message?.success(`文件 ${fileName} 创建成功`);
      await handleRefreshTree();
    } else {
      window.$message?.error(`创建失败: ${error.message || '未知错误'}`);
    }
  } catch (error) {
    window.$message?.error(`创建失败: ${error}`);
  }
}

// 历史版本功能
async function loadHistoryVersions(fileId: CommonType.IdType) {
  historyLoading.value = true;
  try {
    const { data, error } = await fetchHistoryList(fileId);
    if (!error && data) {
      historyList.value = data;
    } else {
      historyList.value = [];
    }
  } catch {
    historyList.value = [];
  } finally {
    historyLoading.value = false;
  }
}

async function previewHistoryVersion(version: HistoryVersion) {
  historyLoading.value = true;
  try {
    const { data, error } = await fetchHistoryContent(version.id);
    if (!error && data) {
      historyContent.value = data;
      previewingHistoryId.value = version.id;
    }
  } catch {
    window.$message?.error('获取历史版本内容失败');
  } finally {
    historyLoading.value = false;
  }
}

async function restoreHistoryVersion(version: HistoryVersion) {
  const tab = currentTab.value;
  if (!tab) return;

  dialog.warning({
    title: '恢复历史版本',
    content: `确定要恢复到 ${version.createTime} 的版本吗？当前未保存的修改将被覆盖。`,
    positiveText: '恢复',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const { error } = await fetchRestoreHistory(version.id);
        if (!error) {
          // 重新加载文件内容
          const contentResult = await fetchHistoryContent(version.id);
          if (!contentResult.error && contentResult.data) {
            tab.content = contentResult.data;
            tab.isModified = true;
          }
          window.$message?.success('恢复成功');
          showHistoryDrawer.value = false;
          historyContent.value = null;
          previewingHistoryId.value = null;
        } else {
          window.$message?.error('恢复失败');
        }
      } catch {
        window.$message?.error('恢复失败');
      }
    }
  });
}

async function deleteHistoryVersion(version: HistoryVersion) {
  dialog.warning({
    title: '删除历史版本',
    content: `确定要删除 ${version.createTime} 的版本吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const { error } = await fetchDeleteHistory([version.id]);
        if (!error) {
          historyList.value = historyList.value.filter(v => v.id !== version.id);
          if (previewingHistoryId.value === version.id) {
            historyContent.value = null;
            previewingHistoryId.value = null;
          }
          window.$message?.success('删除成功');
        } else {
          window.$message?.error('删除失败');
        }
      } catch {
        window.$message?.error('删除失败');
      }
    }
  });
}

function toggleHistoryDrawer() {
  const tab = currentTab.value;
  if (!tab) return;

  if (!showHistoryDrawer.value) {
    loadHistoryVersions(tab.fileId);
  } else {
    historyContent.value = null;
    previewingHistoryId.value = null;
  }
  showHistoryDrawer.value = !showHistoryDrawer.value;
}

function isTextFile(file: Api.Disk.FileItem) {
  const textExtensions = [
    'txt', 'md', 'json', 'xml', 'yml', 'yaml', 'js', 'ts', 'vue', 'jsx', 'tsx',
    'py', 'java', 'go', 'rs', 'cpp', 'c', 'h', 'css', 'scss', 'less', 'html', 'htm',
    'sh', 'bash', 'zsh', 'ps1', 'sql', 'dockerfile', 'nginx', 'log', 'conf', 'ini', 'env'
  ];
  const suffix = file.fileExtension?.toLowerCase() || '';
  return textExtensions.includes(suffix) || file.fileType?.includes('text');
}

function getLanguageBySuffix(suffix: string): string {
  const langMap: Record<string, string> = {
    js: 'javascript', ts: 'typescript', vue: 'html', jsx: 'javascript', tsx: 'typescript',
    py: 'python', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c', h: 'c',
    css: 'css', scss: 'scss', less: 'less', html: 'html', htm: 'html',
    json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml', sql: 'sql',
    sh: 'shell', bash: 'shell', md: 'markdown', txt: 'plaintext', log: 'plaintext',
    conf: 'ini', ini: 'ini', env: 'plaintext'
  };
  return langMap[suffix] || 'plaintext';
}

async function loadFileContent(file: Api.Disk.FileItem, tab: TabItem) {
  if (abortControllerMap.has(tab.path)) {
    abortControllerMap.get(tab.path)?.abort();
    abortControllerMap.delete(tab.path);
  }

  const abortController = new AbortController();
  abortControllerMap.set(tab.path, abortController);

  try {
    const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
    const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
    const url = `${baseURL}/preview/text/stream?fileId=${file.fileId}&t=${Date.now()}`;

    const headers = new Headers();
    if (authStore.token) {
      headers.append('Authorization', `Bearer ${authStore.token}`);
    }

    const response = await fetch(url, {
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

    const updateContent = useThrottleFn((text: string) => {
      tab.content = text;
    }, 150);

    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        tab.content = result;
        tab.originalContent = result;
        break;
      }
      result += decoder.decode(value, { stream: true });
      updateContent(result);
    }

    // 加载完成后检查是否有历史版本 - 使用 tabs 数组中的响应式引用
    const reactiveTab = tabs.value.find(t => t.path === tab.path);
    if (reactiveTab && reactiveTab.fileId) {
      // 使用 tab 的 fileId 调用历史版本 API
      const { data: historyData, error: historyError } = await fetchHistoryList(reactiveTab.fileId);
      if (!historyError && historyData && historyData.length > 0) {
        reactiveTab.hasHistoryVersion = true;
      }
    }
  } catch (error) {
    window.$message?.error?.(`加载文件失败: ${error}`);
  } finally {
    abortControllerMap.delete(tab.path);
  }
}

async function initFile(file: Api.Disk.FileItem, fullPath?: string) {
  let path = fullPath || file.filePath || `/${file.fileName}`;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  const existingTab = tabs.value.find(tab => tab.path === path);
  if (existingTab) {
    activeTab.value = existingTab.path;
    return;
  }

  if (file.fileSize && file.fileSize > 2 * 1024 * 1024) {
    window.$message?.warning(`文件 ${file.fileName} 过大，暂不支持预览`);
    return;
  }

  const suffix = file.fileExtension?.toLowerCase() || '';
  const newTab: TabItem = {
    path,
    title: file.fileName,
    fileId: file.fileId,
    language: getLanguageBySuffix(suffix),
    content: '',
    originalContent: '',
    isModified: false,
    hasHistoryVersion: false
  };
  tabs.value.push(newTab);
  activeTab.value = path;

  const reactiveTab = tabs.value.find(t => t.path === path);
  if (reactiveTab) {
    await loadFileContent(file, reactiveTab);
  }
}

async function fetchFiles(directory: string): Promise<TabNode[]> {
  // 使用文件树懒加载API
  const { data, error } = await request<Editor.FileTreeNode[]>({
    url: '/file-meta/file-tree',
    method: 'get',
    params: {
      path: directory === '/' ? '' : directory
    }
  });

  if (error || !data) return [];

  // 过滤出文件夹和文本文件
  return data
    .filter((f: Editor.FileTreeNode) => f.isDir || isTextFile({
      fileId: f.id,
      fileName: f.name,
      fileExtension: f.name.split('.').pop() || '',
      fileType: f.contentType,
      isFolder: f.isDir
    } as Api.Disk.FileItem))
    .map((f: Editor.FileTreeNode) => {
      let fullPath = directory === '/' ? `/${f.name}` : `${directory}/${f.name}`;
      fullPath = fullPath.replace(/\/\//g, '/');
      return {
        key: f.id,
        label: f.name,
        // 文件：isLeaf=true
        // 文件夹：hasChildren=true时isLeaf=false触发懒加载，hasChildren=false时isLeaf=true表示无子节点
        isLeaf: !f.isDir || (f.isDir && !f.hasChildren),
        // 有子节点的文件夹：children=[]触发懒加载
        // 无子节点的文件夹或文件：children=undefined
        children: f.isDir && f.hasChildren ? [] : undefined,
        file: {
          fileId: f.id,
          fileName: f.name,
          fileExtension: f.name.split('.').pop() || '',
          fileType: f.contentType,
          fileSize: f.size,
          filePath: f.path,
          isFolder: f.isDir,
          createTime: f.updateTime,
          updateTime: f.updateTime,
          modifyTime: f.updateTime,
          createBy: '',
          updateBy: '',
          parentId: null
        } as Api.Disk.FileItem,
        fullPath
      };
    });
}

const handleLoad = async (node: TabNode) => {
  if (!node.fullPath || node.isLeaf) return;
  const children = await fetchFiles(node.fullPath);
  // 使用辅助函数递归更新树节点的 children，触发响应式更新
  treeData.value = updateTreeNodeChildren(treeData.value, node.key as string | number, children);
};

async function initTreeData(file: Api.Disk.FileItem) {
  let path = file.filePath || `/${file.fileName}`;
  if (!path.startsWith('/')) path = `/${path}`;

  const lastSlashIndex = path.lastIndexOf('/');
  const parentDir = lastSlashIndex <= 0 ? '/' : path.substring(0, lastSlashIndex);

  currentTreePath.value = parentDir;
  treeData.value = await fetchFiles(parentDir);
  treeSelectedKeys.value = [file.fileId];
}

const getFileIconClass = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    js: 'disk-file-js',
    ts: 'disk-file-js',
    vue: 'disk-file-html',
    html: 'disk-file-html',
    css: 'disk-file-css',
    scss: 'disk-file-css',
    less: 'disk-file-css',
    json: 'disk-file-json',
    md: 'disk-file-md',
    txt: 'disk-file-txt',
    xml: 'disk-file-other',
    yaml: 'disk-file-yaml',
    yml: 'disk-file-yaml',
    sql: 'disk-file-other',
    sh: 'disk-file-other',
    bash: 'disk-file-other',
    zsh: 'disk-file-other',
    py: 'disk-file-python',
    java: 'disk-file-other',
    go: 'disk-file-other',
    rs: 'disk-file-other',
    c: 'disk-file-other',
    cpp: 'disk-file-other',
    dockerfile: 'disk-file-other',
    log: 'disk-file-txt',
    conf: 'disk-file-other',
    ini: 'disk-file-other',
    env: 'disk-file-other'
  };
  return iconMap[extension] || 'disk-file-other';
};

const renderTreeIcon = ({ option }: { option: TabNode }) => {
  if (option.file) {
    if (option.file.isFolder) {
      const renderIcon = SvgIconVNode({ localIcon: 'disk-list-folder', fontSize: 18 });
      return renderIcon ? renderIcon() : undefined;
    }
    const localIcon = getFileIconClass(option.file.fileName);
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
        await saveTab(tab);
        closeTabLogic(path);
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

const handleTreeSelect = async (keys: Array<string | number>, options: Array<TabNode | null>) => {
  treeSelectedKeys.value = keys;
  const node = options[0];
  if (node?.file) {
    if (node.file.isFolder) {
      // 点击文件夹：切换展开状态，让 NTree 的 on-load 处理懒加载
      const nodeKey = node.key as string | number;
      const isCurrentlyExpanded = treeExpandedKeys.value.includes(nodeKey);

      if (isCurrentlyExpanded) {
        // 折叠节点
        treeExpandedKeys.value = treeExpandedKeys.value.filter(k => k !== nodeKey);
      } else {
        // 展开节点，NTree 会自动调用 handleLoad 进行懒加载
        treeExpandedKeys.value = [...treeExpandedKeys.value, nodeKey];
      }
    } else {
      // 点击文件：打开文件
      initFile(node.file, node.fullPath);
    }
  }
};

watch(activeTab, newPath => {
  const tab = tabs.value.find(t => t.path === newPath);
  if (tab) {
    treeSelectedKeys.value = [tab.fileId];
    showHistoryDrawer.value = false;
    historyContent.value = null;
    previewingHistoryId.value = null;
  } else {
    treeSelectedKeys.value = [];
  }
});

function handleTabChange(path: string) {
  const tab = tabs.value.find(t => t.path === path);
  if (tab) {
    markdownMode.value = path.toLowerCase().endsWith('.md');
  }
}

watch(currentFile, file => {
  if (file && visible.value) {
    initFile(file);
    initTreeData(file);
  }
});

watch(visible, show => {
  if (show && currentFile.value) {
    initFile(currentFile.value);
    initTreeData(currentFile.value);
  } else if (!show) {
    // 清理
    tabs.value = [];
    activeTab.value = '';
    historyList.value = [];
    showHistoryDrawer.value = false;
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :mask-closable="false"
    class="text-preview-modal"
    :class="dialogWidth"
    :on-close="handleClose"
    @after-leave="handleAfterLeave"
  >
    <!-- Header: 房子图标 + 面包屑 -->
    <template #header>
      <div class="flex items-center gap-2">
        <NButton quaternary size="small" @click="handleGoHome">
          <template #icon>
            <icon-mdi-home-outline class="text-lg" />
          </template>
        </NButton>
        <div class="flex items-center text-sm">
          <template v-for="(segment, index) in breadcrumbSegments" :key="index">
            <span class="text-gray-400 mx-1">/</span>
            <span class="text-gray-600 dark:text-gray-300">{{ segment }}</span>
          </template>
        </div>
      </div>
    </template>

    <template #header-extra>
      <div class="flex items-center gap-2">
        <NTag v-if="isModified" type="warning" size="small">已修改</NTag>
        <NButton v-if="isModified" type="primary" size="small" :loading="saving" @click="handleSave">保存</NButton>
        <NButton v-if="hasHistoryVersion" size="small" @click="toggleHistoryDrawer">
          历史版本
        </NButton>
        <NButton v-if="isMarkdown" quaternary size="small" @click="toggleMarkdownMode">
          <template #icon>
            <icon-ic-baseline-remove-red-eye v-if="!markdownMode" />
            <icon-mdi-invoice-text-edit-outline v-else />
          </template>
        </NButton>
        <NButton quaternary size="small" @click="toggleFullscreen">
          <template #icon>
            <icon-gridicons-fullscreen-exit v-if="isFullscreen" />
            <icon-gridicons-fullscreen v-else />
          </template>
        </NButton>
      </div>
    </template>

    <NLayout has-sider class="h-full">
      <NLayoutSider
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
        <!-- 文件树顶部工具栏 -->
        <div class="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
          <NButton quaternary size="small" :disabled="currentTreePath === '/'" @click="handleGoUp">
            <template #icon>
              <icon-mdi-arrow-up class="text-base" />
            </template>
          </NButton>
          <NButton quaternary size="small" @click="handleRefreshTree">
            <template #icon>
              <icon-mdi-refresh class="text-base" />
            </template>
          </NButton>
          <NButton quaternary size="small" @click="handleCreateFile">
            <template #icon>
              <icon-mdi-plus class="text-base" />
            </template>
          </NButton>
        </div>

        <NTree
          v-model:selected-keys="treeSelectedKeys"
          v-model:expanded-keys="treeExpandedKeys"
          :data="treeData"
          block-line
          selectable
          :on-load="handleLoad"
          :render-label="renderTreeLabel"
          :render-prefix="renderTreeIcon"
          @update:selected-keys="handleTreeSelect"
        />
      </NLayoutSider>

      <NLayoutContent class="h-full flex flex-col bg-white dark:bg-[#18181c]">
        <!-- 历史版本抽屉 -->
        <NDrawer v-model:show="showHistoryDrawer" :width="320" placement="right">
          <NDrawerContent title="历史版本" closable>
            <NSpin v-if="historyLoading" size="small" />
            <div v-else-if="historyList.length === 0" class="text-center text-gray-400 py-4">
              暂无历史版本
            </div>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="version in historyList"
                :key="version.id"
                class="p-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <div class="flex justify-between items-center text-sm">
                  <span>{{ version.createTime }}</span>
                  <span class="text-gray-500">{{ formatFileSize(version.size) }}</span>
                </div>
                <div class="flex gap-1 mt-1">
                  <NButton size="tiny" @click="previewHistoryVersion(version)">预览</NButton>
                  <NButton size="tiny" type="primary" @click="restoreHistoryVersion(version)">恢复</NButton>
                  <NButton size="tiny" type="error" @click="deleteHistoryVersion(version)">删除</NButton>
                </div>
              </div>
            </div>

            <!-- 预览内容 -->
            <div v-if="historyContent" class="mt-4 p-2 border rounded">
              <div class="text-sm font-medium mb-2">历史版本内容</div>
              <pre class="text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">{{ historyContent }}</pre>
            </div>
          </NDrawerContent>
        </NDrawer>

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
            <icon-mdi-file-document-outline class="text-6xl opacity-50" />
            <span>请选择文件查看</span>
          </div>
        </div>
      </NLayoutContent>
    </NLayout>

    <template #footer>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-4">
          <span>{{ currentLanguage }}</span>
          <span>{{ currentFile?.fileSize ? formatFileSize(currentFile.fileSize) : '' }}</span>
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