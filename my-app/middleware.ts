import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ecodash_admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'waste-management-super-secret-key-2025'
    );
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return NextResponse.next();
  } catch {
    // Token expired, tampered, or invalid — force re-login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('ecodash_admin_token');
    return response;
  }
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
