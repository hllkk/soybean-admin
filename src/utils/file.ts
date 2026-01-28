export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size.toFixed(2)} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const formatDate = (timestamp?: number | string) => {
  if (!timestamp) return '未知';
  return new Date(timestamp).toLocaleString();
};

export function isPath(path: string) {
  /** 检测路径中的斜杠字符 */
  return /[/\\]/.test(path);
}

export function encodeIfNeeded(str: string) {
  if (isEncoded(str)) {
    return str;
  }
  return encodeURIComponent(str);
}

function isEncoded(str: string) {
  return /%[0-9A-Fa-f]{2}/.test(str);
}

export function formatNetSpeed(size: number, space = false) {
  if (size === 0) {
    return space ? '0 B / s' : '0B/s';
  }
  if (size < 1024) return size + (space ? ' B / s' : 'B/s');
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + (space ? ' KB / s' : 'KB/s');
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + (space ? ' MB / s' : 'MB/s');
  return (size / (1024 * 1024 * 1024)).toFixed(2) + (space ? ' GB / s' : 'GB/s');
}

export const suffix = {
  simText: [
    'vue',
    'txt',
    'asp',
    'jsp',
    'TXT',
    'xml',
    'xsl',
    'iml',
    'm',
    'bas',
    'prg',
    'cmd',
    'sass',
    'sas',
    'php',
    'lst',
    'key',
    'pem',
    'log',
    'cmake',
    'db',
    'gradle',
    'bat',
    'conf',
    'dart',
    'plist',
    'cfg',
    'ini',
    'sql',
    'rst',
    'toml',
    'vbs',
    'yml',
    'yaml',
    'properties',
    'gitignore',
    'ts'
  ],
  compressedFile: ['zip', 'tar', '7z', 'rar', 'jar', 'tar.gz', 'tgz', 'tar.bz2'],
  iframePreviewFile: ['pdf', 'csv', 'drawio', 'mind', 'glb', 'gltf', 'dwg', 'excalidraw', 'stl', '3mf', 'amf', 'obj']
};
