export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  new Headers(extraHeaders).forEach((value, key) => headers.append(key, value));
  return new Response(JSON.stringify(status >= 400 ? { ok: false, error: data } : { ok: true, data }), { status, headers });
}

export function error(message: string, status = 400) { return json(message, status); }
