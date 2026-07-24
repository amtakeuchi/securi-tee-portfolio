# CI Test Pipeline — How It Works and How to Use It

July 24, 2026. Internal explainer for the securi-tee.com CI pipeline decision.

---

## What CI testing is

CI means Continuous Integration. Every time you push code (or publish content through Tina, which also commits to the repo), the pipeline runs automatically. It lives in a config file that your hosting platform reads. Since the site is on Vercel, that's either a `.github/workflows/` file (GitHub Actions) or a Vercel build step. The pipeline runs a script that checks: does the site actually work after this change?

## Step by step: what happens when you push

1. You push to `main` (or Tina commits content to `main`)
2. GitHub (or Vercel) detects the push
3. It spins up a fresh container
4. Installs your dependencies
5. Builds the site the same way production does
6. Starts a local server pointing at the built output
7. Runs a script that hits every important URL and checks the HTTP status code
8. If any URL doesn't return the expected status, the pipeline fails, and you get an alert
9. If all pass, the deploy proceeds

The core script is simple HTTP requests with assertions. Fetch `/blog` — expect 200. Fetch `/blog/some-post` — expect 200. Fetch `/admin` — expect 200. Fetch `/projects` — expect 200. Fetch a known-bad slug like `/blog/this-does-not-exist` — expect 404. If any of those assumptions break, the pipeline catches it before users do.

## Benefits

- **Catches silent deploy failures.** Tina publishes a post with bad frontmatter, build fails, Vercel keeps the old deploy. You think the post is live. It's not. The pipeline fails on the build step and notifies you.
- **Catches broken routes after refactors.** You rename a file, forget to update a link, the old URL 404s now. Pipeline catches it.
- **Catches type errors that slipped through.** `tsc --noEmit` in the pipeline means a type error blocks the deploy, even if you forgot to run it locally.
- **Documented expectations.** The test file IS documentation of what routes should exist and what they should return. Anyone reading the repo knows the contract.
- **Confidence to move fast.** You can refactor knowing the pipeline will tell you if you broke something.

## Cons (honest)

- **Maintenance.** When you add a new page, you have to add it to the test list. Forget, and you have a gap. Though you can auto-generate the route list from the filesystem.
- **False positives.** If a route depends on Tina data that's empty in the test environment, the route might return 200 but render nothing useful. The test passes but the page is blank. You'd need content assertions, not just status code checks, to catch that.
- **Build time.** Adds maybe 30-60 seconds to every deploy. Not significant for a site this size.
- **Complexity creep.** It starts as "check status codes" and turns into "check content, check visual regression, check Lighthouse scores." Each layer adds maintenance.
- **Overkill for a small personal portfolio.** The site has maybe 8 routes. A human checks them in 2 minutes. The pipeline pays off when you have 80 routes or a team.

## How most people use it

Status code assertions on key routes. `tsc` in CI. Maybe `eslint`. That's the standard playbook. Table stakes for teams, optional for solo devs.

## Uncommon uses — the creative edges

### 1. Content regression testing
After a Tina publish, the pipeline not only checks that the route returns 200, it grabs the rendered HTML and checks that the post title and body are actually present. Not just "page loaded" but "page loaded with the content I published." This catches the scenario where the build succeeds but Tina returns empty data for some reason.

### 2. Security header verification
Your next.config.js has CSP, HSTS, X-Frame-Options, all the good stuff. The pipeline can fetch every route and assert those headers are present. If a config change drops a security header, the pipeline fails. For a security portfolio, your own headers being wrong would be embarrassing.

### 3. CORS validation on the hardened route
The CI script sends a request with `Origin: https://evil.com` to your `/api/tina/[...path]` route and asserts the response does NOT reflect that origin. Then sends `Origin: https://www.securi-tee.com` and asserts it DOES reflect. Automated proof that the CORS hardening is actually working in production, not just in the code.

### 4. Admin panel existence check
After every build + deploy, fetch `/admin/index.html` and assert it returns 200 and contains the TinaCMS bootstrapping script. This catches the exact failure mode the deleted wrapper was masking: a deploy where the Tina build step didn't run and the admin panel is missing.

### 5. Chained publishing check (auto-discovery)
The pipeline doesn't just test existing routes. It reads the MDX files directly from the repo it just built (or queries the Tina API) to enumerate every published post, then hits every single post URL. If a post exists in the filesystem but 404s on the rendered site, something in the dynamic routing is broken. This turns a 5-route test into an N-route test where N is the actual count of your content. Zero manual maintenance — it auto-discovers.

### 6. Lighthouse-on-deploy with single-metric gates
Not the full Lighthouse suite (that gets noisy). Pick one metric that matters: Performance Score, or Largest Contentful Paint. If it drops below a threshold, fail. This catches performance regressions from layout changes you didn't realize were expensive. For a portfolio site, slow load = recruiter bounces.

### 7. Chained dependency audit
The pipeline runs `npm audit` (or `pnpm audit`) and fails if any high-severity vulnerability is found. Your dependencies are part of your attack surface. A new CVE in a package you use should block the deploy until you patch it, not wait for you to notice. For a security portfolio, shipping a site with known-vulnerable dependencies is a bad look.

### 8. Dead link crawler
After build, the pipeline spiders every internal link starting from the homepage and asserts none of them 404. This catches: renamed pages with stale links in navigation, blog posts that link to other blog posts that were deleted, markdown links with typos. A full crawler, not just a hardcoded list. It finds the links you forgot to update.

### 9. Environment variable presence check
The pipeline asserts that `NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`, and any other required env vars are actually set in the build environment. A deploy that silently falls back to `"local"` because someone forgot to set a production env var would be caught before it ships. The config already warns about this (see the console.warn in config.js line 31). The pipeline turns that warning into a hard fail.

### 10. Sitemap.xml round-trip
If you generate a sitemap, the pipeline fetches `/sitemap.xml`, parses every URL from it, and hits each one. This is the inverse of the auto-discovery approach: instead of testing what SHOULD exist, it tests what the site CLAIMS exists. If the sitemap lists a URL that 404s, search engines are indexing dead links, which hurts SEO. If the sitemap is missing a URL that should be there, you're not getting indexed. Both directions matter.

### 11. API route contract testing
Your `/api/tina/[...path]` route only allows three paths: `token`, `oauth/callback`, `auth`. The pipeline can test each one: assert that allowed paths return expected status codes, and that disallowed paths (like `users`, `projects`, anything else) return 403 or 404. This turns the `ALLOWED_PATHS` set from a code-level guard into a tested contract. If someone adds a path to the allowlist, they have to add a test for it.

### 12. Build output size budget
The pipeline checks the total size of the built JS bundle (or the `.next` output). If it exceeds a budget you set, it fails. This catches the scenario where you accidentally import a huge library for a one-off feature and ship a 2MB bundle to a portfolio site. For mobile users on slow connections, this matters. Set the budget at whatever the current bundle size is plus 20% headroom. Tighten it over time.
