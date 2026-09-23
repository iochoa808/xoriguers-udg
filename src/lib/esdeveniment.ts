export type TipusEsdeveniment = 'Actuacio' | 'Assaig' | 'Diada' | 'Trobada' | 'Altres';

/**
 * The calendar names events by their kind ("ASSAIG", "ACTUACIÓ RESA") and the
 * registre històric follows the same habit ("Diada hivern Xoriguers"), so the
 * name is enough to classify. Assaig is checked first: it is the one kind that
 * is not a performance, and getting it wrong would put practices in the archive.
 */
export function classificaEsdeveniment(nom: string): TipusEsdeveniment {
  const n = nom.toLowerCase();
  if (/assaig|assajos/.test(n)) return 'Assaig';
  if (/diada/.test(n)) return 'Diada';
  if (/trobada/.test(n)) return 'Trobada';
  if (/actuaci/.test(n)) return 'Actuacio';
  return 'Actuacio';
}

/**
 * Seasons run with the university year: September starts a new one, so
 * 25 September 2025 and 28 May 2026 are both "2025-2026".
 */
export function temporadaDe(data: Date): string {
  const any = data.getUTCFullYear();
  const mes = data.getUTCMonth() + 1;
  return mes >= 9 ? `${any}-${any + 1}` : `${any - 1}-${any}`;
}

/** "Plaça del Vi, Girona", or whichever half is known. */
export function llocComplet(lloc?: string, poblacio?: string): string | undefined {
  return [lloc, poblacio].filter(Boolean).join(', ') || undefined;
}

/** The one-line "12:00 · Plaça del Vi, Girona" shown under an event's name. */
export function detallsEsdeveniment(hora?: string, lloc?: string, poblacio?: string): string {
  return [hora, llocComplet(lloc, poblacio)].filter(Boolean).join(' · ');
}
