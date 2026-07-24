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

## Residual risk (named, accepted)

- Hero animation stalling in a specific browser edge case. Conservative timing estimates make this unlikely. Tested in Chrome; Safari/Firefox testing needed after any hero change.
- Featured items sorting to the bottom if date is missing. Mitigated by always setting a date on featured items.
