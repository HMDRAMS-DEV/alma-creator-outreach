// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from './src/lib/session';

const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'alma-creator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/login') || // Allow login API route
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Protect API routes other than login
  if (pathname.startsWith('/api/')) {
    if (!session.isLoggedIn) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
