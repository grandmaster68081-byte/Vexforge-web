// Launch-only reference validator. Kivora does not sign or custody keys.
// TRON Base58Check format is used for TRON/USDT destinations.
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function isTronBase58Shape(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

export async function isValidTronBase58Check(address: string): Promise<boolean> {
  if (!isTronBase58Shape(address)) return false;
  let n = 0n;
  for (const char of address) {
    const index = BASE58.indexOf(char);
    if (index < 0) return false;
    n = n * 58n + BigInt(index);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let bytes = hex.match(/.{2}/g)?.map((x) => Number.parseInt(x, 16)) ?? [];
  const leadingZeros = address.match(/^1+/)?.[0].length ?? 0;
  if (leadingZeros) bytes = [...new Array(leadingZeros).fill(0), ...bytes];
  if (bytes.length !== 25 || bytes[0] !== 0x41) return false;
  const payload = new Uint8Array(bytes.slice(0, 21));
  const checksum = new Uint8Array(bytes.slice(21));
  const digest1 = await crypto.subtle.digest('SHA-256', payload);
  const digest2 = await crypto.subtle.digest('SHA-256', digest1);
  const expected = new Uint8Array(digest2).slice(0, 4);
  return checksum.every((value, index) => value === expected[index]);
}
