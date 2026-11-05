# Crescent Reader v13.09 — Reader limits removed

Base: v13.08.

- Removed in-memory 180 image requests/minute rate limit from `/api/page/[id]`.
- Extended reader session cookie to 400 days (maximum commonly enforced browser cookie lifetime), refreshed on each chapter page visit, including cookies issued with old 48-hour duration. Not literally infinite: browser can clear cookies, session can change, and private browsing may clear on close.
- **Password-protected series unlock cookie remains 48 hours** for security; not the same as reader session.
- Existing signed URL, series visibility and R2 access checks remain.
- No SQL. Not build-tested or deployed.
