import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_PATHS = new Set([
  'token',
  'oauth/callback',
  'auth',
]);

// Production origins are always allowed. localhost is dev-only (vuln-0015 #4) so a prod
// deployment never reflects a loopback origin.
const ALLOWED_ORIGINS = [
  'https://www.securi-tee.com',
  'https://securi-tee.com',
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
];

const CORS_METHODS = 'GET, POST, OPTIONS';
const CORS_HEADERS = 'Content-Type, Authorization';

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATHS.has(path);
}

function corsOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return 'https://www.securi-tee.com';
}

function corsHeaders(request: NextRequest): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(request),
    'Access-Control-Allow-Methods': CORS_METHODS,
    'Access-Control-Allow-Headers': CORS_HEADERS,
  };
}

// vuln-0015: never attach the server-side TINA_TOKEN on behalf of an anonymous caller.
// Forward only the caller's own Authorization header (Tina's identity API authenticates
// per-user), so this route cannot be abused to spend the server credential's quota.
function upstreamHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
}

function upstreamUrl(path: string): string {
  return `https://identity.tinajs.io/v2/apps/${process.env.NEXT_PUBLIC_TINA_CLIENT_ID}/${path}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders(request) });
  }
  try {
    const response = await fetch(upstreamUrl(path), { headers: upstreamHeaders(request) });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: corsHeaders(request) });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to fetch from TinaCMS' }, { status: 502, headers: corsHeaders(request) });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders(request) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (_err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(request) });
  }

  try {
    const response = await fetch(upstreamUrl(path), {
      method: 'POST',
      headers: upstreamHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: corsHeaders(request) });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to fetch from TinaCMS' }, { status: 502, headers: corsHeaders(request) });
  }
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  if (!isAllowedPath(path)) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}
