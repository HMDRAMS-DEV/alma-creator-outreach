// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';

const sessionOptions = {
  password: process.env.LOGIN_PASSWORD as string,
  cookieName: 'alma-creator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === process.env.LOGIN_PASSWORD) {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.isLoggedIn = true;
    await session.save();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}