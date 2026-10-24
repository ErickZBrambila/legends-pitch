#!/usr/bin/env python3
"""
North Legends FC — security verification.

Checks whether the issues from the October 2026 review are present. Every
check prints PASS (fixed), FAIL (still vulnerable), WARN (needs a look) or
SKIP. Exit code is 1 if anything FAILs, so it can run in CI.

Usage:
  python3 scripts/verify_security.py --url https://www.northlegendsfc.com
  python3 scripts/verify_security.py --repo .                 # code only
  python3 scripts/verify_security.py --url http://localhost:3000 --repo .

Live checks are designed to be SAFE against production:
  * Nothing is ever sent to families. The push-spoof probe uses a fake
    signature and a deliberately malformed body, so even a vulnerable server
    stops at JSON parsing (that 400 is what proves the signature wasn't checked).
  * Forged-cookie probes only make GET requests and look at the status code.
    Response bodies are discarded and never printed or saved.
  * The Sanity probe asks only for a document COUNT, not any content.
  * Nothing that would trigger real work (like the game-day cron) is called.
Only run live checks against a site you're authorized to test.

Python 3.8+, standard library only.
"""

import argparse
import base64
import hashlib
import hmac
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Known values from the public repo (before the fix).
FALLBACK_ADMIN_SECRET = "dev-fallback-admin-secret-change-in-prod"
FALLBACK_PARENT_SECRET = "dev-parent-secret-2026-nlfc"
FAMILY_SALT = "-nlfc-family-2026"
NEO_SALT = "-nlfc-neo-2026"
FIXED_NEXT_VERSION = (16, 4, 1)  # first release after the 16.4.0 middleware-bypass range

UA = "nlfc-security-verify/1.0"
results = []  # (status, id, message)


def record(status, check_id, message):
    results.append((status, check_id, message))


# ── HTTP helpers ─────────────────────────────────────────────────────────────

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


_opener = urllib.request.build_opener(NoRedirect)


def http(method, url, headers=None, body=None, timeout=20):
    """Returns (status, headers, body_text_truncated). Never follows redirects."""
    h = {"User-Agent": UA}
    h.update(headers or {})
    data = body.encode() if isinstance(body, str) else body
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with _opener.open(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read(4096).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        try:
            text = e.read(4096).decode("utf-8", "replace")
        except Exception:
            text = ""
        return e.code, dict(e.headers or {}), text
    except Exception as e:  # network error
        return None, {}, str(e)


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def forge_admin_token(secret: str) -> str:
    payload = b64url(json.dumps(
        {"id": "bootstrap", "role": "admin", "exp": int(time.time() * 1000) + 3600_000}
    ).encode())
    sig = b64url(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{sig}"


def forge_parent_token(secret: str) -> str:
    # Random account id that doesn't exist — enough to pass a forged-signature gate.
    payload = b64url(f"verify-probe-{int(time.time())}:{int(time.time() * 1000) + 3600_000}".encode())
    sig = b64url(hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{sig}"


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def is_login_redirect(status, headers, expect_path):
    loc = headers.get("Location") or headers.get("location") or ""
    return status in (301, 302, 303, 307, 308) and expect_path in loc


def got_past_gate(status):
    # 200 = page rendered. 5xx = the gate let us through and the page then
    # errored (e.g. a test server without a real backend) — still a bypass.
    return status is not None and (status == 200 or status >= 500)


# ── Live checks ──────────────────────────────────────────────────────────────

def check_push_spoof(base):
    for route in ("/api/cron/game-day-push", "/api/cron/result-checker"):
        cid = f"PUSH-SPOOF {route}"
        status, _, text = http(
            "POST", base + route,
            headers={"upstash-signature": "forged.invalid.signature",
                     "Content-Type": "application/json"},
            body="{not valid json",  # malformed on purpose: nothing can be sent
        )
        if status is None:
            record("SKIP", cid, f"request failed: {text[:80]}")
        elif status == 400 and "Invalid JSON" in text:
            record("FAIL", cid, "fake signature accepted (reached JSON parsing) — anyone can push notifications to families")
        elif status == 401:
            record("PASS", cid, "fake signature rejected (401)")
        elif status == 500 and "Not configured" in text:
            record("WARN", cid, "route is fixed but QSTASH_*_SIGNING_KEY env vars are missing — game-day pushes will fail")
        else:
            record("WARN", cid, f"unexpected response {status}: {text[:80]!r}")


def check_forged_admin(base):
    cid = "FORGED-ADMIN (fallback secret)"
    token = forge_admin_token(FALLBACK_ADMIN_SECRET)
    status, headers, _ = http("GET", base + "/admin/dashboard",
                              headers={"Cookie": f"nlfc_admin={token}"})
    if status is None:
        record("SKIP", cid, "request failed")
    elif got_past_gate(status):
        record("FAIL", cid, "admin dashboard opened with a cookie signed by the public fallback secret — set ADMIN_SESSION_SECRET")
    elif is_login_redirect(status, headers, "/admin"):
        record("PASS", cid, "forged admin cookie rejected")
    else:
        record("WARN", cid, f"unexpected response {status}")


def check_forged_parent(base):
    cid = "FORGED-PARENT (fallback secret)"
    token = forge_parent_token(FALLBACK_PARENT_SECRET)
    status, headers, _ = http("GET", base + "/videos",
                              headers={"Cookie": f"nlfc_parent={token}"})
    if status is None:
        record("SKIP", cid, "request failed")
    elif got_past_gate(status):
        record("FAIL", cid, "/videos opened with a cookie signed by the public fallback secret — set PARENT_SESSION_SECRET")
    elif is_login_redirect(status, headers, "/family"):
        record("PASS", cid, "forged parent cookie rejected")
    else:
        record("WARN", cid, f"unexpected response {status}")


def check_empty_passcode_cookies(base):
    # If FAMILY_PASSCODE / THE_ONE were unset, these cookie values are valid.
    cid = "EMPTY-FAMILY-PASSCODE"
    status, headers, _ = http("GET", base + "/videos",
                              headers={"Cookie": f"nlfc_family={sha256_hex(FAMILY_SALT)}"})
    if status is None:
        record("SKIP", cid, "request failed")
    elif got_past_gate(status):
        record("FAIL", cid, "/videos opened with the 'empty passcode' cookie — FAMILY_PASSCODE is unset")
    elif is_login_redirect(status, headers, "/family"):
        record("PASS", cid, "empty-passcode cookie rejected")
    else:
        record("WARN", cid, f"unexpected response {status}")

    cid = "EMPTY-NEO-PASSWORD"
    # Body is discarded: on a vulnerable server it would contain parent accounts.
    status, _, _ = http("GET", base + "/api/neo/parents",
                        headers={"Cookie": f"nlfc_neo={sha256_hex(NEO_SALT)}"})
    if status is None:
        record("SKIP", cid, "request failed")
    elif status == 200:
        record("FAIL", cid, "neo API opened with the 'empty password' cookie — THE_ONE is unset")
    elif status == 401:
        record("PASS", cid, "empty-password neo cookie rejected")
    else:
        record("WARN", cid, f"unexpected response {status}")


def check_tracker_open(base):
    cid = "TRACKER-UNAUTH"
    status, _, _ = http("GET", base + "/api/tracker/sessions/active")
    if status is None:
        record("SKIP", cid, "request failed")
    elif status == 200:
        record("FAIL", cid, "tracker API answers without any login (sessions/events can be created or hijacked)")
    elif status == 401:
        record("PASS", cid, "tracker API requires family/parent/coach access")
    else:
        record("WARN", cid, f"unexpected response {status}")


def check_page_gates(base):
    # Baseline: with no cookies at all, gated pages must redirect to /family.
    for path in ("/videos", "/gallery", "/highlights", "/tracker"):
        cid = f"GATE {path}"
        status, headers, _ = http("GET", base + path)
        if status is None:
            record("SKIP", cid, "request failed")
        elif is_login_redirect(status, headers, "/family"):
            record("PASS", cid, "anonymous visitor redirected to family login")
        elif got_past_gate(status):
            record("FAIL", cid, "page loads for anonymous visitors")
        else:
            record("WARN", cid, f"unexpected response {status}")


def discover_sanity_project(base):
    status, _, html = http("GET", base + "/", timeout=30)
    if not status:
        return None
    m = re.search(r"cdn\.sanity\.io/(?:images|files)/([a-z0-9]{6,12})/", html)
    if m:
        return m.group(1)
    # Look through a handful of JS chunks for the bundled NEXT_PUBLIC project id.
    for src in re.findall(r'src="(/_next/static/[^"]+\.js)"', html)[:25]:
        s, _, js = http("GET", base + src, timeout=30)
        if not s:
            continue
        # http() truncates bodies; fetch full chunk here.
        try:
            with urllib.request.urlopen(urllib.request.Request(base + src, headers={"User-Agent": UA}), timeout=30) as r:
                js = r.read().decode("utf-8", "replace")
        except Exception:
            continue
        m = re.search(r'projectId:\s*"([a-z0-9]{6,12})"', js) or \
            re.search(r"([a-z0-9]{8})\.api(?:cdn)?\.sanity\.io", js)
        if m:
            return m.group(1)
    return None


def check_sanity_public(base, project_id, dataset):
    cid = "SANITY-PUBLIC-DATASET"
    if not project_id and base:
        project_id = discover_sanity_project(base)
    if not project_id:
        record("SKIP", cid, "couldn't find the Sanity project ID — pass --sanity-project-id")
        return
    # COUNT only — no document content is requested.
    query = 'count(*[_type in ["galleryEvent","highlightVideo","gameSession","practiceSession","playerPhotoSubmission"]])'
    url = (f"https://{project_id}.api.sanity.io/v2024-01-01/data/query/{dataset}?"
           + urllib.parse.urlencode({"query": query}))
    status, _, text = http("GET", url)
    if status is None:
        record("SKIP", cid, f"request failed: {text[:80]}")
        return
    try:
        result = json.loads(text).get("result")
    except Exception:
        result = None
    if status == 200 and isinstance(result, int) and result > 0:
        record("FAIL", cid, f"anyone can query {result} gallery/video/photo documents straight from Sanity "
                            f"(project {project_id}) — set the dataset to Private")
    elif status in (401, 403) or (status == 200 and result == 0):
        record("PASS", cid, "media documents are not readable anonymously")
    else:
        record("WARN", cid, f"unexpected response {status}: {text[:80]!r}")


# ── Static (repo) checks ─────────────────────────────────────────────────────

def read(repo, rel):
    p = repo / rel
    return p.read_text(encoding="utf-8") if p.exists() else ""


def parse_version(v):
    m = re.search(r"(\d+)\.(\d+)\.(\d+)", v or "")
    return tuple(int(x) for x in m.groups()) if m else None


def static_checks(repo: Path):
    src_files = [p for p in repo.rglob("*.ts*")
                 if "node_modules" not in p.parts and ".next" not in p.parts]
    all_src = {p: p.read_text(encoding="utf-8", errors="replace") for p in src_files}

    # Hardcoded fallback secrets
    hits = [str(p.relative_to(repo)) for p, s in all_src.items()
            if FALLBACK_ADMIN_SECRET in s or FALLBACK_PARENT_SECRET in s]
    record("FAIL" if hits else "PASS", "CODE fallback secrets",
           f"hardcoded session secrets in: {', '.join(hits)}" if hits else "no hardcoded session secrets")

    # Empty-env cookie bypasses (`process.env.X ?? ""` fed into a hash)
    hits = []
    for p, s in all_src.items():
        if re.search(r'process\.env\.(FAMILY_PASSCODE|THE_ONE)\s*\?\?\s*""\)?\s*(\+|,|\))', s) and \
           re.search(r"createHash|sha256|hashPasscode|hashNeoPassword", s):
            hits.append(str(p.relative_to(repo)))
    record("FAIL" if hits else "PASS", "CODE empty-passcode bypass",
           f"passcode may hash as empty string in: {', '.join(hits)}" if hits else "unset passcodes fail closed")

    # QStash signature verification
    for rel in ("app/api/cron/game-day-push/route.ts", "app/api/cron/result-checker/route.ts"):
        s = read(repo, rel)
        ok = "verifyQStashRequest" in s or "Receiver" in s or "verifySignatureAppRouter" in s
        record("PASS" if ok else "FAIL", f"CODE QStash verify {Path(rel).parent.name}",
               "signature is verified" if ok else "only checks that the header exists")

    # Cron secret fails closed
    s = read(repo, "app/api/cron/game-day-reminder/route.ts")
    ok = bool(re.search(r"!\s*cronSecret|!process\.env\.CRON_SECRET", s))
    record("PASS" if ok else "FAIL", "CODE CRON_SECRET",
           "rejects requests when CRON_SECRET is unset" if ok else "'Bearer undefined' authorizes when CRON_SECRET is unset")

    # Server-side gate on media pages
    for rel in ("app/videos/page.tsx", "app/videos/[sessionId]/page.tsx", "app/gallery/page.tsx",
                "app/gallery/[eventId]/page.tsx", "app/highlights/page.tsx", "app/tracker/page.tsx"):
        s = read(repo, rel)
        ok = bool(re.search(r"requireFamilyAccess|getFamilySession|getParentSession", s))
        record("PASS" if ok else "FAIL", f"CODE page gate {rel}",
               "checks access on the server" if ok else "relies on middleware only")

    # Tracker API auth
    tracker_routes = sorted((repo / "app/api/tracker").rglob("route.ts"))
    missing = [str(p.relative_to(repo)) for p in tracker_routes
               if not re.search(r"familyAccessDenied|getAdminSession|hasFamilyAccess", p.read_text())]
    record("FAIL" if missing else "PASS", "CODE tracker auth",
           f"no auth in: {', '.join(missing)}" if missing else f"all {len(tracker_routes)} tracker routes check access")

    # Sanity read token
    s = read(repo, "lib/sanity/client.ts")
    ok = bool(re.search(r"sanityClient\s*=\s*createClient\(\{[^}]*token:", s, re.S))
    record("PASS" if ok else "FAIL", "CODE Sanity read token",
           "reads use a server-side token" if ok else "reads are anonymous (dataset must be public)")

    # Open redirect on /family?next=
    s = read(repo, "app/family/page.tsx")
    ok = "safeNextPath" in s or '"//"' in s
    record("PASS" if ok else "FAIL", "CODE family next= redirect",
           "rejects //host redirects" if ok else "'//evil.com' passes the startsWith('/') check")

    # Next.js version (installed, else declared)
    installed = read(repo, "node_modules/next/package.json")
    ver = parse_version(json.loads(installed)["version"]) if installed else None
    if not ver:
        try:
            ver = parse_version(json.loads(read(repo, "package.json"))["dependencies"]["next"])
        except Exception:
            ver = None
    if ver is None:
        record("SKIP", "CODE next version", "couldn't determine Next.js version")
    else:
        vs = ".".join(map(str, ver))
        ok = ver >= FIXED_NEXT_VERSION
        record("PASS" if ok else "FAIL", "CODE next version",
               f"next {vs}" + ("" if ok else " is in the middleware-bypass advisory range (≤16.4.0)"))


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", help="site base URL, e.g. https://www.northlegendsfc.com")
    ap.add_argument("--repo", help="path to the legends-pitch checkout for code checks")
    ap.add_argument("--sanity-project-id", help="Sanity project ID (auto-discovered from --url if omitted)")
    ap.add_argument("--sanity-dataset", default="production")
    args = ap.parse_args()

    if not args.url and not args.repo:
        ap.error("give --url, --repo, or both")

    if args.url:
        base = args.url.rstrip("/")
        print(f"Live checks against {base} (read-only, nothing is sent to families)…")
        check_page_gates(base)
        check_push_spoof(base)
        check_forged_admin(base)
        check_forged_parent(base)
        check_empty_passcode_cookies(base)
        check_tracker_open(base)
        check_sanity_public(base, args.sanity_project_id, args.sanity_dataset)
    elif args.sanity_project_id:
        check_sanity_public(None, args.sanity_project_id, args.sanity_dataset)

    if args.repo:
        repo = Path(args.repo).resolve()
        print(f"Code checks in {repo}…")
        static_checks(repo)

    icons = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️ ", "SKIP": "⏭️ "}
    print()
    width = max(len(r[1]) for r in results)
    for status, cid, msg in results:
        print(f"{icons[status]} {status:<4}  {cid:<{width}}  {msg}")
    counts = {s: sum(1 for r in results if r[0] == s) for s in icons}
    print(f"\n{counts['PASS']} passed, {counts['FAIL']} failed, {counts['WARN']} warnings, {counts['SKIP']} skipped")
    sys.exit(1 if counts["FAIL"] else 0)


if __name__ == "__main__":
    main()
