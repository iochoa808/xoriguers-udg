export function buildMailto(email: string, nom: string, talla?: string): string {
  const subject = talla ? `Reserva: ${nom} (Talla ${talla})` : `Reserva: ${nom}`;
  const body = talla
    ? `Hola,\n\nVoldria reservar aquest article:\n\n- Article: ${nom}\n- Talla: ${talla}\n\nGràcies!`
    : `Hola,\n\nVoldria reservar aquest article:\n\n- Article: ${nom}\n\nGràcies!`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
