const active = new Set<string>();

/**
 * Client-side concurrency guard only. It prevents double taps and overlapping
 * requests for the same mutation. It is deliberately NOT an economic authority;
 * server-side idempotency remains mandatory for retries after a network failure.
 */
export async function withMutationGate<T>(key: string, work: () => Promise<T>): Promise<T> {
  if (active.has(key)) throw new Error('Esta operación ya está en proceso. Espera la confirmación del servidor.');
  active.add(key);
  try {
    return await work();
  } finally {
    active.delete(key);
  }
}

export function isMutationActive(key: string) {
  return active.has(key);
}
