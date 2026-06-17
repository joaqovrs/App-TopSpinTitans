// Utilidades de fecha para los campos dd-mm-aaaa del panel admin.

/** "dd-mm-aaaa" (o con /) -> ISO "yyyy-mm-dd". null si esta vacio o es invalido. */
export function parseDmy(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Validacion real (evita 31-02, etc.).
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** ISO "yyyy-mm-dd" -> "dd-mm-aaaa". 'Sin fecha' si es null. */
export function formatDmy(iso: string | null): string {
  if (!iso) return 'Sin fecha';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}
