# v11.81 Notification — no chapter views

Changes from v11.81 Notification:
- Notification badge unchanged: 1–20 shows the real number; 21+ shows `20+`.
- Removed the reader call to `/api/stats/view`.
- Removed `src/pages/api/stats/view.ts`.
- Removed chapter/series view counts from Admin.
- Admin series list now fetches only series + chapter metadata for counts; it no longer fetches `chapter_stats`.
- Existing `chapter_stats` data/database objects are left untouched and are simply unused.
- No SQL migration is required.
- No `.sql` files are included in this ZIP.
