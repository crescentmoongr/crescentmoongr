# Crescent Reader v13.27 — Comment Like Diagnostics

- Separate diagnostic codes for session lookup, comment lookup, RPC toggle and unexpected errors.
- Log a short stage-specific error message on the Worker without logging credentials.
- Preserve successful toggles when the follow-up count query fails.
- No database schema changes or SQL required. Existing likes are untouched.
- Based on v13.26. Verify by deploying and checking Network > Response `code`.
