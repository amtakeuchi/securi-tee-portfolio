import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_PATHS = new Set([
  'token',
  'oauth/callback',
  'auth',
]);

const ALLOWED_ORIGINS = [
  'https://www.securi-tee.com',
  'https://securi-tee.com',
  'http://localhost:3000',
];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.has(path);
}

function corsOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return 'https://www.securi-tee.com';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = `https://identity.tinajs.io/v2/apps/${process.env.NEXT_PUBLIC_TINA_CLIENT_ID}/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.TINA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': corsOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to fetch from TinaCMS' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = `https://identity.tinajs.io/v2/apps/${process.env.NEXT_PUBLIC_TINA_CLIENT_ID}/${path}`;
  const body = await request.json();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TINA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': corsOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to fetch from TinaCMS' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin(request),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 