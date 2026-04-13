/**
 * 动态设置 favicon
 * @param faviconUrl favicon URL，为空时不更新
 */
export function setupFavicon(faviconUrl: string | null) {
  if (!faviconUrl) return;

  const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (link) {
    link.href = faviconUrl;
  } else {
    // 如果不存在 link 元素，动态创建
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = faviconUrl;
    document.head.appendChild(newLink);
  }
}