export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function formatDayMonth(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short' }).format(d).toUpperCase();
}
