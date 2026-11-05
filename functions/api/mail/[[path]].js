
export async function onRequest({ request, params }) {
  const path = Array.isArray(params.path)
    ? params.path.join('/')
    : (params.path || '');

  const method = request.method.toUpperCase();

  const allowed =
    (method === 'GET' &&
      (path === 'domains' ||
       path === 'messages' ||
       /^messages\/[a-zA-Z0-9-]+$/.test(path))) ||
    (method === 'POST' &&
      (path === 'accounts' || path === 'token')) ||
    (method === 'DELETE' &&
      /^accounts\/[a-zA-Z0-9-]+$/.test(path));

  if (!allowed) {
    return Response.json(
      { message: 'Rota não permitida' },
      { status: 404 }
    );
  }

  const headers = new Headers({
    Accept: 'application/json'
  });

  const authorization = request.headers.get('Authorization');

  if (authorization &&
      /^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)) {
    headers.set('Authorization', authorization);
  }

  if (method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(
      'https://api.mail.tm/' + path,
      {
        method,
        headers,
        body: method === 'POST'
          ? await request.text()
          : undefined,
        redirect: 'manual'
      }
    );

    if (response.status === 429) {
      return Response.json(
        {
          message: 'Mail.tm retornou erro 429: limite de requisições atingido.',
          origin: 'mail.tm',
          retryAfter: response.headers.get('Retry-After')
        },
        {
          status: 429,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    const outputHeaders = new Headers({
      'Content-Type':
        response.headers.get('Content-Type') ||
        'application/json',
      'Cache-Control': 'no-store'
    });

    return new Response(response.body, {
      status: response.status,
      headers: outputHeaders
    });

  } catch (error) {
    return Response.json(
      {
        message: 'Falha de comunicação com a API Mail.tm.',
        origin: 'cloudflare-function'
      },
      { status: 502 }
    );
  }
}
