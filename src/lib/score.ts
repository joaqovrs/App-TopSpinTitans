// Logica pura del marcador, espejo de las reglas del backend (submit_result):
// mejor de 5, set a 11 con diferencia de 2 (ITTF). Sirve para feedback en vivo
// en el modal de carga. El backend es siempre la fuente de verdad.

export type SetScore = { id: string; mine: number; theirs: number };

export function isValidSet(a: number, b: number): boolean {
  if (a < 0 || b < 0 || a === b) return false;
  const w = Math.max(a, b);
  const l = Math.min(a, b);
  return (w === 11 && l <= 9) || (w >= 12 && w - l === 2);
}

export type ResultSummary = {
  winsMine: number;
  winsTheirs: number;
  winner: 'mine' | 'theirs' | null;
  /** Listo para enviar: marcador valido y partido decidido. */
  complete: boolean;
  error: string | null;
};

export function summarize(sets: SetScore[]): ResultSummary {
  let winsMine = 0;
  let winsTheirs = 0;
  let error: string | null = null;

  for (let i = 0; i < sets.length; i++) {
    const { mine, theirs } = sets[i];
    if (!isValidSet(mine, theirs)) {
      error = `Set ${i + 1}: se gana a 11 con 2 de diferencia.`;
      break;
    }
    if (mine > theirs) winsMine++;
    else winsTheirs++;

    if ((winsMine === 3 || winsTheirs === 3) && i !== sets.length - 1) {
      error = 'El partido termina al ganar 3 sets; quita los sets de mas.';
      break;
    }
  }

  const decided = !error && (winsMine === 3 || winsTheirs === 3);
  const winner = decided ? (winsMine === 3 ? 'mine' : 'theirs') : null;
  const complete =
    decided && sets.length >= 3 && sets.length <= 5 && error === null;

  return { winsMine, winsTheirs, winner, complete, error };
}
