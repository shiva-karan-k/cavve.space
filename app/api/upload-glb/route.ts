import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'the_batcave.glb';

  if (!request.body) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return NextResponse.json(blob);
}

