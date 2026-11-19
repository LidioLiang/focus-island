import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { websiteDestination } from "./lib/marketing-routes";

export async function proxy(request: NextRequest) {
  const destination = websiteDestination(request.nextUrl);
  if (destination.redirect) {
    const redirect = NextResponse.redirect(new URL(destination.redirect, request.url), 307);
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("Referrer-Policy", "no-referrer");
    return redirect;
  }
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const createResponse = () => {
    if (!destination.rewrite) return NextResponse.next({ request: { headers: requestHeaders } });
    const target = request.nextUrl.clone();
    target.pathname = destination.rewrite;
    return NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  };
  let response = createResponse();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // API handlers validate their own users and can refresh cookies themselves.
  // Public images, scripts and audio must never wait on a remote Auth request.
  const pageRequest = destination.app === true;
  const hasAuthCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  if (pageRequest && hasAuthCookie && supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = createResponse();
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getClaims();
  }

  response.headers.set("x-request-id", requestId);
  if (destination.app) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  const developmentScriptDirective = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  response.headers.set("Content-Security-Policy", `default-src 'self'; img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://avatars.githubusercontent.com; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://us.i.posthog.com; script-src 'self' 'unsafe-inline'${developmentScriptDirective} https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
