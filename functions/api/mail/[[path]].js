export async function onRequest({ request, params }) {
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const method = request.method.toUpperCase();
  const allowed = (method === 'GET' && (path === 'domains' || path === 'messages' || /^messages\/[a-zA-Z0-9-]+$/.test(path))) ||
    (method === 'POST' && (path === 'accounts' || path === 'token')) ||
    (method === 'DELETE' && /^accounts\/[a-zA-Z0-9-]+$/.test(path));
  if (!allowed) return Response.json({ message: 'Rota não permitida' }, { status: 404 });
  const headers = new Headers({ Accept: 'application/json' });
  const authorization = request.headers.get('Authorization');
  if (authorization && /^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)) headers.set('Authorization', authorization);
  const contentType = request.headers.get('Content-Type');
  if (contentType?.startsWith('application/json')) headers.set('Content-Type', 'application/json');
  try {
    const response = await fetch('https://api.mail.tm/' + path, {
      method,
      headers,
      body: method === 'POST' ? await request.text() : undefined,
      redirect: 'manual'
    });
    const out = new Headers({ 'Content-Type': response.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store' });
    return new Response(response.body, { status: response.status, headers: out });
  } catch (error) {
    return Response.json({ message: 'Não foi possível acessar o Mail.tm pelo servidor.' }, { status: 502 });
  }
}
