# Security & Code Review — securi-tee.com

July 23, 2026. Premortem + ponytail review of the full repo.

---

## Premortem: "It's 6 months from now. The site has failed."

### Failure 1: Tina API route leaks CORS to wildcard origin
**Likelihood:** MEDIUM **Danger:** HIGH

The route at `app/api/tina/[...path]/route.ts` sets `Access-Control-Allow-Origin: *` on every response (lines 37, 74, 88). Any website on the internet can make cross-origin requests to this proxy, which forwards to `identity.tinajs.io` with your `TINA_TOKEN` in the Authorization header.

The `ALLOWED_PATHS` set (`token`, `oauth/callback`, `auth`) limits the damage to those three paths. But wildcard CORS on those paths means a malicious site could initiate OAuth flows against your Tina project using your client ID.

**Fix:** Replace `*` with an origin allowlist. Three lines, no new dependency.

**Early warning:** Check Tina Cloud dashboard for unexpected OAuth callbacks or API calls from IPs that aren't yours.

### Failure 2: Admin page wrapper breaks and shows confusing error
**Likelihood:** MEDIUM **Danger:** LOW (cosmetic, embarrassing for a security portfolio)

`app/admin/page.tsx` is a custom 81-line wrapper that fetches `/admin/index.html`, shows a loading state, an error UI with debug instructions referencing the old Tina starter URL (`barebones-tinacms.vercel.app`), and an iframe. Tina builds its own admin panel at `/admin/index.html` on every `tinacms build`. This wrapper is leftover scaffolding that adds a network request, loading state, and an error screen for a file that only doesn't exist if the build failed (in which case the wrapper is the least of the problems).

**Fix:** Delete the file. Let Tina serve its own admin panel directly.

**Early warning:** Visit `/admin` after every deploy. If the iframe shows a blank page or the error state, the wrapper is in the way.

### Failure 3: Content change breaks the build and the site goes stale
**Likelihood:** MEDIUM **Danger:** MEDIUM

When editing content through Tina admin, Tina commits MDX files to the repo, which triggers a Vercel deploy. If a frontmatter field has bad data (invalid date string, malformed value), the build fails. The try/catch blocks in `blog/page.tsx` and `projects/page.tsx` handle this at the query level — they return empty arrays. The `blog/[slug]/page.tsx` dynamic route calls `client.queries.post()` which throws on a bad slug, and the catch returns `notFound()`. That's fine.

The real risk: you publish a new post through Tina, the build fails, and you don't notice because Vercel silently keeps the old deploy. The site doesn't crash, it just doesn't update. You think you published something and you didn't.

**Fix:** This is exactly what the planned CI test pipeline would catch — `test_routes.py` would assert that the new post URL returns 200.

**Early warning:** After publishing through Tina, check the Vercel deploy log and verify the new content is visible.

### Failure 4: Hero animation stalls and the page looks broken
**Likelihood:** LOW **Danger:** MEDIUM

The Hero has 223 lines of custom DOM manipulation with setTimeout chains, span creation, classList toggling, and GSAP scroll triggers. It has a `live` guard and a reduced-motion check, but it's doing a lot of manual DOM work that bypasses React's reconciliation. If a browser update changes how `textContent` or `replaceWith` behaves, or if React 19 changes how StrictMode double-runs effects, the animation could partially render and leave the page in a broken state — text that never finishes decoding, or the proof nav that never appears.

The noscript fallback handles the no-JS case. The reduced-motion check handles the accessibility case. But there's no fallback for "JS is running but the animation stalled halfway through." If `maxTime` is wrong and the proof/CTA reveal never fires, those elements stay at opacity 0 and the user sees a hero with no proof links and no contact button.

**Fix:** No code change needed now. The estimates are conservative (they overshoot rather than undershoot). Test in Safari and Firefox after any hero change, not just Chrome. This is a known residual risk, not a bug to fix today.

**Early warning:** Test in Safari and Firefox after any hero change. Test with dev tools network throttled.

### Failure 5: Featured-work query sorts wrong after a timezone edge case
**Likelihood:** LOW **Danger:** LOW

`featured-work.ts` sorts by `new Date(b.date || 0).getTime()`. The fallback `|| 0` handles empty dates by treating them as epoch (Jan 1 1970), which sorts them last. Not wrong, just potentially confusing if an item you featured appears at the bottom because you forgot the date.

**Fix:** No code change. Just always set a date on featured items.

**Early warning:** New featured items appearing at the bottom of the feed despite being recently published.

---

## Ponytail: the lazy senior dev review

### 1. app/api/tina/[...path]/route.ts — WILDCARD CORS IS A SECURITY BUG
**Severity: FIX NOW**

`Access-Control-Allow-Origin: *` on a proxy that forwards requests with your TINA_TOKEN. Replace with an origin allowlist. Also: the `error` variable in the catch blocks (lines 42, 79) is unused; use `(_err)` to match the rest of the codebase.

### 2. app/admin/page.tsx — DELETE THIS FILE
**Severity: FIX NOW**

81 lines of custom loading state, error UI, debug instructions, inline styles, and an iframe wrapper for a panel Tina already builds. References the old Tina starter URL. Delete and let Tina serve `/admin` directly.

### 3. tina/config.js — dead cloudinary comment block
**Severity: FIX NOW**

Lines 13-18 are a commented-out cloudinary media store config from the Tina starter. Four lines of dead code. Delete.

### 4. app/components/Hero.tsx — timing math is a guess (line 125)
**Status: LEAVE**

The `estTime` calculation uses magic numbers (15, 25) to approximate the stream-glitch duration. It overshoots rather than undershoots, so the proof section appears after the text finishes rather than during. Refactoring to use the actual `onDone` callback would mean threading callbacks through the dispatch loop. Not worth the diff.

### 5. app/blog/page.tsx and app/projects/page.tsx — eslint-disable any
**Status: LEAVE**

Three `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments because the files bypass Tina's generated types. The fallback pattern works. Fixing the types is a separate task that touches 4 files and doesn't change runtime behavior.

### 6. app/work/page.tsx — count helper slightly overbuilt
**Status: LEAVE**

The `count` async function wraps a try/catch and returns `{ length: 0 }` on failure. Used twice. A plain inline try/catch would save 4 lines. Not worth the diff.

### 7. RecentWorkFeed.tsx — proof field lost its bold formatting
**Status: LEAVE**

The old featured-work.tsx had JSX proof with `<b>5 vulns</b>`. The new version uses a plain string from frontmatter. This is actually the lazier (better) solution. The visual loss (no bold on "5 vulns") is minor. Adding string-splitting logic for a cosmetic detail is not worth it.

### 8. SiteHeader.tsx — focus trap is correct and complete
**Status: LEAVE**

The keyboard handler, focus restoration, `document.contains` guard, and media query listener are all necessary. Nothing to change.

### 9. ScrollReveal.tsx — clean
**Status: LEAVE**

Dynamic GSAP import, `ctx.revert()` cleanup, reduced-motion guard. All correct.

### 10. next.config.js — solid
**Status: LEAVE**

CSP definitions, negative lookahead, dev-only unsafe-eval, security headers. All correct. The strongest file in the repo.

---

## Fixes implemented

1. **CORS hardening** — `app/api/tina/[...path]/route.ts`: replaced `Access-Control-Allow-Origin: *` with an origin allowlist (`securi-tee.com`, `www.securi-tee.com`, `localhost:3000`). Unused `error` variables renamed to `_err`.

2. **Admin wrapper deleted** — `app/admin/page.tsx` removed. Tina serves its own admin panel at `/admin/index.html` directly. 81 lines of fragile wrapper gone.

3. **Dead code removed** — `tina/config.js`: deleted the commented-out cloudinary media store config (lines 13-18).

## Fixes deferred (not blocking)

- CI test pipeline (catches Failure 3 — silent deploy failures)
- Blog/projects page typing refactor (removing eslint-disable any)
- Hero timing refactor (use onDone callback instead of estimate — cosmetic)

## Environment variable cleanup (July 24, 2026)

### NEXT_PUBLIC_TINA_TOKEN fallback removed (code)

`tina/config.js` had a fallback chain: `process.env.TINA_TOKEN || process.env.NEXT_PUBLIC_TINA_TOKEN || "local"`. The `NEXT_PUBLIC_TINA_TOKEN` fallback was a trap: any env var prefixed with `NEXT_PUBLIC_` gets inlined into the client bundle and shipped to every browser. If `TINA_TOKEN` was ever unset and `NEXT_PUBLIC_TINA_TOKEN` was set, the read/write token would silently leak to the public.

Fix: removed the `NEXT_PUBLIC_TINA_TOKEN` fallback from both the token config (line 12) and the production warning check (line 30). Config now reads only `TINA_TOKEN` (server-side) and falls back to "local". Zero references to `NEXT_PUBLIC_TINA_TOKEN` remain in the repo.

Verified against TinaCMS docs (https://tina.io/docs/reference/config): `TINA_TOKEN` is documented as "Site build only — Read-only token for TinaCloud (not exposed in admin)." `NEXT_PUBLIC_TINA_TOKEN` is not a Tina-sanctioned variable and does not appear in their environment variables table.

### Vercel environment variable changes

Actions taken in Vercel dashboard:

1. **NEXT_PUBLIC_TINA_TOKEN** — DELETED from Vercel. Not a Tina-sanctioned variable. Would ship the read token to the browser if inlined. Dangerous regardless of code patch.

2. **TINA_TOKEN** — Marked as Sensitive in Vercel (clears the "Needs Attention" flag). Value is now masked in the dashboard, only exposed to builds. Also scoped to Production environment only, since the site deploys only from the main branch and preview deployments don't need Tina admin auth.

3. **TINA_VERCEL_TOKEN** — DELETED from Vercel. Dead variable: not referenced in repo code, not in Tina's docs, not a Vercel system variable (verified against https://vercel.com/docs/environment-variables/system-environment-variables), and no GitHub Actions workflow exists that would use it. Leftover from initial setup.

### Variables kept as-is

- `NEXT_PUBLIC_TINA_CLIENT_ID` — public by design (Tina docs: "Site + Admin"). Identifies the project, like a username. Keep in all environments.
- `NEXT_PUBLIC_TINA_BRANCH` — public value, tells Tina which git branch to use. Keep.
- `NEXT_PUBLIC_ORGANIZATION_NAME` — public display name. Keep.
- `NEXT_PUBLIC_SHOW_EDIT_BTN` — boolean toggle. Keep.
- `NEXT_PUBLIC_USE_LOCAL_CLIENT` — boolean toggle. Keep.

### Environment scoping note

`TINA_TOKEN` is now scoped to Production only. If preview deployments (non-main branch pushes) ever need the Tina admin panel to authenticate, `TINA_TOKEN` will need to be added to the Preview environment as well. The public vars (`NEXT_PUBLIC_TINA_CLIENT_ID`, `NEXT_PUBLIC_TINA_BRANCH`) remain in all environments since they're needed at build time regardless.

---

## Residual risk (named, accepted)

- Hero animation stalling in a specific browser edge case. Conservative timing estimates make this unlikely. Tested in Chrome; Safari/Firefox testing needed after any hero change.
- Featured items sorting to the bottom if date is missing. Mitigated by always setting a date on featured items.
- Preview deploys won't have Tina admin auth (TINA_TOKEN is Production-only). Accepted: site content still builds from local MDX files, only the admin editor is affected on preview URLs.
- CSP 'unsafe-inline' in script-src (next.config.js line 20). Removing it requires nonce-based CSP via middleware, which is a project-level change. Named as residual risk: no inline scripts are currently user-influenceable, but a security-conscious reviewer checking CSP headers would flag it. Address when you have an afternoon.
- Formspree form ID hardcoded in client bundle (contact/page.tsx line 16). Public by design. Fix is a Formspree dashboard setting: set allowed domains to securi-tee.com to block other sites from using the endpoint. No code change needed.
- Blog posts queried as .mdx, projects as .md (hardcoded extensions). If a .mdx project or .md blog post is created through Tina admin, the dynamic route will 404. All current content uses the correct extensions. Address if you start mixing formats.

---

## Second premortem + ponytail (July 24, 2026)

Full codebase re-read after the env var cleanup. Premortem surfaced 6 failure modes, ponytail triaged each file.

### Premortem (6 months from now, the site has failed)

**Failure 1: Formspree form ID is hardcoded in the client bundle**
Likelihood: LOW. Danger: MEDIUM.
The Formspree endpoint at `app/contact/page.tsx` line 16 is a public identifier by design. Anyone who reads the source can send spam through the form from any origin. Formspree has domain restrictions and rate limiting on their dashboard. Fix: configure allowed domains on Formspree, not code.
Early warning: spam through the contact form, or Formspree usage limits hit unexpectedly.
Status: DASHBOARD FIX (no code change).

**Failure 2: Tina API route builds URL with unvalidated NEXT_PUBLIC_TINA_CLIENT_ID**
Likelihood: LOW. Danger: HIGH (theoretically).
The API route at `app/api/tina/[...path]/route.ts` constructs the URL using `NEXT_PUBLIC_TINA_CLIENT_ID` without checking it's non-empty. If the env var is ever unset (misconfigured preview deploy), the URL becomes `https://identity.tinajs.io/v2/apps//token` which returns a 404. Not a security issue, but the error path doesn't explain why. The ALLOWED_PATHS validation on the path portion is correct and solid.
Early warning: Tina admin auth failing silently in any environment without NEXT_PUBLIC_TINA_CLIENT_ID.
Status: NAMED RESIDUAL (no fix needed, the failure mode is a 404 not a vulnerability).

**Failure 3: Contact form error handling used alert()**
Likelihood: MEDIUM. Danger: LOW (UX).
alert() blocks on mobile, behaves inconsistently across browsers, and is jarring on a polished site. No inline error display existed.
Early warning: users report the form "doesn't work" when it silently fails after the alert is dismissed.
Status: FIXED.

**Failure 4: ProjectFullscreenImage modal lacked keyboard accessibility**
Likelihood: MEDIUM. Danger: MEDIUM (WCAG gap on a security portfolio).
The component had no keyboard handler (Enter/Space to open, Escape to close), no focus trap, no ARIA attributes, no focus restoration. Keyboard users were stuck.
Early warning: any accessibility audit tool flags this component.
Status: FIXED (component deleted, was dead code not imported anywhere).

**Failure 5: Project content files use .md but blog uses .mdx (hardcoded extensions)**
Likelihood: LOW. Danger: LOW.
`app/projects/[slug]/page.tsx` line 23 hardcodes `.md`. `app/blog/[slug]/page.tsx` line 56 hardcodes `.mdx`. If someone creates a project as .mdx through Tina admin, the project route 404s. All current content uses the correct extension.
Early warning: a project created through Tina admin doesn't render.
Status: NAMED RESIDUAL (address if you start mixing formats).

**Failure 6: No CSP nonce on inline scripts (unsafe-inline in script-src)**
Likelihood: MEDIUM. Danger: MEDIUM (CSP weakening on a security portfolio).
`next.config.js` line 20 has `'unsafe-inline'` in script-src for the main site CSP. This defeats the XSS protection CSP provides for scripts. The admin CSP needs it (Tina's SPA uses inline scripts), but the main site could use nonces. Fixing it requires middleware-generated nonces, which is a project-level change.
Early warning: a security reviewer or recruiter checks CSP headers and flags 'unsafe-inline'.
Status: NAMED RESIDUAL (address when you have an afternoon).

### Ponytail (the lazy senior dev review)

1. **app/api/tina/[...path]/route.ts** — GET and POST are 90% duplicated. A shared helper would halve the file. But 104 lines is manageable, the duplication is obvious, and adding an abstraction adds indirection. LEAVE.

2. **app/projects/[slug]/ProjectFullscreenImage.tsx** — 52 lines of dead code, not imported anywhere, with an accessibility gap. DELETED.

3. **app/contact/page.tsx — alert() for errors** — Replaced with inline error state (`showError`), same pattern as `showThankYou`. 5 lines, no new dependencies. FIXED.

4. **app/contact/page.tsx — hardcoded Formspree ID** — Public by design, same as NEXT_PUBLIC_TINA_CLIENT_ID. Moving to env var doesn't add security. Fix is on Formspree dashboard (domain restrictions). LEAVE.

5. **app/lib/featured-work.ts — FALLBACK_TRACK default** — Items without track get "tooling". Reasonable default, surfacing is better than hiding. LEAVE.

6. **next.config.js — 'unsafe-inline' in script-src** — Real but project-level fix (nonce middleware). Named as residual risk. LEAVE FOR NOW.

7. **app/blog/page.tsx and app/projects/page.tsx — eslint-disable any** — Same call as first review. Works, not worth the diff until a typing pass. LEAVE.

8. **app/work/page.tsx — count helper** — Still slightly overbuilt, still not worth the diff. LEAVE.

9. **app/blog/[slug]/page.tsx — .mdx hardcode** — Matches all current blog content. LEAVE.

### Fixes implemented (second pass)

1. **ProjectFullscreenImage.tsx deleted** — 52 lines of dead code removed. Component was not imported anywhere. Accessibility gap eliminated with it.

2. **Contact form alert() replaced** — `app/contact/page.tsx`: added `showError` state, inline error display with `role="alert"` for screen readers. No more native browser dialog.

### Fixes deferred (second pass)

- CSP nonce-based script-src (Failure 6 — project-level middleware change)
- Formspree domain restrictions (Failure 1 — Formspree dashboard, not code)
- Blog/projects extension consistency (Failure 5 — address if formats ever mix)
