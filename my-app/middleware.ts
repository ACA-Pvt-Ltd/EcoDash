import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page through
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ecodash_admin_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/collectors/:path*',
    '/vendors/:path*',
    '/transactions/:path*',
    '/config/:path*',
    '/(admin)/:path*',
  ],
};
