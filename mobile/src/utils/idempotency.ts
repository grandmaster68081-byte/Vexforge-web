export function createIdempotencyKey(prefix = 'expo-battle'): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}:${stamp}:${random}`;
}
