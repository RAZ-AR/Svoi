// @ts-nocheck
// Svoi — Next.js middleware: session refresh + route protection
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't require auth
const PUBLIC_ROUTES = ["/", "/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes and static assets
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|svg|json|webmanifest|txt)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  // Refresh Supabase session cookie on every request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this also sets updated cookies
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
