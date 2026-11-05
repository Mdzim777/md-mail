
const BASE = "https://api.guerrillamail.com/ajax.php";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return json({ message: "Método não permitido" }, 405);
  }

  try {
    const body = await request.json();
    const action = body.action;

    const allowed = [
      "get_email_address",
      "get_email_list",
      "check_email",
      "fetch_email"
    ];

    if (!allowed.includes(action)) {
      return json({ message: "Ação inválida" }, 400);
    }

    const url = new URL(BASE);
    url.searchParams.set("f", action);
    url.searchParams.set("lang", "en");

    const headers = new Headers({
      Accept: "application/json"
    });

    if (action !== "get_email_address") {
      if (
        typeof body.sid_token !== "string" ||
        !/^[A-Za-z0-9._~-]{1,256}$/.test(body.sid_token)
      ) {
        return json({ message: "Sessão inválida" }, 400);
      }

      url.searchParams.set("sid_token", body.sid_token);
    }

    // Mantém o cookie de sessão do provedor.
    if (body.sessionCookie) {
      if (
        typeof body.sessionCookie !== "string" ||
        !/^[A-Za-z0-9,-]{1,256}$/.test(body.sessionCookie)
      ) {
        return json({ message: "Cookie inválido" }, 400);
      }

      headers.set(
        "Cookie",
        "PHPSESSID=" + body.sessionCookie
      );
    }

    if (action === "get_email_list") {
      url.searchParams.set("offset", "0");
    }

    if (action === "check_email") {
      url.searchParams.set("seq", "0");
    }

    if (action === "fetch_email") {
      if (!/^\d{1,20}$/.test(String(body.email_id))) {
        return json({ message: "ID inválido" }, 400);
      }

      url.searchParams.set(
        "email_id",
        String(body.email_id)
      );
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      redirect: "manual"
    });

    if (!response.ok) {
      return json({
        message: "Guerrilla Mail retornou HTTP " +
          response.status
      }, 502);
    }

    const data = await response.json();

    // Recupera o identificador de sessão atualizado.
    const setCookie =
      response.headers.get("set-cookie") || "";

    const match = setCookie.match(
      /(?:^|,\s*)PHPSESSID=([^;\s,]+)/
    );

    if (match) {
      data.md_session_cookie = match[1];
    }

    return json(data);

  } catch (error) {
    return json({
      message: "Falha ao consultar o Guerrilla Mail"
    }, 502);
  }
}
