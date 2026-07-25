# Security Review — securi-tee.com

Current state as of July 24, 2026. Documents the security posture, what's been done, and what's deferred.

---

## What's been done

1. **CORS hardened** — `app/api/tina/[...path]/route.ts`: wildcard `Access-Control-Allow-Origin: *` replaced with an origin allowlist (securi-tee.com, www.securi-tee.com, localhost:3000). Untrusted origins are rejected.

2. **Admin route fixed** — Old 81-line iframe wrapper deleted. Tina serves its own admin at `/admin/index.html`. A rewrite in `next.config.js` maps `/admin` -> `/admin/index.html` so the bare URL works without a custom page.

3. **Dead code removed** — Cloudinary comment block in `tina/config.js`, `ProjectFullscreenImage.tsx` (52 lines, never imported, accessibility gap), and the `NEXT_PUBLIC_TINA_TOKEN` fallback chain in `tina/config.js`.

4. **Environment variables cleaned** — `NEXT_PUBLIC_TINA_TOKEN` deleted from Vercel (would have leaked the read token to browser bundles). `TINA_VERCEL_TOKEN` deleted (dead variable, no code or workflow referenced it). `TINA_TOKEN` marked Sensitive in Vercel and scoped to Production. Verified against TinaCMS docs (https://tina.io/docs/reference/config) and Vercel docs (https://vercel.com/docs/environment-variables/system-environment-variables).

4. **Contact form fixed** — `alert()` replaced with inline error state and `role="alert"` for screen readers.

5. **CI pipeline added** — `scripts/ci-test.py` with 8 checks: typecheck, route status codes, ESLint, security headers, CORS round-trip (evil origin rejected, real origin accepted), admin panel existence, blog auto-discovery, dead link crawler. GitHub Actions workflow at `.github/workflows/ci-test.yml`.

6. **Code copy pass** — hero, pillars, about, contact, work, and /about deep-dive rewritten. Track labels updated. Tag lists reflect actual demonstrated skills.

## Current env vars (Vercel)

| Variable | Scope | Sensitive | Status |
|---|---|---|---|
| `NEXT_PUBLIC_TINA_CLIENT_ID` | All Environments | No | Public by design. Tina project identifier. |
| `TINA_TOKEN` | Production only | Yes | Server-side read token. Not exposed in admin. |
| `NEXT_PUBLIC_TINA_BRANCH` | All Environments | No | Public value. Git branch for content. |
| `NEXT_PUBLIC_ORGANIZATION_NAME` | All Environments | No | Public display name. |
| `NEXT_PUBLIC_SHOW_EDIT_BTN` | All Environments | No | Boolean toggle. |
| `NEXT_PUBLIC_USE_LOCAL_CLIENT` | All Environments | No | Boolean toggle. |

Deleted: `NEXT_PUBLIC_TINA_TOKEN` (browser leak risk), `TINA_VERCEL_TOKEN` (dead, no code or workflow used it).

Note: `TINA_TOKEN` is Production-only. If preview deploys ever need Tina admin auth, add it to the Preview environment. Site content still builds from local MDX files on preview, only the admin editor is affected.

## Deferred (not blocking, no active risk)

- **CSP nonce-based script-src** — `next.config.js` has `'unsafe-inline'` in script-src for the main site. Removing it requires middleware-generated nonces per request, which is a project-level change. No inline scripts are currently user-influenceable. A security reviewer checking headers would flag it. Address when you have an afternoon.

- **Formspree domain restrictions** — The Formspree endpoint ID is hardcoded in `contact/page.tsx`. It's public by design (the client needs it to submit). Fix is on the Formspree dashboard: set allowed domains to securi-tee.com to block other sites from using the endpoint. No code change.

- **Blog/projects extension consistency** — Blog dynamic route hardcodes `.mdx`, projects hardcode `.md`. If a .mdx project or .md blog post is created through Tina admin, the route 404s. All current content uses the correct extensions. Address if formats ever mix.

## Residual risk (named, accepted)

- Hero animation stalling in a specific browser edge case. Conservative timing estimates make this unlikely. Tested in Chrome; Safari/Firefox testing needed after any hero change.
- Featured items sorting to the bottom if date is missing. Mitigated by always setting a date on featured items.
- Preview deploys won't have Tina admin auth (`TINA_TOKEN` is Production-only). Accepted: site content still builds from local MDX files, only the admin editor is affected on preview URLs.
- CSP `'unsafe-inline'` in script-src (see Deferred). No active vulnerability, but flagged by security reviewers.
