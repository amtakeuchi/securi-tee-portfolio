---
title: Portfolio CI Test Pipeline
category: QA & Test Automation
thumbnail: /uploads/ci-log-shot-cropped.png
description: 'A GitHub Actions pipeline I built that runs 8 automated checks, including a CORS attack simulation, against my portfolio site on every push. Built after a manual audit found 5 real vulnerabilities a one-time check couldn''t keep fixed.'
repoLink: 'https://github.com/amtakeuchi/securi-tee-portfolio'
date: 2026-07-26T05:00:00.000Z
track: etc
proof: '8 checks per push, green on my major deploy.'
---

Soooooo this is new for me. Let's get into this. \
\
I audited my own portfolio site once: manual code review, Semgrep for static analysis (SAST, scanning the source code itself), OWASP ZAP for dynamic testing (DAST, attacking the running site). Found and fixed 5 real vulnerabilities. That felt like enough at the time.

Turns out it wasn't, because an audit is just a snapshot. It tells you the site was fine on the day you looked, and says nothing about the commit you push next week that reopens the exact same hole. I needed something that actually checked on every push, not just the one time I remembered to.

So I built a pipeline: a GitHub Actions workflow that runs 8 automated checks on my portfolio site, every single time I push code.

### What is a CI/CD Pipeline??

First thing I had to figure out. It stands for Continuous Integration and Continuous Delivery/Deployment, and in practice it's exactly what it sounds like: an automated series of steps that builds, tests, and deploys code every time you push, instead of you doing each step by hand and forgetting one (don't feel bad for not knowing, I had to google it too).

### The 8 checks

This pipeline runs a Python test script (ci-test.py) against a real build of the site, 8 checks in order:

1. Typecheck (tsc --noEmit), catches type errors before they'd break in production
2. ESLint, code-quality linting that catches bugs and messy patterns
3. Route status codes, every page returns what it should
4. Security headers present on every response (HSTS, CSP, X-Frame-Options, the rest)
5. A CORS round-trip test: the script sends a request from a fake malicious origin and confirms it gets rejected, then sends one from the real origin and confirms it's accepted
6. Admin panel existence, confirms /admin actually resolves instead of silently 404ing
7. Blog auto-discovery, every post in the content folder actually shows up in the blog list
8. A dead-link crawler that walks every internal link on the site and flags anything broken

### Why CORS gets its own test

This one's not generic. CORS (Cross-Origin Resource Sharing) is the browser rule that decides which outside websites are allowed to call your API. My previous audit had already found a wildcard CORS policy on the Tina API proxy, a route that forwards to a content API with a real token attached. A wildcard policy means the server said yes to a request from ANY website, not just mine, so a malicious site could have called that route directly and read the token back. Fixing it once doesn't guarantee it stays fixed, so check 5 doesn't just confirm the header exists, it actually plays out the attack: send a request from an origin that shouldn't be allowed and confirm the server says no, then send one from the real origin and confirm it says yes.

### Running in GitHub Actions

The workflow installs dependencies, runs the typecheck/lint/env checks first (fast, no server needed), then builds the actual site, starts it, waits for it to be ready, and runs the full suite against the live build, the same sequence that would happen on a real deploy, not a mock.

After I wired up the missing secrets, the first real run passed all 8 checks. It's a new skill I'm proud I actually learned and pulled off, and it's ALSO going to make my life easier every single time I touch this code again.\
\
If you're curious and want to check the code out, the full script and workflow file are in the repo, ci-test.py and ci-test.yml.
