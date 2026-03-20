import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(req) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect unauthenticated users to login
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from login
  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect root to dashboard or login
  if (req.nextUrl.pathname === "/") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
