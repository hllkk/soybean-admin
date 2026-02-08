<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import type { IConfig } from '@onlyoffice/document-editor-vue';
import SparkMD5 from 'spark-md5';
import { fetchGetOnlyOfficeConfig } from '@/service/api/disk/list';
import { fetchGetOfficeJWT } from '@/service/api/disk/office';
import { useAuthStore } from '@/store/modules/auth';
import { useAppStore } from '@/store/modules/app';
import { getDocumentApiUrl, getOfficeCallbackBaseUrl, previewUrl } from '@/utils/file-config';

// // https://api.onlyoffice.com/zh-CN/docs/docs-api/usage-api/advanced-parameters/
defineOptions({
  name: 'OnlyOfficePreview'
});

interface Props {
  file: Api.Disk.FileItem;
}

const props = defineProps<Props>();

const authStore = useAuthStore();
const appStore = useAppStore();

// 编辑器实例
const docEditor = ref<any>(null);
const docEditorConfig = ref<IConfig>();

// 文件相关
const currentFileUrl = ref<string>('');
const fileKey = ref('');

// UI 状态
// const saved = ref<boolean>(true);
const titleObserver = ref<MutationObserver | null>(null);
// const saveBtnDoc = ref<HTMLButtonElement | null>(null);

// OnlyOffice 配置
const officeServerConfig = ref<Api.Disk.OnlyOfficeBackendConfig>();

// 生成唯一编辑器 ID
const editorId = computed(() => `office_${Math.round(Math.random() * 10000)}`);
// 文件类型
const fileType = computed(() => {
  return getFileType(props.file.extendName || '');
});

function getFileType(type: string) {
  const lowerType = type.trim().toLowerCase().replace(/^\./, '');
  // 返回 OnlyOffice 支持的真实文件类型
  switch (lowerType) {
    case 'doc':
      return 'doc';
    case 'docx':
    case 'word':
      return 'docx';
    case 'xls':
      return 'xls'; // 旧格式保持 xls
    case 'xlsx':
    case 'excel':
      return 'xlsx';
    case 'ppt':
      return 'ppt'; // 旧格式保持 ppt
    case 'pptx':
      return 'pptx';
    default:
      return lowerType;
  }
}

/**
 * 销毁编辑器
 */
const destroyEditor = () => {
  if (docEditor.value) {
    docEditor.value.destroyEditor();
    docEditor.value = null;
  }

  if (titleObserver.value) {
    titleObserver.value.disconnect();
    titleObserver.value = null;
  }
};

async function loadOffice(jwt?: string) {
  // 添加 JWT Token
  if (jwt) {
    if (docEditorConfig.value) {
      docEditorConfig.value.token = jwt;
    }
  }
  if (appStore.isMobile) {
    if (docEditorConfig.value) {
      docEditorConfig.value.type = 'mobile';
    }
  }

  // 绑定事件
  if (docEditorConfig.value) {
    if (!docEditorConfig.value.events) {
      docEditorConfig.value.events = {};
    }
    docEditorConfig.value.events.onAppReady = () => {
      window.$message?.success('Office文档已加载');
    };
  }

  // 初始化编辑器
  await nextTick();
  titleObserver.value = null;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  docEditor.value = new DocsAPI.DocEditor(editorId.value, docEditorConfig.value);
}

async function loadOfficeBefore() {
  if (officeServerConfig.value?.tokenEnabled) {
    const { data, error } = await fetchGetOfficeJWT(docEditorConfig.value);
    if (error) {
      window.$message?.error(`获取Office的JWT失败: ${error.message}`);
      return;
    }
    await loadOffice(data);
  } else {
    await loadOffice();
  }
}

async function loadFile() {
  // 销毁旧编辑器
  destroyEditor();

  // 获取文件用户名称
  const fileUsername = authStore.userInfo?.userName || '';
  // 获取后端回调的基本地址
  const officeCallBackBaseUrl = getOfficeCallbackBaseUrl(officeServerConfig.value?.callbackServer || '');
  const withJoinToken = true;
  currentFileUrl.value = previewUrl(props.file, authStore.token, undefined, officeCallBackBaseUrl, withJoinToken);
  fileKey.value = `${new Date(props.file.updateTime).getTime()}-${SparkMD5.hash(props.file.id + currentFileUrl.value)}`;
  const callbackUrl = `${officeCallBackBaseUrl}/office/callback?token=${authStore.token}&userName=${fileUsername}&fileId=${props.file.id}`;

  docEditorConfig.value = {
    document: {
      fileType: fileType.value,
      key: fileKey.value,
      title: props.file.name,
      url: currentFileUrl.value
    },
    documentType: 'word',
    editorConfig: {
      mode: 'edit',
      lang: 'zh-CN',
      user: {
        id: String(authStore.userInfo?.userId || ''),
        name: authStore.userInfo?.userName || '',
        image: authStore.userInfo?.userAvatar || ''
      },
      customization: {
        autosave: false,
        comments: true,
        compactHeader: false,
        compactToolbar: false,
        compatibleFeatures: false,
        forcesave: false,
        help: false,
        hideRightMenu: false,
        hideRulers: false,
        submitForm: false,
        feedback: false,
        close: {
          visible: true,
          text: '关闭'
        },
        uiTheme: document.documentElement.classList.contains('dark') ? 'default-dark' : 'default-light'
      },
      callbackUrl
    }
  };

  await loadOfficeBefore();
}

async function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve(url);
    script.onerror = () => reject(new Error(`加载 Office API 失败: ${url}`));
    document.head.appendChild(script);
  });
}
async function loadOfficeApi() {
  try {
    const officeApiUrl = getDocumentApiUrl(officeServerConfig.value?.documentServer || '');
    // 显示加载状态
    window.$message?.loading('正在加载 OnlyOffice...', { duration: 0 });
    // 动态加载脚本
    await loadScript(officeApiUrl);
    // 隐藏加载状态
    window.$message?.destroyAll();
    // 这里可以去后端获取文件的详情，根据需要来，暂时忽略
    // 加载文件
    await loadFile();
  } catch (error) {
    window.$message?.destroyAll();
    window.$message?.error(`加载 Office API 失败: ${error}`);
  }
}

watch(
  () => props.file.id,
  async id => {
    if (!id) return;

    try {
      // #todo 缺少判断是否是分享文件
      // 向后端获取onlyoffic基本配置
      const { data, error } = await fetchGetOnlyOfficeConfig();
      if (error) {
        window.$message?.error('从后端获取文档服务器配置失败');
        return;
      }
      if (data) {
        officeServerConfig.value = data;
      }

      await loadOfficeApi();
    } catch (error) {
      window.$message?.error(`加载 Office 配置失败: ${error}`);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div :id="editorId" class="size-full"></div>
</template>
