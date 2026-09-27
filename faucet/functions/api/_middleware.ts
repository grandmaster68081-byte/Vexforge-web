import { json } from './_lib/response';

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  let res: Response;

  try {
    res = await next();
  } catch (cause) {
    console.error('Kivora request failed', {
      method: request.method,
      path: url.pathname,
      error: cause instanceof Error ? cause.message : String(cause),
    });
    res = url.pathname.startsWith('/api/')
      ? json('Kivora services are temporarily unavailable. Please try again later.', 503)
      : new Response('Internal Server Error', { status: 500 });
  }

  const headers = new Headers(res.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(),microphone=(),geolocation=(),payment=()');
  headers.set('cache-control', 'no-store');
  if (url.pathname.startsWith('/api/')) {
    headers.set('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};
