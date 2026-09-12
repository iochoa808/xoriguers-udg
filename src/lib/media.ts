export function mediaUrl(base: string, path?: string): string | undefined {
  if (!path) return undefined;
  return `${base}${path.replace(/^\/+/, '')}`;
}

export function isUploadedPath(path: string): boolean {
  return path.startsWith('/');
}
