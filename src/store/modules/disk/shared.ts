export function parseFileName(inputName: string): { name: string; extension: string } {
  if (!inputName || inputName.trim() === '') {
    return { name: '新建文件', extension: 'txt' };
  }

  const trimmedName = inputName.trim();
  const lastDotIndex = trimmedName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return { name: trimmedName, extension: '' };
  }

  if (lastDotIndex === 0) {
    return { name: trimmedName, extension: '' };
  }

  const name = trimmedName.substring(0, lastDotIndex);
  const extension = trimmedName.substring(lastDotIndex + 1);

  if (extension === '') {
    return { name: trimmedName, extension: '' };
  }

  return { name, extension };
}

export function generateUniqueName(
  fileList: Api.Disk.FileItem[],
  baseName: string,
  isDir: boolean,
  extension?: string
): string {
  const existingNames = new Set(fileList.map(item => item.name));

  if (isDir) {
    if (!existingNames.has(baseName)) {
      return baseName;
    }
    let counter = 1;
    while (existingNames.has(`${baseName}(${counter})`)) {
      counter += 1;
    }
    return `${baseName}(${counter})`;
  }
  const fullName = extension ? `${baseName}.${extension}` : baseName;
  if (!existingNames.has(fullName)) {
    return fullName;
  }
  let counter = 1;
  while (existingNames.has(`${baseName}(${counter})${extension ? `.${extension}` : ''}`)) {
    counter += 1;
  }
  return `${baseName}(${counter})${extension ? `.${extension}` : ''}`;
}
