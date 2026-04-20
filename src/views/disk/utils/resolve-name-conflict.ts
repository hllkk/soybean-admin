/**
 * Resolve name conflicts by appending (1), (2), etc.
 * e.g. "file.txt" → "file(1).txt" if "file.txt" exists
 */
export function resolveNameConflict(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) return baseName;

  const lastDotIndex = baseName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? baseName.slice(0, lastDotIndex) : baseName;
  const ext = lastDotIndex > 0 ? baseName.slice(lastDotIndex) : '';

  let i = 1;
  while (existingNames.includes(`${nameWithoutExt}(${i})${ext}`)) {
    i++;
  }
  return `${nameWithoutExt}(${i})${ext}`;
}