import { next } from "@vercel/edge";

const COOKIE_NAME = "ledger_auth";
const SESSION_HOURS = 24 * 7;

async function sign(value, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  const bytes = new Uint8Array(sigBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function makeToken(secret) {
  const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiry);
  const sig = await sign(payload, secret);
  return payload + "." + sig;
}

async function verifyToken(token, secret) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = await sign(payload, secret);
  if (expected !== sig) return false;
  return Number(payload) > Date.now();
}

function parseCookie(header, name) {
  if (!header) return null;
  const match = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function cookieHeaderValue(token, maxAgeSeconds) {
  return COOKIE_NAME + "=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" + maxAgeSeconds;
}

async function handleLogin(request, secret) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const username = body && body.username;
  const password = body && body.password;

  if (username === process.env.LEDGER_USER && password === process.env.LEDGER_PASSWORD) {
    const token = await makeToken(secret);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeaderValue(token, SESSION_HOURS * 3600),
      },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: "Incorrect username or password" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function handleLogout() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login.html",
      "Set-Cookie": COOKIE_NAME + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    },
  });
}

export const config = {
  matcher: "/:path*",
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const secret = process.env.LEDGER_SECRET;

  if (url.pathname === "/api/login" && request.method === "POST") {
    return handleLogin(request, secret);
  }
  if (url.pathname === "/api/logout") {
    return handleLogout();
  }
  if (url.pathname === "/login.html") {
    return next();
  }

  const cookieHeader = request.headers.get("cookie");
  const token = parseCookie(cookieHeader, COOKIE_NAME);
  const valid = secret ? await verifyToken(token, secret) : false;

  if (valid) return next();

  return Response.redirect(new URL("/login.html", request.url), 302);
}