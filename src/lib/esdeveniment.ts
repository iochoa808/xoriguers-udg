/** "Plaça del Vi, Girona", or whichever half is known. */
export function llocComplet(lloc?: string, poblacio?: string): string | undefined {
  return [lloc, poblacio].filter(Boolean).join(', ') || undefined;
}

/** The one-line "12:00 · Plaça del Vi, Girona" shown under an event's name. */
export function detallsEsdeveniment(hora?: string, lloc?: string, poblacio?: string): string {
  return [hora, llocComplet(lloc, poblacio)].filter(Boolean).join(' · ');
}
