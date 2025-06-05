import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Please POST credentials to log in.' }, { status: 200 });
}

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;
  // Dummy authentication logic
  if (email === 'test@example.com' && password === 'password123') {
    return NextResponse.json({ message: 'Logged in successfully', user: { email } }, { status: 200 });
  }
  return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
}

export function PUT() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
} 