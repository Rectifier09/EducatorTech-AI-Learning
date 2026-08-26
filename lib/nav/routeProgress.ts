type Listener = () => void;

const SAFETY_TIMEOUT_MS = 6000;

let loading = false;
const listeners = new Set<Listener>();
let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

/** Signals a navigation has begun. Safe to call repeatedly. */
export function start(): void {
  loading = true;
  if (safetyTimeout) clearTimeout(safetyTimeout);
  safetyTimeout = setTimeout(done, SAFETY_TIMEOUT_MS);
  emit();
}

/** Signals the navigation has settled (or been abandoned). */
export function done(): void {
  if (safetyTimeout) {
    clearTimeout(safetyTimeout);
    safetyTimeout = null;
  }
  loading = false;
  emit();
}

export function isLoading(): boolean {
  return loading;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
