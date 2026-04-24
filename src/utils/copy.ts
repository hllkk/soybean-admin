import { $t } from '@/locales';

export async function handleCopy(source?: string) {
  if (!source) {
    return;
  }

  try {
    // 优先使用原生 Clipboard API（需要安全上下文 HTTPS）
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(source);
    } else {
      // Fallback for HTTP: 使用更可靠的 textarea 方法
      copyWithTextarea(source);
    }
    window.$message?.success($t('common.copySuccess'));
  } catch (error) {
    console.error('Copy failed:', error);
    window.$message?.error($t('common.copyFail'));
  }
}

// HTTP 环境下的 fallback 复制方法
function copyWithTextarea(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // 确保 textarea 可见且可选中（但不能让用户看到）
  textarea.style.position = 'absolute';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';

  document.body.appendChild(textarea);

  // iOS 需要特殊处理
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
    textarea.select();
  }

  // 执行复制
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!success) {
    throw new Error('Fallback copy failed');
  }
}
