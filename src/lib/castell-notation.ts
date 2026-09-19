export function floors(notation: string): number {
  const match = notation.match(/d\s?(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}
