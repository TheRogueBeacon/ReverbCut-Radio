export async function onRequest() {
  try {
    const res = await fetch("https://groundzero.elcodexlabs.com/icecast/status", {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ count: null, error: "upstream_error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await res.json();

    const count =
      data?.icestats?.source?.listeners ??
      data?.icestats?.listeners ??
      null;

    return new Response(JSON.stringify({ count }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ count: null, error: "fetch_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
