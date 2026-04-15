import { h } from 'vue';
import type { App } from 'vue';
import { NButton } from 'naive-ui';
import { $t } from '@/locales';
import { useSystemConfigStore } from '@/store/modules/system-config';
import { fetchCheckDB } from '@/service/api/init';
import { localStg } from '@/utils/storage';
import { setupFavicon } from './favicon';

// 初始化状态缓存配置
const CHECK_DB_CACHE_KEY = 'check_db_result';
const CHECK_DB_CACHE_EXPIRE = 5 * 60 * 1000; // 5分钟缓存

interface CheckDBCache {
  needInit: boolean;
  timestamp: number;
}

export function setupAppErrorHandle(app: App) {
  app.config.errorHandler = (err, vm, info) => {
    // eslint-disable-next-line no-console
    console.error(err, vm, info);
  };
}

export function setupAppVersionNotification() {
  // Update check interval in milliseconds
  const UPDATE_CHECK_INTERVAL = 3 * 60 * 1000;

  const canAutoUpdateApp = import.meta.env.VITE_AUTOMATICALLY_DETECT_UPDATE === 'Y' && import.meta.env.PROD;
  if (!canAutoUpdateApp) return;

  let isShow = false;
  let updateInterval: ReturnType<typeof setInterval> | undefined;

  const checkForUpdates = async () => {
    if (isShow) return;

    const buildTime = await getHtmlBuildTime();

    // If failed to get build time or build time hasn't changed, no update is needed.
    if (!buildTime || buildTime === BUILD_TIME) {
      return;
    }

    isShow = true;

    // Show update notification
    const n = window.$notification?.create({
      title: $t('system.updateTitle'),
      content: $t('system.updateContent'),
      action() {
        return h('div', { style: { display: 'flex', justifyContent: 'end', gap: '12px', width: '325px' } }, [
          h(
            NButton,
            {
              onClick() {
                n?.destroy();
                isShow = false;
              }
            },
            () => $t('system.updateCancel')
          ),
          h(
            NButton,
            {
              type: 'primary',
              onClick() {
                location.reload();
              }
            },
            () => $t('system.updateConfirm')
          )
        ]);
      },
      onClose() {
        isShow = false;
      }
    });
  };

  const startUpdateInterval = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    updateInterval = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
  };

  // If updates should be checked, set up the visibility change listener and start the update interval
  if (!isShow && document.visibilityState === 'visible') {
    // Check for updates when the document is visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
        startUpdateInterval();
      }
    });

    // Start the update interval
    startUpdateInterval();
  }
}

async function getHtmlBuildTime(): Promise<string | null> {
  const baseUrl = import.meta.env.VITE_BASE_URL || '/';

  try {
    const res = await fetch(`${baseUrl}index.html?time=${Date.now()}`);

    if (!res.ok) {
      return null;
    }

    const html = await res.text();
    const match = html.match(/<meta name="buildTime" content="(.*)">/);
    return match?.[1] || null;
  } catch (error) {
    window.console.error('getHtmlBuildTime error:', error);
    return null;
  }
}

/** 初始化系统配置 */
export async function setupSystemConfig() {
  // 先检查系统是否需要初始化
  const cache = localStg.get(CHECK_DB_CACHE_KEY) as CheckDBCache | null;
  const now = Date.now();

  // 如果缓存有效且需要初始化，跳过配置获取
  if (cache && (now - cache.timestamp) < CHECK_DB_CACHE_EXPIRE && cache.needInit) {
    return;
  }

  // 调用 API 检查初始化状态
  const { data, error } = await fetchCheckDB();
  if (!error && data?.needInit) {
    // 缓存结果
    localStg.set(CHECK_DB_CACHE_KEY, {
      needInit: true,
      timestamp: now
    } as CheckDBCache);
    // 需要初始化，跳过配置获取
    return;
  }

  // 系统已初始化，正常获取配置
  try {
    const systemConfigStore = useSystemConfigStore();
    await systemConfigStore.fetchConfig();

    // 设置 favicon
    const faviconUrl = systemConfigStore.getFaviconUrl();
    setupFavicon(faviconUrl);
  } catch {
    // 系统配置获取失败不应阻塞应用启动，使用默认值即可
  }
}
