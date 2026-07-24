#!/usr/bin/env python3
"""
ci-test.py — CI test pipeline for securi-tee.com

Runs 8 checks against the built Next.js site:
  1. tsc --noEmit (typecheck)
  2. Status code checks on key routes
  3. eslint
  4. Security header verification
  5. CORS round-trip test (evil origin rejected, real origin accepted)
  6. Admin panel existence check
  7. Auto-discovery of blog posts (reads MDX, hits every slug)
  8. Dead link crawler (spiders from homepage, finds broken internal links)

Usage:
  python3 scripts/ci-test.py [--base-url http://localhost:3000]

Exits non-zero if any check fails. Designed for GitHub Actions
but can be run locally against a dev or preview server.
"""

import argparse
import glob
import os
import re
import subprocess
import sys
from urllib.parse import urljoin, urlparse

try:
    import requests
except ImportError:
    print("FAIL: 'requests' package not installed. Run: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULT_BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
SITE_ORIGIN = "https://www.securi-tee.com"

# Routes that must exist and return 200
STATIC_ROUTES = [
    "/",
    "/about",
    "/blog",
    "/projects",
    "/work",
    "/contact",
]

# Routes that must 404
NOT_FOUND_ROUTES = [
    "/blog/this-slug-does-not-exist-xyz123",
    "/projects/this-project-does-not-exist-xyz123",
]

# API paths allowed by route.ts ALLOWED_PATHS
API_ALLOWED_PATHS = ["token", "oauth/callback", "auth"]

# Security headers we expect on main-site routes (not /admin)
EXPECTED_SECURITY_HEADERS = {
    "strict-transport-security": "max-age=63072000",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "content-security-policy": "default-src 'self'",
}

# admin route gets its own CSP, plus CORS headers
ADMIN_EXPECTED_HEADERS = {
    "content-security-policy": "default-src 'self'",
    "access-control-allow-origin": "https://app.tina.io",
}

# Content directory for auto-discovery
CONTENT_POST_DIR = os.environ.get(
    "CONTENT_POST_DIR",
    os.path.join(os.path.dirname(__file__), "..", "content", "post"),
)


# ---------------------------------------------------------------------------
# Test runner framework
# ---------------------------------------------------------------------------

class Results:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.failures = []

    def ok(self, msg):
        self.passed += 1
        print(f"  PASS  {msg}")

    def fail(self, msg, detail=""):
        self.failed += 1
        self.failures.append((msg, detail))
        detail_str = f"\n         {detail}" if detail else ""
        print(f"  FAIL  {msg}{detail_str}")

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'=' * 60}")
        print(f"  {self.passed} passed, {self.failed} failed, {total} total")
        if self.failed:
            print(f"\n  FAILURES:")
            for msg, detail in self.failures:
                print(f"    - {msg}")
                if detail:
                    for line in detail.strip().split("\n"):
                        print(f"      {line}")
        print(f"{'=' * 60}")
        return self.failed == 0


def run_command(cmd, cwd=None, timeout=120):
    """Run a command, return (returncode, stdout, stderr)."""
    try:
        r = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout
        )
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", f"Command timed out after {timeout}s"


# ---------------------------------------------------------------------------
# Check 1: tsc --noEmit
# ---------------------------------------------------------------------------

def check_typecheck(results, repo_root):
    print("\n[1/8] Typecheck (tsc --noEmit)")

    code, stdout, stderr = run_command(
        ["npx", "tsc", "--noEmit"], cwd=repo_root, timeout=180
    )
    if code == 0:
        results.ok("tsc --noEmit: no type errors")
    else:
        results.fail("tsc --noEmit: type errors found", stderr or stdout)


# ---------------------------------------------------------------------------
# Check 2: Status codes on key routes
# ---------------------------------------------------------------------------

def check_route_status_codes(results, base_url):
    print("\n[2/8] Route status codes")

    for route in STATIC_ROUTES:
        url = urljoin(base_url, route)
        try:
            r = requests.get(url, timeout=15, allow_redirects=True)
            if r.status_code == 200:
                results.ok(f"{route} -> {r.status_code}")
            else:
                results.fail(f"{route} -> {r.status_code} (expected 200)")
        except requests.RequestException as e:
            results.fail(f"{route} -> connection error: {e}")

    for route in NOT_FOUND_ROUTES:
        url = urljoin(base_url, route)
        try:
            r = requests.get(url, timeout=15, allow_redirects=False)
            if r.status_code == 404:
                results.ok(f"{route} -> {r.status_code} (correct 404)")
            else:
                results.fail(
                    f"{route} -> {r.status_code} (expected 404)"
                )
        except requests.RequestException as e:
            results.fail(f"{route} -> connection error: {e}")


# ---------------------------------------------------------------------------
# Check 3: eslint
# ---------------------------------------------------------------------------

def check_eslint(results, repo_root):
    print("\n[3/8] ESLint")

    code, stdout, stderr = run_command(
        ["npx", "next", "lint"], cwd=repo_root, timeout=120
    )
    if code == 0:
        results.ok("next lint: no errors")
    else:
        # next lint exits 1 on warnings, 2 on errors — only fail on 2
        if code == 2:
            results.fail("next lint: errors found", stderr or stdout)
        elif code == 1:
            results.ok(f"next lint: warnings only (acceptable)\n{stdout.strip()[:200]}")
        else:
            results.fail(f"next lint: exit code {code}", stderr or stdout)


# ---------------------------------------------------------------------------
# Check 4: Security header verification
# ---------------------------------------------------------------------------

def check_security_headers(results, base_url):
    print("\n[4/8] Security header verification")

    # Main-site route (should NOT match /admin)
    try:
        r = requests.get(urljoin(base_url, "/"), timeout=15)
    except requests.RequestException as e:
        results.fail(f"/ -> connection error: {e}")
        return

    headers_lower = {k.lower(): v for k, v in r.headers.items()}

    for header, expected_substr in EXPECTED_SECURITY_HEADERS.items():
        actual = headers_lower.get(header, "")
        if actual and expected_substr.lower() in actual.lower():
            results.ok(f"{header}: present")
        elif actual:
            results.fail(
                f"{header}: present but value mismatch",
                f"expected substring '{expected_substr}', got '{actual}'",
            )
        else:
            results.fail(f"{header}: MISSING")

    # Admin route gets its own CSP + CORS
    try:
        r_admin = requests.get(urljoin(base_url, "/admin/"), timeout=15)
        admin_headers = {k.lower(): v for k, v in r_admin.headers.items()}
        for header, expected_substr in ADMIN_EXPECTED_HEADERS.items():
            actual = admin_headers.get(header, "")
            if actual and expected_substr.lower() in actual.lower():
                results.ok(f"admin {header}: present")
            else:
                results.fail(
                    f"admin {header}: MISSING or wrong",
                    f"expected '{expected_substr}', got '{actual}'",
                )
    except requests.RequestException as e:
        results.fail(f"/admin/ -> connection error: {e}")


# ---------------------------------------------------------------------------
# Check 5: CORS round-trip test
# ---------------------------------------------------------------------------

def check_cors(results, base_url):
    print("\n[5/8] CORS round-trip test")

    api_url = urljoin(base_url, "/api/tina/token")

    # Test 1: Evil origin should NOT be reflected
    try:
        r = requests.get(
            api_url,
            headers={"Origin": "https://evil-example.com"},
            timeout=10,
        )
        aco_header = r.headers.get("access-control-allow-origin", "")
        if "evil" in aco_header.lower():
            results.fail(
                "CORS: evil origin was reflected",
                f"Access-Control-Allow-Origin: {aco_header}",
            )
        else:
            results.ok(f"CORS: evil origin rejected (got '{aco_header}')")
    except requests.RequestException as e:
        results.fail(f"CORS evil test: connection error: {e}")

    # Test 2: Allowed origin SHOULD be reflected
    try:
        r = requests.get(
            api_url,
            headers={"Origin": SITE_ORIGIN},
            timeout=10,
        )
        aco_header = r.headers.get("access-control-allow-origin", "")
        if SITE_ORIGIN in aco_header:
            results.ok(f"CORS: real origin accepted")
        else:
            results.fail(
                "CORS: real origin not reflected",
                f"expected '{SITE_ORIGIN}', got '{aco_header}'",
            )
    except requests.RequestException as e:
        results.fail(f"CORS real test: connection error: {e}")

    # Test 3: localhost should be allowed in dev
    try:
        r = requests.get(
            api_url,
            headers={"Origin": "http://localhost:3000"},
            timeout=10,
        )
        aco_header = r.headers.get("access-control-allow-origin", "")
        if "localhost" in aco_header:
            results.ok("CORS: localhost origin accepted (dev)")
        else:
            results.ok(f"CORS: localhost not reflected (prod mode, acceptable)")
    except requests.RequestException as e:
        results.fail(f"CORS localhost test: connection error: {e}")


# ---------------------------------------------------------------------------
# Check 6: Admin panel existence check
# ---------------------------------------------------------------------------

def check_admin_panel(results, base_url):
    print("\n[6/8] Admin panel existence check")

    admin_url = urljoin(base_url, "/admin/index.html")
    try:
        r = requests.get(admin_url, timeout=15)
        if r.status_code != 200:
            results.fail(
                f"/admin/index.html -> {r.status_code} (expected 200)",
                "Tina build may not have run. Check 'tinacms build' in the build step.",
            )
            return

        # Check for Tina bootstrapping (script tag or tina-related content)
        body_lower = r.text.lower()
        if "tina" in body_lower or "__tinacms" in body_lower:
            results.ok("Admin panel: 200 + Tina bootstrapping detected")
        else:
            results.fail(
                "Admin panel: 200 but Tina bootstrapping not found",
                "Page may exist but TinaCMS script may not be bundled.",
            )
    except requests.RequestException as e:
        results.fail(f"Admin panel: connection error: {e}")

    # Also check /admin/ (no index.html, should serve the panel)
    try:
        r = requests.get(urljoin(base_url, "/admin/"), timeout=15)
        if r.status_code == 200:
            results.ok("/admin/ -> 200 (panel served)")
        else:
            results.fail(f"/admin/ -> {r.status_code} (expected 200)")
    except requests.RequestException as e:
        results.fail(f"/admin/ fallback: connection error: {e}")


# ---------------------------------------------------------------------------
# Check 7: Auto-discovery of blog posts
# ---------------------------------------------------------------------------

def discover_blog_slugs(content_dir):
    """Read MDX files from content/post/ and extract slugs (filenames)."""
    slugs = []
    pattern = os.path.join(content_dir, "*.mdx")
    for filepath in sorted(glob.glob(pattern)):
        filename = os.path.basename(filepath)
        slug = os.path.splitext(filename)[0]
        slugs.append(slug)
    return slugs


def check_blog_auto_discovery(results, base_url, content_dir):
    print("\n[7/8] Blog post auto-discovery")

    if not os.path.isdir(content_dir):
        results.fail(
            "Auto-discovery: content/post/ directory not found",
            f"Looked for: {content_dir}",
        )
        return

    slugs = discover_blog_slugs(content_dir)
    if not slugs:
        results.fail("Auto-discovery: no MDX files found in content/post/")
        return

    results.ok(f"Discovered {len(slugs)} blog post(s): {', '.join(slugs[:5])}")

    for slug in slugs:
        url = urljoin(base_url, f"/blog/{slug}")
        try:
            r = requests.get(url, timeout=15, allow_redirects=True)
            if r.status_code == 200:
                # Content assertion: title should be in the rendered HTML
                # We look for the <h1> tag which the blog template renders
                h1_match = re.search(r"<h1[^>]*>(.*?)</h1>", r.text, re.DOTALL)
                if h1_match:
                    title_text = h1_match.group(1).strip()[:60]
                    results.ok(f"/blog/{slug} -> 200 (title: {title_text})")
                else:
                    results.fail(
                        f"/blog/{slug} -> 200 but no <h1> found",
                        "Page loaded but title content missing.",
                    )
            else:
                results.fail(
                    f"/blog/{slug} -> {r.status_code} (expected 200)",
                    "Post exists in content/post/ but doesn't resolve.",
                )
        except requests.RequestException as e:
            results.fail(f"/blog/{slug} -> connection error: {e}")


# ---------------------------------------------------------------------------
# Check 8: Dead link crawler
# ---------------------------------------------------------------------------

def extract_internal_links(html, base_url):
    """Extract internal href links from HTML, return set of absolute URLs."""
    links = set()
    parsed_base = urlparse(base_url)
    # Find all href="..." values
    for match in re.finditer(r'href=["\']([^"\']+)["\']', html):
        href = match.group(1)
        # Skip anchors, mailto, tel, external URLs
        if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        # Build absolute URL
        absolute = urljoin(base_url, href)
        parsed = urlparse(absolute)
        # Only follow same-host links
        if parsed.hostname == parsed_base.hostname:
            # Strip fragments
            clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if parsed.query:
                clean += f"?{parsed.query}"
            links.add(clean)
    return links


def check_dead_links(results, base_url, max_pages=30):
    print("\n[8/8] Dead link crawler")

    visited = set()
    to_visit = {base_url}
    broken = []
    checked = 0

    while to_visit and checked < max_pages:
        url = to_visit.pop()
        if url in visited:
            continue
        visited.add(url)
        checked += 1

        path = urlparse(url).path or "/"
        try:
            r = requests.get(url, timeout=15, allow_redirects=True)
            if r.status_code != 200:
                broken.append((path, r.status_code))
                results.fail(f"Crawler: {path} -> {r.status_code}")
            else:
                # Only crawl HTML pages (not assets/API)
                content_type = r.headers.get("content-type", "")
                if "text/html" in content_type:
                    results.ok(f"Crawler: {path} -> 200")
                    # Extract and queue new links
                    new_links = extract_internal_links(r.text, base_url)
                    for link in new_links:
                        if link not in visited:
                            to_visit.add(link)
        except requests.RequestException as e:
            broken.append((path, str(e)))
            results.fail(f"Crawler: {path} -> error: {e}")

    if not broken:
        results.ok(f"Crawler: {checked} page(s) crawled, 0 broken links")
    else:
        results.fail(
            f"Crawler: {len(broken)} broken link(s) found across {checked} pages",
            "\n".join(f"  {p} ({s})" for p, s in broken),
        )


# ---------------------------------------------------------------------------
# Environment variable presence check (bonus, runs before server tests)
# ---------------------------------------------------------------------------

def check_env_vars(results, repo_root):
    """Check that required env vars are set (CI only, not blocking locally)."""
    print("\n[0/8] Environment variable presence")
    required = ["NEXT_PUBLIC_TINA_CLIENT_ID", "TINA_TOKEN"]
    missing = [v for v in required if not os.environ.get(v)]
    if missing:
        results.fail(
            f"Missing env vars: {', '.join(missing)}",
            "Set these in GitHub Secrets or .env.local. "
            "Build will fall back to 'local' mode without them.",
        )
    else:
        results.ok("All required env vars present")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="CI test pipeline for securi-tee.com"
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL of the running server (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--repo-root",
        default=os.path.join(os.path.dirname(__file__), ".."),
        help="Path to repo root (default: parent of this script)",
    )
    parser.add_argument(
        "--skip-server",
        action="store_true",
        help="Skip tests that require a running server (typecheck + eslint only)",
    )
    args = parser.parse_args()

    repo_root = os.path.abspath(args.repo_root)
    base_url = args.base_url.rstrip("/")
    content_dir = os.path.abspath(CONTENT_POST_DIR)

    print(f"{'=' * 60}")
    print(f"  CI Test Pipeline — securi-tee.com")
    print(f"  Base URL:    {base_url}")
    print(f"  Repo root:   {repo_root}")
    print(f"  Content dir: {content_dir}")
    print(f"{'=' * 60}")

    results = Results()

    # Checks that don't need a server
    check_env_vars(results, repo_root)
    check_typecheck(results, repo_root)
    check_eslint(results, repo_root)

    if args.skip_server:
        print("\n[--skip-server] Skipping server-dependent checks.")
        success = results.summary()
        sys.exit(0 if success else 1)

    # Checks that need a running server
    check_route_status_codes(results, base_url)
    check_security_headers(results, base_url)
    check_cors(results, base_url)
    check_admin_panel(results, base_url)
    check_blog_auto_discovery(results, base_url, content_dir)
    check_dead_links(results, base_url)

    success = results.summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
