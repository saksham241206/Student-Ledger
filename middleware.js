import { next } from "@vercel/edge";

export const config = {
  matcher: "/:path*",
};

export default function middleware(request) {
  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader) {
    const basicAuth = authorizationHeader.split(" ")[1];
    const [user, password] = atob(basicAuth).split(":");

    if (user === process.env.LEDGER_USER && password === process.env.LEDGER_PASSWORD) {
      return next();
    }
  }

  return new Response("Password required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Student Ledger"',
    },
  });
}
