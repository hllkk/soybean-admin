import { $t } from '@/locales';

export async function handleCopy(source?: string) {
  if (!source) {
    return;
  }

  try {
    // 方案1（推荐）: ClipboardEvent 拦截 — 在 copy 事件回调中直接写入数据
    // 不受 HTTP/HTTPS 限制，是现代浏览器中 HTTP 环境下最可靠的复制方式
    const ok = copyWithClipboardEvent(source);
    if (ok) {
      window.$message?.success($t('common.copySuccess'));
      return;
    }

    // 方案2: 原生 Clipboard API — 需要 HTTPS
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(source);
      window.$message?.success($t('common.copySuccess'));
      return;
    }

    // 方案3: textarea + execCommand fallback
    copyWithTextarea(source);
    window.$message?.success($t('common.copySuccess'));
  } catch {
    window.$message?.error($t('common.copyFail'));
  }
}

/** 通过 ClipboardEvent 拦截写入剪贴板（HTTP/HTTPS 均可用） */
function copyWithClipboardEvent(text: string): boolean {
  try {
    let success = false;
    const listener = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', text);
      success = true;
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);
    return success;
  } catch {
    return false;
  }
}

/** textarea + execCommand fallback */
function copyWithTextarea(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);

  const activeEl = document.activeElement;

  const isIOS = navigator.userAgent.match(/ipad|ipod|iphone/i);
  if (isIOS) {
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    textarea.setSelectionRange(0, 999999);
  } else {
    textarea.focus();
    textarea.select();
  }

  const ok = document.execCommand('copy');

  if (activeEl instanceof HTMLElement) {
    activeEl.focus();
  }

  document.body.removeChild(textarea);

  if (!ok) {
    throw new Error('Fallback copy failed');
  }
}
