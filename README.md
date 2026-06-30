# Pyrex Framework — Architecture Notes

## ⚠️ Important Security Architecture Decision

### Problem:
Python (FastAPI, port 8000) runs as a separate service from
JS (Bun.js, port 3000). The JS layer acts as the security
gatekeeper (CORS, CSRF, rate limiting, SQL injection/XSS checks)
before forwarding requests to Python.

**Risk:** If port 8000 is publicly accessible, an attacker can
bypass the JS security layer entirely and hit Python endpoints
directly — skipping CSRF protection, rate limiting, and all
other security checks.

### Solution (for production — Sprint 5):
1. **Network isolation** — Python (port 8000) should NEVER be
   exposed to the public internet. Only JS (port 3000) is public.
   - Docker: put Python container on an internal-only network
   - Firewall: block external access to port 8000
   - Only JS container can reach Python container

2. **Defense in depth** — Even with network isolation, consider
   adding lightweight security checks on Python endpoints too,
   in case of misconfiguration.

### Current status (development):
- Port 8000 is open on localhost for development/testing only
- All real traffic should flow through JS (port 3000) →
  security middleware → Python (port 8000)
- TODO in Sprint 5: Docker network config to enforce this in production

---

## Local Development Setup

Two servers must run simultaneously:

```bash
# Terminal 1 — JS Core
bun --watch server.js

# Terminal 2 — Python Security Layer
cd python
uv run uvicorn main:app --reload --port 8000
```

## Database

- MySQL via WAMP
- Prisma (JS) + SQLAlchemy (Python) both connect to the same
  `pyrex_db` database
- Prisma manages migrations (`bunx prisma migrate dev`)
- Python reads/writes via SQLAlchemy using the same tables