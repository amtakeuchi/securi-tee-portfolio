/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'assets.tina.io',
      },
    ],
  },
  async rewrites() {
    // Tina's static admin panel lives at /admin/index.html (public/admin/index.html,
    // rebuilt by `tinacms build`). There's no app/admin page, so without this the
    // bare /admin URL 404s.
    return [{ source: '/admin', destination: '/admin/index.html' }];
  },
  async headers() {
    // React fast-refresh / HMR needs 'unsafe-eval' in `next dev`; production stays strict (no eval).
    const devEval = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";
    const mainSiteCsp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${devEval} https://static.cloudflareinsights.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://assets.tina.io",
      "font-src 'self'",
      "connect-src 'self' https://formspree.io",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://formspree.io",
    ].join('; ');

    const adminCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://assets.tina.io",
      "font-src 'self' data:",
      "connect-src 'self' https://*.tinajs.io https://app.tina.io https://assets.tina.io https://s3.us-east-1.amazonaws.com",
      "frame-src 'self' https://app.tina.io",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    return [
      {
        // All routes except /admin* get the strict main-site policy.
        // Using a negative lookahead regex so Next.js doesn't stack both
        // CSP headers on admin routes (browsers enforce all received CSPs).
        source: '/((?!admin).*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: mainSiteCsp,
          },
        ],
      },
      {
        source: '/admin(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: adminCsp,
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://app.tina.io',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
