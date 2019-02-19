import { proxy, normalizeRequest } from "@fly/cdn";
import * as jwt_decode from "jwt-decode";

const origin = proxy("https://github.com", { headers: { host: "github.com" } });

fly.http.respondWith(async (req: RequestInfo) => {
  req = normalizeRequest(req);
  const url = new URL(req.url);

  // only show the auth ui if the client is a browser
  const apiRequest = isApiRequest(req);

  if (url.pathname.startsWith("/auth/callback")) {
    return handleAuthCallback(req);
  }
  if (url.pathname.startsWith("/auth")) {
    return await handleAuthUI();
  }

  const session = getSession(req);

  if (session) {
    // call protected endpoint if authenticated. This example isn't validating the token so 
    // any valid jwt will pass here. Either perform validation in the edge app or pass the 
    // token to the origin to perform validation. (probably a good idea anyway)
    return await origin(req);
  }

  // if this is an api return a 401, otherwise redirect to the auth ui
  if (!apiRequest) {
    return redirectToAuth();
  } else {
    return new Response("Unauthorized", { status: 401 });
  }
});

function getSession(req: Request): {} | null {
  const token = getAuthorizationToken(req);

  // this just checks that a jwt is present and can be decoded. Validating
  // the token against a pk would be good. Would also be good to validate the 
  // expiration. 

  if (token) {
    try {
      return jwt_decode(token);
    } catch (err) {
      console.warn("Error decoding token", err);
    }
  }

  return null;
}

function getAuthorizationToken(req: Request): string | null {
  if (req.headers.has("authorization")) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(6).trim();
    }
  }

  const cookie = (req as any).cookies.get("session_token");
  if (cookie && cookie.value) {
    return cookie.value
  }

  return null;
}

async function handleAuthCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Invalid code", { status: 401 });
  }
  
  const domain = app.config.domain;
  const tokenResp = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      code,
      client_id: app.config.clientID,
      client_secret: app.config.secret,
      audience: app.config.audience,
      grant_type: "authorization_code",
      redirect_uri: req.url,
    })
  })

  if (!tokenResp.ok) {
    console.warn("Error obtaining auth token", await tokenResp.text());
    return redirectToAuth();
  }

  const payload = await tokenResp.json();

  if (!payload.id_token) {
    console.warn("Response did not contain an id_token");
    return redirectToAuth();
  }

  return new Response("Redirecting...", {
    status: 302,
    headers: {
      location: "/",
      "Set-Cookie": `session_token=${payload.id_token}; HttpOnly; Path=/`
    }
  });
}

function redirectToAuth() {
  return new Response("", {
    status: 302,
    headers: {
      location: "/auth"
    }
  })
}

function isApiRequest(req: Request): boolean {
  if (req.headers.get("Authorization")) {
    return true;
  }

  const accept = req.headers.get("Accept") || "";

  return !accept.includes("html");
}

async function handleAuthUI() {
  const resp = await fetch("file://static/index.html");
  console.log(resp);
  let body = await resp.text();

  const { callbackURL, clientID, domain } = app.config;
  
  const configData = btoa(JSON.stringify({ callbackURL, clientID, auth0Domain: domain }));
  body = body.replace("@@config@@", configData);
  return new Response(body);
}

declare var Buffer: any;

// nodeproxy runtime doesn't define atob or btoa ;(
// will be fixed in rustproxy
function btoa(value: string): string {
  return (Buffer as any).from(value).toString("base64");
}
