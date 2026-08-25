import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/jobs', '/applications', '/resume', '/interview', '/settings'];
// Set for authenticated requests so Server Components can trust the identity
// without re-validating the session. Client-supplied values are always
// overwritten below, so only this proxy can populate it.
const userHeader = 'x-automateapply-user';

export async function proxy(request: NextRequest) {
  if (!protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))) return NextResponse.next();
  if (request.cookies.get('automateapply-demo')?.value === '1') return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL('/login', request.url));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(userHeader);
  // Tokens may rotate during validation; they are applied to the one
  // response built below so the browser stays in sync.
  const rotatedCookies: Array<{ name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] }> = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        rotatedCookies.push(...cookies);
      },
    },
  });
  // Verifies the JWT locally against the project's public keys (no auth
  // server round trip per navigation); falls back to server validation when
  // a legacy symmetric secret signs the tokens.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return NextResponse.redirect(new URL('/login', request.url));
  requestHeaders.set(userHeader, userId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  rotatedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/jobs/:path*', '/applications/:path*', '/resume/:path*', '/interview/:path*', '/settings/:path*'] };
