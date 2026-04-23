/**
 * Office 版本历史管理 Hook
 */

import { ref, computed } from 'vue';
import { useDialog } from 'naive-ui';
import {
  fetchGetOfficeHistoryList,
  fetchGetOfficeJwtHistory
} from '@/service/api/disk/office';
import {
  getOfficeHistoryPreviewUrl,
  generateDocumentKey
} from '@/utils/office-config';
import { useOfficeConfig } from './use-office-config';
import type { HistoryVersion, HistoryResponse, DocEditorInstance } from '@/types/office';

/**
 * Office 版本历史 Hook
 * @param fileId 文件 ID
 * @param token 用户 token
 * @param username 用户名
 */
export function useOfficeHistory(
  fileId: CommonType.IdType,
  token?: string,
  username?: string
) {
  const dialog = useDialog();
  const { getCallbackBaseUrl } = useOfficeConfig();

  /** 历史版本列表 */
  const historyList = ref<HistoryVersion[]>([]);

  /** 加载状态 */
  const loading = ref(false);

  /** 当前查看的历史版本 */
  const currentHistoryVersion = ref<HistoryVersion | null>(null);

  /** 是否正在查看历史 */
  const isViewingHistory = computed(() => currentHistoryVersion.value !== null);

  /** 是否有历史版本 */
  const hasHistory = computed(() => historyList.value.length > 0);

  /** 当前版本号 (历史数量 + 1) */
  const currentVersion = computed(() => historyList.value.length + 1);

  /**
   * 加载历史版本列表
   */
  async function loadHistory() {
    if (!fileId) return;

    loading.value = true;

    try {
      const response = await fetchGetOfficeHistoryList(fileId);
      historyList.value = response.data || [];
    } catch (err) {
      console.error('Failed to load history:', err);
      historyList.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取历史版本数据
   * 用于 OnlyOffice onRequestHistoryData 事件
   * @param version 版本号
   * @param docEditor 编辑器实例
   * @param fileType 文件类型
   */
  async function getHistoryData(
    version: number,
    docEditor: DocEditorInstance,
    fileType: string
  ) {
    const historyInfo = historyList.value.find((h: HistoryVersion) => h.version === version);
    if (!historyInfo) {
      console.error('History version not found:', version);
      return;
    }

    const callbackBaseUrl = getCallbackBaseUrl();
    const historyUrl = getOfficeHistoryPreviewUrl(
      callbackBaseUrl,
      historyInfo.key,
      username,
      token
    );

    const historyConfig = {
      fileType,
      key: generateDocumentKey(historyInfo.createTime, historyInfo.key),
      url: historyUrl,
      version: String(historyInfo.version)
    };

    try {
      const response = await fetchGetOfficeJwtHistory(historyConfig);
      const historyData: HistoryVersion = {
        ...historyConfig,
        createTime: historyInfo.createTime,
        token: response.data ?? undefined
      };
      docEditor.setHistoryData(historyData);
    } catch (err) {
      console.error('Failed to get history JWT:', err);
    }
  }

  /**
   * 查看指定历史版本
   * @param version 历史版本
   * @param docEditor 编辑器实例
   * @param fileType 文件类型
   */
  async function viewHistory(
    version: HistoryVersion,
    docEditor: DocEditorInstance,
    fileType: string
  ) {
    currentHistoryVersion.value = version;
    const versionNum = typeof version.version === 'string' ? parseInt(version.version, 10) : version.version;
    await getHistoryData(versionNum, docEditor, fileType);
  }

  /**
   * 取消查看历史，返回当前版本
   */
  function cancelViewHistory() {
    currentHistoryVersion.value = null;
  }

  /**
   * 刷新历史数据
   * 用于 OnlyOffice onRequestHistory 事件
   * @param docEditor 编辑器实例
   */
  function refreshHistory(docEditor: DocEditorInstance) {
    const historyData: HistoryResponse = {
      currentVersion: currentVersion.value,
      history: historyList.value.map((h: HistoryVersion) => ({
        version: h.version,
        key: h.key,
        url: h.url,
        createTime: h.createTime,
        operator: h.operator,
        changes: h.changes
      }))
    };
    docEditor.refreshHistory(historyData);
  }

  /**
   * 恢复历史版本确认对话框
   * @param versionId 版本 ID
   * @param onConfirm 确认回调
   */
  function confirmRestore(versionId: CommonType.IdType, onConfirm: () => void) {
    dialog.warning({
      title: '确认恢复',
      content: '确定要恢复到此历史版本吗？',
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: onConfirm
    });
  }

  /**
   * 重置状态
   */
  function reset() {
    historyList.value = [];
    currentHistoryVersion.value = null;
  }

  return {
    historyList,
    loading,
    currentHistoryVersion,
    isViewingHistory,
    hasHistory,
    currentVersion,
    loadHistory,
    getHistoryData,
    viewHistory,
    cancelViewHistory,
    refreshHistory,
    confirmRestore,
    reset
  };
}