import { NextResponse } from 'next/server';
import { createToken, checkCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!checkCredentials(email, password)) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
  }

  const token = await createToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
