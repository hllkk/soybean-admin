export async function handleCopy(source?: string) {
  if (!source) {
    return;
  }

  const text = String(source);

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      window.$message?.success('复制成功');
      return;
    }
  } catch {
    // fallthrough to legacy copy
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    // document.execCommand 已弃用，但此处作为降级方案保留
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (ok) {
      window.$message?.success('复制成功');
    } else {
      window.$message?.error('复制失败');
    }
  } catch {
    window.$message?.error('复制失败');
  }
}
