
export async function onRequestGet() {
  const url = new URL("https://api.guerrillamail.com/ajax.php");

  url.searchParams.set("f", "get_email_address");
  url.searchParams.set("lang", "en");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return Response.json({
        ok: false,
        status: response.status,
        message: "Provedor recusou a solicitação"
      }, { status: 502 });
    }

    const data = await response.json();

    return Response.json({
      ok: Boolean(data.email_addr && data.sid_token),
      address: data.email_addr || null,
      sessionAvailable: Boolean(data.sid_token)
    });

  } catch (error) {
    return Response.json({
      ok: false,
      message: "Falha de comunicação com o provedor"
    }, { status: 502 });
  }
}
