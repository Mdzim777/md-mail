
export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return Response.json(
      { message: "Método não permitido" },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action;

    const allowed = [
      "get_email_address",
      "check_email",
      "fetch_email"
    ];

    if (!allowed.includes(action)) {
      return Response.json(
        { message: "Ação inválida" },
        { status: 400 }
      );
    }

    const url = new URL(
      "https://api.guerrillamail.com/ajax.php"
    );

    url.searchParams.set("f", action);
    url.searchParams.set("lang", "en");

    if (action !== "get_email_address") {
      if (
        typeof body.sid_token !== "string" ||
        !/^[a-zA-Z0-9._-]{1,256}$/.test(body.sid_token)
      ) {
        return Response.json(
          { message: "Sessão inválida" },
          { status: 400 }
        );
      }

      url.searchParams.set("sid_token", body.sid_token);
    }

    if (action === "check_email") {
      url.searchParams.set("seq", "0");
    }

    if (action === "fetch_email") {
      if (!/^\d+$/.test(String(body.email_id))) {
        return Response.json(
          { message: "ID inválido" },
          { status: 400 }
        );
      }

      url.searchParams.set(
        "email_id",
        String(body.email_id)
      );
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return Response.json(
        {
          message: "Guerrilla Mail retornou erro " +
            response.status
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    return Response.json(data, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error) {
    return Response.json(
      { message: "Falha ao consultar Guerrilla Mail" },
      { status: 502 }
    );
  }
}
