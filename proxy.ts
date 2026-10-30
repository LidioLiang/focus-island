import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getClaims();
  }

  response.headers.set("x-request-id", requestId);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob: https://*.supabase.co https://*.paddle.com; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.paddle.com https://challenges.cloudflare.com; script-src 'self' 'unsafe-inline' https://*.paddle.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; frame-src https://*.paddle.com https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.paddle.com");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
