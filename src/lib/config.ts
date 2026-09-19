export function isRealUrl(u?: string): boolean {
  return !!u && !u.startsWith('[');
}
