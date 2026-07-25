# securi-tee

Personal portfolio and blog for Adam Takeuchi, cybersecurity analyst.

Live at [securi-tee.com](https://securi-tee.com).

## Stack

- Next.js 14 (App Router, TypeScript)
- TinaCMS: git-backed headless CMS, content lives as MDX in this repo
- GSAP for scroll reveal, dynamically imported so it never blocks the first paint
- Vercel (deploy, security headers)
- No database, no custom auth backend: content is files, admin auth is Tina Cloud OAuth

## Project structure

```
app/
  components/       Hero, ScrollReveal, RecentWorkFeed, SiteHeader
  lib/              featured-work.ts: queries Tina for the homepage highlight cards
  about/            Full "about" deep-dive page
  blog/             Blog list + dynamic post routes
  projects/         Project list + dynamic project routes
  contact/          Contact form (Formspree)
  work/             Full work archive (blog + projects on one page)
  layout.tsx        Root layout, fonts, meta, noscript fallback, footer
  page.tsx          Home page: hero, pillars, recent work, about, contact
  globals.css       All styles, single file, no CSS modules
content/
  page/             Static page content (about, home)
  post/             Blog posts as .mdx
  projects/         Project writeups as .mdx
tina/
  config.js         Tina schema config (clientId, branch, token, media)
  collections/      Schema definitions: page.js, post.js, project.js
  __generated__/    Tina-generated types and client (auto, don't edit)
next.config.js      CSP, security headers, image domains, dev/prod header split
```

## Content model

Three Tina collections, all git-backed. Schema fields for each live in `tina/collections/`.

| Collection | Path              | Contents                        |
|------------|-------------------|----------------------------------|
| page       | content/page/     | Static page content (about, home) |
| post       | content/post/     | Blog posts (MDX)                  |
| project    | content/projects/ | Project writeups (MD)             |

Posts and projects can be marked `featured` with a `track` (offense/defense/etc), `proof` line, and optional `cardTitle`, which is how the homepage's highlight cards pull in.

## Security

This site has been self-audited; see the writeup linked from the home page. Current state documented in `SECURITY-REVIEW.md`.

**CSP**: `next.config.js` defines two policies, a strict one for the main site (no `unsafe-eval`, `object-src 'none'`, `form-action` limited to self + Formspree) and a relaxed one scoped only to Tina's editor routes.

**Headers**: all routes send HSTS (2 years, includeSubDomains), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` that disables camera/mic/geolocation.

**Dev vs. production**: `next dev` allows `unsafe-eval` in the CSP for React Fast Refresh. Production builds drop it.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env` with:

```
NEXT_PUBLIC_TINA_CLIENT_ID=<from app.tina.io>
TINA_TOKEN=<from app.tina.io>
NEXT_PUBLIC_TINA_BRANCH=<your branch, optional, falls back to the Vercel git branch, then "main">
```

### Building without Tina Cloud

```bash
pnpm build-local
```

Builds with `--local --skip-indexing --skip-cloud-checks`, useful offline or in CI without Tina Cloud access.

## Deployment

Vercel, deploying on push to `main`. The Tina Cloud branch is read from `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF` (Vercel's git-branch env var), falling back to `main`.

## Notes

- All styles live in `app/globals.css`: no CSS modules, no Tailwind.
- The hero's text-scramble effect (`app/components/Hero.tsx`) is hand-rolled, not a library. `streamGlitch` scrambles each character through random glyphs before locking it in, and returns a cancel function so pending timeouts get cleared on unmount.
- `prefers-reduced-motion` is respected everywhere; every animation has a static fallback.
- The `<noscript>` block in `layout.tsx` forces scroll-reveal elements visible so content works without JavaScript.
