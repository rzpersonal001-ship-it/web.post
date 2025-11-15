import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      message:
        'This endpoint is deprecated. The scheduler now runs as a standalone script using "npm run scheduler".',
    },
    { status: 404 }
  );
}
